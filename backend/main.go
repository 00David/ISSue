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
	"github.com/00David/ISSue/backend/utility"
	"github.com/joho/godotenv" // for local environment variables import
)

// Entry point for the backend :
//
// - If no parameter is given, i.e. by launching with go run *.go, a cloud MongoAtlas "issue" database is used
//
// - If a "local" parameter is given, i.e. by launching with go run *.go local, a local "issue" database is used
func main() {
	godotenv.Load() // loads local .env file if present

	port := os.Getenv("PORT")
	if port == "" {
		port = "4572"
	}

	host := os.Getenv("HOST")
	addr := host + ":" + port

	dbPassword := os.Getenv("DB_PASSWORD")

	geminiKey := os.Getenv("GEMINI_API_KEY")

	jwtSecret := []byte(os.Getenv("JWT_SECRET"))

	local_db := false
	if len(os.Args) == 2 && os.Args[1] == "local" {
		local_db = true
	}

	// Database connection
	client, db := utility.ConnectDatabase(dbPassword, local_db)
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
	http.HandleFunc("/api/resources/iss/", resources.ISSHandler(db))

	http.HandleFunc("/api/resources/quizzes/comments/", resources.QuizCommentsHandler(db))
	http.HandleFunc("/api/resources/quizzes", resources.QuizHandler(db))
	http.HandleFunc("/api/resources/quizzes/", resources.QuizHandler(db))

	http.HandleFunc("/api/resources/user-responses", resources.UserResponsesHandler(db, jwtSecret))
	http.HandleFunc("/api/resources/user-responses/", resources.UserResponsesHandler(db, jwtSecret))

	http.HandleFunc("/api/resources/users/leaderboard", resources.UsersLeaderboardHandler(db))
	http.HandleFunc("/api/resources/users/pin", resources.UsersPinQuizHandler(db, jwtSecret))
	http.HandleFunc("/api/resources/users/unpin", resources.UsersUnpinQuizHandler(db, jwtSecret))
	http.HandleFunc("/api/resources/users/responded/", resources.UsersRespondedQuizzesHandler(db))
	http.HandleFunc("/api/resources/users", resources.UsersHandler(db, jwtSecret))
	http.HandleFunc("/api/resources/users/", resources.UsersHandler(db, jwtSecret))

	fmt.Println("Server started on http://" + addr + " ✅")
	handler := utility.EnableCORS(http.DefaultServeMux)
	log.Fatal(http.ListenAndServe(addr, handler))
}
