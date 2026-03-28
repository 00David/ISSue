package services

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/00David/ISSue/backend/ressources"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// Login structure sent by the client
type LoginRequest struct {
	Username string `json:"username"` // username, unique for every user
	Password string `json:"password"` // user password
}

// "/api/login" handler
func LoginHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/login'")

		// Only POST
		if r.Method != http.MethodPost {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// Body decoding
		var req LoginRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// We get the user thanks to its given username
		user, err := ressources.GetUserWithInfo(db, r.Context(), "Username", req.Username)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "User not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}

		sessionID := "0" // TODO

		// Password check
		if user.Password == req.Password {
			http.SetCookie(w, &http.Cookie{
				Name:     "session_id",
				Value:    sessionID,
				Path:     "/",
				HttpOnly: true,
				SameSite: http.SameSiteLaxMode,
				MaxAge:   3600, // 1 hour
			})

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"message": "signup successful",
			})

		} else {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

	}
}
