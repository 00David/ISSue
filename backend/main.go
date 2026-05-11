package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/00David/ISSue/backend/authentification"
	"github.com/00David/ISSue/backend/external_apis"
	"github.com/00David/ISSue/backend/resources"
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

	dbPassword := os.Getenv("DB_PASSWORD")

	geminiKey := os.Getenv("GEMINI_API_KEY")

	jwtSecret := []byte(os.Getenv("JWT_SECRET"))

	local_db := false
	if len(os.Args) == 2 && os.Args[1] == "local" {
		local_db = true
	}

	// Database connection
	client, db := connect_db(dbPassword, local_db)
	defer func() {
		if err := client.Disconnect(context.Background()); err != nil {
			log.Println("⚠️ Disconnection error.\nDetails : ", err)
		}
	}()

	// Resquest handlers

	// Authentification
	http.HandleFunc("/api/authentification/me", authentification.MeHandler(db, jwtSecret))
	http.HandleFunc("/api/authentification/login", authentification.LoginHandler(db, jwtSecret))
	http.HandleFunc("/api/authentification/signup", authentification.SignupHandler(db, jwtSecret))
	http.HandleFunc("/api/authentification/logout", authentification.LogoutHandler(db, jwtSecret))

	// External API communications
	http.HandleFunc("/api/external/iss", external_apis.CurrentISSHandler(db))
	http.HandleFunc("/api/external/generate-quiz", external_apis.GenerateQuizHandler(db, geminiKey))

	// Resources
	http.HandleFunc("/api/resources/iss", resources.ISSHandler(db))
	http.HandleFunc("/api/resources/iss/", resources.ISSHandler(db))

	http.HandleFunc("/api/resources/quizzes", resources.QuizHandler(db))
	http.HandleFunc("/api/resources/quizzes/", resources.QuizHandler(db))

	http.HandleFunc("/api/resources/quiz-responses", resources.QuizResponsesHandler(db, jwtSecret))
	http.HandleFunc("/api/resources/quiz-responses/", resources.QuizResponsesHandler(db, jwtSecret))

	http.HandleFunc("/api/resources/users", resources.UsersHandler(db, jwtSecret))
	http.HandleFunc("/api/resources/users/", resources.UsersHandler(db, jwtSecret))

	fmt.Println("Server started on http://" + addr + " ✅")
	http.ListenAndServe(addr, nil)
}
