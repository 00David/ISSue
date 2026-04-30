package authentification

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
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

		cookie, err := r.Cookie("JWT")
		if err != nil {
			http.Error(w, "Cookie error : "+err.Error(), http.StatusUnauthorized)
			return
		}
		tokenStr := cookie.Value

		// Parse the token
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, http.ErrAbortHandler
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Token parsing error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Token claims error : ", http.StatusInternalServerError)
			return
		}

		// Get the token's user id
		sub, ok := claims["sub"]
		if !ok {
			http.Error(w, "Missing sub", http.StatusUnauthorized)
			return
		}

		var tokenIdUser int32

		switch v := sub.(type) {
		case float64:
			tokenIdUser = int32(v)
		case string:
			id64, err := strconv.ParseInt(v, 10, 32)
			if err != nil {
				http.Error(w, "Invalid sub format", http.StatusInternalServerError)
				return
			}
			tokenIdUser = int32(id64)
		default:
			http.Error(w, "Invalid sub type", http.StatusInternalServerError)
			return
		}

		// Return the user id contained in the JWT token
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"id": int32(tokenIdUser),
		})

	}
}
