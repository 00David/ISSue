package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/00David/ISSue/backend/handlers"
	"github.com/joho/godotenv" // for loading environment variables from the parent folder
)

// main.go
func main() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("Warning: .env file not found, using defaults")
	}

	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "4572"
	}

	host := os.Getenv("HOST")
	if host == "" {
		host = "localhost"
	}
	addr := host + ":" + port

	// Resquest handlers
	http.HandleFunc("/api/iss", handlers.ISSHandler)

	fmt.Println("Server started on http://" + addr + " ✅")
	http.ListenAndServe(addr, nil)
}
