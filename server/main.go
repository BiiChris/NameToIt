package main

import (
	"crypto/tls"
	"log"
	"net"
	"os"
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
	app.Static("/", "../web")

	// Route Handlers
	app.Get("/api", controller.OpenAi)
	app.Post("/feedback", controller.FeedBack)

	// Redirect http to https
	go func() {
		http := fiber.New()

		// Redirect handler
		http.Use(func(c *fiber.Ctx) error {
			return c.Redirect("https://nametoit.com"+c.OriginalURL(), 301)
		})

		// Listen for http requests
		log.Fatalln(http.Listen(":80"))
	}()

	// Get tls listener
	tls_listener := get_tls()

	// Init server listener
	if err := app.Listener(tls_listener); err != nil {
		log.Fatalln("Error creating server listener")
	}
}

func get_tls() (listener net.Listener) {
	cert_path := os.Getenv("TLS_CERT_PATH")
	key_path := os.Getenv("TLS_KEY_PATH")

	cert, err := tls.LoadX509KeyPair(cert_path, key_path)
	if err != nil {
		log.Fatalln("Error loading tls certificate")
	}

	tls_config := &tls.Config{
		Certificates:             []tls.Certificate{cert},
		MinVersion:               tls.VersionTLS13,
		InsecureSkipVerify:       false,
		PreferServerCipherSuites: true,
	}

	listener, err = net.Listen("tcp", ":443")
	if err != nil {
		log.Fatalln("Error creating tls listener")
	}

	listener = tls.NewListener(listener, tls_config)

	return
}
