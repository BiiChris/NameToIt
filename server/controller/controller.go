package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"os"

	db "github.com/biichris/go/sql"
	"github.com/gofiber/fiber/v2"
)

const openai_url = "https://api.openai.com/v1/chat/completions"
const prompt_context = ": Identify the name of what is being described, if its a purchasable item end with \"$#\". No full sentence as response, only single or composed words."
const model = "gpt-3.5-turbo"
const role = "user"
const max_tokens = 15

type controller struct {
	client        *http.Client
	APIKey        string
	base_req_body openai_request
	db            *sql.DB
}

func New() *controller {
	return &controller{
		client: &http.Client{},
		APIKey: "Bearer " + os.Getenv("OPENAI_API_KEY"),
		base_req_body: openai_request{
			Model: model,
			Messages: []struct {
				Role    string `json:"role"`
				Content string `json:"content"`
			}{{
				Role: role,
			}},
			Max_Tokens: max_tokens,
		},
		db: db.Sqlite(os.Getenv("DB_DIR")),
	}
}

type openai_request struct {
	Model    string `json:"model"`
	Messages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	Max_Tokens int `json:"max_tokens"`
}

func (u *controller) openai_body(prompt *string) ([]byte, error) {

	// Get base body
	req := u.base_req_body

	// Add user prompt
	req.Messages[0].Content = *prompt + prompt_context

	// Marshal to json
	b, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	return b, nil
}

type Openai_response struct {
	Choices []struct {
		FinishReason string `json:"finish_reason"`
		Message      struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func process_raw_response(raw *http.Response, prompt *string, db *sql.DB) (int64, string, error) {
	var raw_response Openai_response
	if err := json.NewDecoder(raw.Body).Decode(&raw_response); err != nil {
		return 0, "", err
	}

	response := raw_response.Choices[0].Message.Content
	if completed := raw_response.Choices[0].FinishReason == "stop"; !completed {
		return 0, "", errors.New("there was an error getting a response")
	}

	purchasable := response[len(response)-2:] == "$#"
	if purchasable {
		response = response[:len(response)-2]
	}

	res, err := db.Exec("INSERT INTO logs (prompt, response, purchasable) VALUES (?, ?, ?)", *prompt, response, purchasable)
	if err != nil {
		return 0, "", err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, "", err
	}

	return id, response, nil
}

func (u *controller) OpenAi(c *fiber.Ctx) error {

	prompt := c.Query("prompt")
	if len(prompt) < 10 || len(prompt) > 250 {
		return c.Status(400).JSON(fiber.Map{
			"error": "prompt must be between 10 and 250 characters",
		})
	}

	// Get Request Body
	req_body, err := u.openai_body(&prompt)
	if err != nil {
		return c.SendStatus(500)
	}

	// Create http request
	http, err := http.NewRequest("POST", openai_url, bytes.NewReader(req_body))
	if err != nil {
		return c.SendStatus(500)
	}

	// Set headers
	http.Header.Set("Authorization", u.APIKey)
	http.Header.Set("Content-Type", "application/json")

	// Send request to OpenAi API
	res, err := u.client.Do(http)
	if err != nil {
		return c.SendStatus(500)
	}
	defer res.Body.Close()

	// Process raw response
	id, final_response, err := process_raw_response(res, &prompt, u.db)
	if err != nil {
		return c.SendStatus(500)
	}

	// Return response
	return c.Status(200).JSON(fiber.Map{
		"id":       id,
		"response": final_response,
	})
}

type feedback_request struct {
	Id      uint `json:"id"`
	Success uint `json:"success"`
}

func (u *controller) FeedBack(c *fiber.Ctx) error {

	var feedback feedback_request
	if err := c.BodyParser(&feedback); err != nil {
		return c.SendStatus(400)
	}

	_, err := u.db.Exec("UPDATE logs SET success = ? WHERE ROWID = ?", feedback.Success, feedback.Id)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.SendStatus(200)
}
