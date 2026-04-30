package authorizations

import (
	"net/http"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
)

// Retuns true if the user identified by the request token is the given expected user, otherwise false.
func IsUserAuthorized(r *http.Request, jwtSecret []byte, expectedIdUser int32) bool {

	cookie, err := r.Cookie("JWT")
	if err != nil {
		return false
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
		return false
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return false
	}

	// Get the token's user id
	tokenIdUserStr := claims["sub"].(string)
	tokenIdUser, err := strconv.ParseInt(tokenIdUserStr, 10, 32)
	if err != nil {
		return false
	}

	return int32(tokenIdUser) == expectedIdUser
}
