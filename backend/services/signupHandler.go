package services

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/00David/ISSue/backend/ressources"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

// Signup structure sent by the client
type SignupRequest struct {
	Username string `json:"username"` // username, unique for every user
	Email    string `json:"email"`    // user email, in case of password reseting, unique for every user
	Password string `json:"password"` // user password
}

// "/api/signup" handler
func SignupHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/signup'")

		// Only POST
		if r.Method != http.MethodPost {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// Body decoding
		var req SignupRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// We look if a user with the same username already exists
		_, err = ressources.GetUserWithInfo(db, r.Context(), "Username", req.Username)
		if err == nil {
			http.Error(w, "User already exists with the same username", http.StatusConflict)
			return
		}

		// We look if a user with the same email already exists
		_, err = ressources.GetUserWithInfo(db, r.Context(), "Email", req.Email)
		if err == nil {
			http.Error(w, "User already exists with the same email", http.StatusConflict)
			return
		}

		// The password is hashed, we're profesional here
		hashedPassword, err := bcrypt.GenerateFromPassword(
			[]byte(req.Password),
			bcrypt.DefaultCost,
		)
		if err != nil {
			http.Error(w, "Error hashing password", http.StatusInternalServerError)
			return
		}

		// The new user is created in the DB
		_, err = ressources.CreateUser(db, r.Context(), req.Username, req.Email, string(hashedPassword))
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		sessionID := "0" // TODO

		// User is automatically connected after signup
		http.SetCookie(w, &http.Cookie{
			Name:     "session_id",
			Value:    sessionID,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   3600, // 1 hour
		})

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "signup successful",
		})

	}
}
