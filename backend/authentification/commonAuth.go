package authentification

import (
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Create both a JWT token and a cookie containing it, with 1 hour of expiration time
func createTokenAndCookie(w http.ResponseWriter, jwtSecret []byte, idUser int32) error {
	expirationTime := time.Now().Add(1 * time.Hour)

	// Create the JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": idUser,
		"exp": expirationTime.Unix(),
	})
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "Error while generating JWT token : "+err.Error(), http.StatusInternalServerError)
		return err
	}

	// Create the cookie containing the token string
	http.SetCookie(w, &http.Cookie{
		Name:     "JWT",
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  expirationTime,
	})

	return nil
}
