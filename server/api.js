import { Configuration, OpenAIApi } from "openai";
import rateLimit from 'express-rate-limit'
import express from "express"
import cors from "cors"
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()
const __dirname = path.dirname('')
const buildPath = path.join(__dirname   ,   '../client/build')

const app = express();
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15000,
    message: 'There have been too many requests to our servers'
})

const configuration = new Configuration({
    apiKey: process.env.API_KEY
});

const openai = new OpenAIApi(configuration);

const prompt = (description) => {
    return `"${description}":
    
    Identify the name of what is being described, if its a purchasable
    item end with "$#". No full sentence as response.`
};

class db_data {

    constructor(prompt, response, product, finish_reason, feedback = 'None') {
        this.prompt = prompt
        this.response = response
        this.product = product
        this.finish_reason = finish_reason
        this.feedback = feedback
    };
};

let db;

app.use(express.static(buildPath),
    cors({
    origin: 'http://localhost:4000',
    methods: 'POST'
  }),
  express.json(),
  limiter);

app.get('/', function (req, res){

    res.sendFile(
        path.join(__dirname, 'client/build/index.html'),
        function(err) {
            if (err) {
                res.status(500).send(err);
            }
        }
    )
});

app.post("/api", async function (req,res) {

    const userPrompt = req.body.userInput || '';
    if (userPrompt.trim().lentgh < 10 || userPrompt.trim().lentgh > 250) {
        res.status(400).json({
            error: {
                message: "Please enter a valid input"
            }
        })
    }

    try {
        await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            max_tokens: 15,
            temperature: 0,
            messages: [{ role: "user", content: prompt(userPrompt)}]
        }).then (response => {
            const data = response.data.choices[0]

            db = new db_data(
                userPrompt,
                data.message.content.slice(-3).includes("$#") ? data.message.content.slice(0 , data.message.content.indexOf("$#")) : data.message.content,
                data.message.content.slice(-3).includes("$#"),
                data.finish_reason)

            if (db.finish_reason !== 'stop') {
                res.status(400).json({
                    error: {
                        message: "Error fetching your result. Please try again"
                    }
                })
            }

        })

        const jsonData = JSON.stringify(db, null, 2);

        fs.writeFile('db.json', jsonData, 'utf-8', ()=> {
            console.log('Data written successfully')
        })

        res.status(200).json({result : db.response})

    } catch(error) {
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
            res.status(500).json({
                error: {
                    message: 'An error occurred during your request.',
            }
            });
        }
    }
})

app.listen(4000, ()=> console.log('Server is listening'))