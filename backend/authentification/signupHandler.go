package authentification

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/00David/ISSue/backend/resources"
	"github.com/00David/ISSue/backend/utility"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"
)

// Signup structure sent by the client
type SignupRequest struct {
	Username string `json:"username"` // entered username
	Email    string `json:"email"`    // entered email
	Password string `json:"password"` // entered password
}

// "/api/authentification/signup" handler
func SignupHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/authentification/signup'")

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
		_, err = resources.GetUserWithInfo(db, r.Context(), "username", req.Username)
		if err == nil {
			http.Error(w, "User already exists with the same username", http.StatusConflict)
			return
		}

		// We look if a user with the same email already exists
		_, err = resources.GetUserWithInfo(db, r.Context(), "email", req.Email)
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
		idUser, err := resources.CreateUser(db, r.Context(), req.Username, req.Email, string(hashedPassword), time.Now().UTC())
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Create the JWT token and the cookie containing it
		err = utility.CreateTokenAndCookie(w, jwtSecret, idUser, req.Username)
		if err != nil {
			http.Error(w, "Error while generating JWT token : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "signup successful",
		})

	}
}
