package main

import (
	controller "server/controller"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func main() {
	app := fiber.New()

	// Middleware Config
	limiter := limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1,
	})

	cors := cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowMethods: "POST GET",
	})

	app.Use(cors, limiter)

	// Initialize controller
	controller := controller.New()

	// Server static files
	app.Static("/", "../public")

	// Route Handlers
	app.Get("/api", controller.OpenAi)
	app.Post("/feedback", controller.FeedBack)

	// Listen on port 8000
	app.Listen(":8000")
}
