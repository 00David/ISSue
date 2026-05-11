package utility

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Get the suffix parameters of a request URL (after the last "/")
func GetSuffixParams(prefix string, r *http.Request) string {
	// Normalize the path (remove the potential final /)
	path := strings.TrimSuffix(r.URL.Path, "/")

	// Extract potential parameters
	var params string
	if strings.HasPrefix(path, prefix) {
		params = strings.TrimPrefix(path, prefix)
	}

	return params
}

// Create both a JWT token and a cookie containing it, with 1 hour of expiration time
func CreateTokenAndCookie(w http.ResponseWriter, jwtSecret []byte, idUser int32) error {
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

// Errors
var (
	ErrNoCookie      = errors.New("no JWT cookie found")
	ErrInvalidToken  = errors.New("invalid token")
	ErrInvalidClaims = errors.New("invalid token claims")
	ErrMissingSub    = errors.New("missing sub claim")
	ErrInvalidSub    = errors.New("invalid sub format")
)

// Extracts and validates the user ID from JWT cookie
func ExtractUserIDFromRequest(r *http.Request, jwtSecret []byte) (int32, error) {
	// Get JWT cookie
	cookie, err := r.Cookie("JWT")
	if err != nil {
		return -1, ErrNoCookie
	}

	// Parse and validate token
	token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return -1, ErrInvalidToken
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return -1, ErrInvalidClaims
	}

	// Get user ID from sub claim
	sub, ok := claims["sub"]
	if !ok {
		return -1, ErrMissingSub
	}

	// Convert sub to int32
	var userID int32
	switch v := sub.(type) {
	case float64:
		return int32(v), nil
	case string:
		id64, err := strconv.ParseInt(v, 10, 32)
		if err != nil {
			return -1, ErrInvalidSub
		}
		userID = int32(id64)
	default:
		return -1, ErrInvalidSub
	}

	return userID, nil
}

// Retuns true if the user identified by the request token is the given expected user, otherwise false.
func IsUserAuthorized(r *http.Request, jwtSecret []byte, expectedIdUser int32) bool {

	userId, err := ExtractUserIDFromRequest(r, jwtSecret)
	if err != nil {
		return false
	}

	return userId == expectedIdUser
}
