package authentification

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/00David/ISSue/backend/utility"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// "/api/authentification/me" handler
func MeHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/authentification/me'")

		// Only GET
		if r.Method != http.MethodGet {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// Extract user ID from JWT
		userID, err := utility.ExtractUserIDFromRequest(r, jwtSecret)
		if err != nil {
			switch err {
			case utility.ErrNoCookie:
				// Silent error - return -1 to avoid client console spam
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(map[string]any{"id": -1})
				return
			case utility.ErrInvalidToken:
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			case utility.ErrInvalidClaims, utility.ErrMissingSub, utility.ErrInvalidSub:
				http.Error(w, "Malformed token: "+err.Error(), http.StatusUnauthorized)
				return
			default:
				http.Error(w, "Authentication error", http.StatusInternalServerError)
				return
			}
		}

		// Extract username from JWT
		userName, err := utility.ExtractUsernameFromRequest(r, jwtSecret)
		if err != nil {
			switch err {
			case utility.ErrNoCookie:
				// Silent error - return -1 to avoid client console spam
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(map[string]any{"id": -1})
				return
			case utility.ErrInvalidToken:
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			case utility.ErrInvalidClaims, utility.ErrMissingName, utility.ErrInvalidName:
				http.Error(w, "Malformed token: "+err.Error(), http.StatusUnauthorized)
				return
			default:
				http.Error(w, "Authentication error", http.StatusInternalServerError)
				return
			}
		}

		// Return the user id and username contained in the JWT token
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"id":   int32(userID),
			"user": userName,
		})

	}
}
