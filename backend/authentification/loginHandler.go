package authentification

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/00David/ISSue/backend/resources"
	"github.com/00David/ISSue/backend/utility"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

// Login structure sent by the client
type LoginRequest struct {
	Username string `json:"username"` // entered username
	Password string `json:"password"` // entered password
}

// "/api/authentification/login" handler
func LoginHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/authentification/login'")

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
		user, err := resources.GetUserWithInfo(db, r.Context(), "username", req.Username)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				fmt.Println("Ici")
				http.Error(w, "User not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Password check
		err = bcrypt.CompareHashAndPassword(
			[]byte(user.Password),
			[]byte(req.Password),
		)
		if err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// Create the JWT token and the cookie containing it
		err = utility.CreateTokenAndCookie(w, jwtSecret, user.IdUser, user.Username)
		if err != nil {
			http.Error(w, "Error while generating JWT token : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "login successful",
		})

	}
}
