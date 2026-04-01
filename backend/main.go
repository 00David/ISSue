package main

import (
	"context"
	"fmt"
	"log"
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

	gemini_key := os.Getenv("GEMINI_API_KEY")

	// Database connection
	client, db := connect_db(db_password)
	defer func() {
		if err := client.Disconnect(context.Background()); err != nil {
			log.Println("⚠️ Disconnection error.\nDetails : ", err)
		}
	}()

	// Resquest handlers
	// Services
	http.HandleFunc("/api/get-iss-current-position", services.CurrentISSHandler(db))
	http.HandleFunc("/api/login", services.LoginHandler(db))
	http.HandleFunc("/api/signup", services.SignupHandler(db))
	http.HandleFunc("/api/fetch-quiz", services.FetchQuizHandler(db, gemini_key))
	// Ressources
	http.HandleFunc("/api/iss", ressources.ISSHandler(db))
	http.HandleFunc("/api/quizzes", ressources.QuizHandler(db))
	http.HandleFunc("/api/quiz-responses", ressources.QuizResponsesHandler(db))
	http.HandleFunc("/api/users", ressources.UsersHandler(db))

	fmt.Println("Server started on http://" + addr + " ✅")
	http.ListenAndServe(addr, nil)
}
