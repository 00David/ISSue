package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/00David/ISSue/backend/services"
	"github.com/joho/godotenv"
)

// main.go
func main() {
	godotenv.Load() // loads local .env file if present

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

	// Services
	http.HandleFunc("/api/get-iss-current-position", services.ISSHandler)

	// Ressources

	fmt.Println("Server started on http://" + addr + " ✅")
	http.ListenAndServe(addr, nil)
}
