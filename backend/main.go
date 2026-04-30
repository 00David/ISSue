package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/00David/ISSue/backend/authentification"
	"github.com/00David/ISSue/backend/external_apis"
	"github.com/00David/ISSue/backend/ressources"
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

	// Ressources
	http.HandleFunc("/api/ressources/iss", ressources.ISSHandler(db))
	http.HandleFunc("/api/ressources/iss/", ressources.ISSHandler(db))

	http.HandleFunc("/api/ressources/quizzes", ressources.QuizHandler(db))
	http.HandleFunc("/api/ressources/quizzes/", ressources.QuizHandler(db))

	http.HandleFunc("/api/ressources/quiz-responses", ressources.QuizResponsesHandler(db))
	http.HandleFunc("/api/ressources/quiz-responses/", ressources.QuizResponsesHandler(db))

	http.HandleFunc("/api/ressources/users", ressources.UsersHandler(db, jwtSecret))
	http.HandleFunc("/api/ressources/users/", ressources.UsersHandler(db, jwtSecret))

	fmt.Println("Server started on http://" + addr + " ✅")
	http.ListenAndServe(addr, nil)
}
