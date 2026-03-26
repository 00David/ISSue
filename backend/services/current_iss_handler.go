package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/00David/ISSue/backend/ressources/entities"
)

// Open Notify (ISS) API response structure
type ISSRawResponse struct {
	Message     string `json:"message"`
	Timestamp   int64  `json:"timestamp"`
	ISSPosition struct {
		Latitude  string `json:"latitude"`
		Longitude string `json:"longitude"`
	} `json:"iss_position"`
}

// "/api/get-iss-current-position"
func ISSHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Request received on '/api/get-iss-current-position'")

	// Only GET
	if r.Method != http.MethodGet {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// Calls Open Notify API
	resp, err := http.Get("http://api.open-notify.org/iss-now.json")
	if err != nil {
		http.Error(w, "Error ISS API", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Body reading
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Error response reading", http.StatusInternalServerError)
		return
	}

	// JSON parsing
	var raw ISSRawResponse
	if err := json.Unmarshal(body, &raw); err != nil {
		http.Error(w, "Error JSON parsing", http.StatusInternalServerError)
		return
	}

	// Response construction
	position := entities.ISSPosition{
		Latitude:  raw.ISSPosition.Latitude,
		Longitude: raw.ISSPosition.Longitude,
		Timestamp: raw.Timestamp,
	}

	// JSON sent to client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(position)
}
