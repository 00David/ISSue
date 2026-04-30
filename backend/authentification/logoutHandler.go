package authentification

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

// "/api/authentification/logout" handler
func LogoutHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/authentification/logout'")

		// Only POST
		if r.Method != http.MethodPost {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// Delete the cookie (containing the JWT token)
		http.SetCookie(w, &http.Cookie{
			Name:     "JWT",
			Value:    "",
			Path:     "/",
			HttpOnly: true,
			Expires:  time.Unix(0, 0),
			MaxAge:   -1,
		})

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "logout successful",
		})

	}
}
