package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/00David/ISSue/backend/ressources"
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

	db_password := os.Getenv("DB_PASSWORD")

	// Database connection
	db := connect_db(db_password)

	// Resquest handlers
	// Services
	http.HandleFunc("/api/get-iss-current-position", services.CurrentISSHandler(db))
	http.HandleFunc("/api/login", services.LoginHandler(db))
	http.HandleFunc("/api/signup", services.SignupHandler(db))
	// Ressources
	http.HandleFunc("/api/iss", ressources.ISSHandler(db))
	http.HandleFunc("/api/quizzes", ressources.QuizHandler(db))
	http.HandleFunc("/api/quiz-responses", ressources.QuizResponsesHandler(db))
	http.HandleFunc("/api/users", ressources.UsersHandler(db))

	fmt.Println("Server started on http://" + addr + " ✅")
	http.ListenAndServe(addr, nil)
}
