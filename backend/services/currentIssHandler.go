package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/00David/ISSue/backend/ressources"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// Open Notify (ISS) API response structure
type ISSRawPosition struct {
	Message     string `json:"message"`
	Timestamp   int64  `json:"timestamp"`
	ISSPosition struct {
		Latitude  string `json:"latitude"`
		Longitude string `json:"longitude"`
	} `json:"iss_position"`
}

// "/api/get-iss-current-position" handler
func CurrentISSHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
		var raw ISSRawPosition
		if err := json.Unmarshal(body, &raw); err != nil {
			http.Error(w, "Error JSON parsing", http.StatusInternalServerError)
			return
		}

		// Response construction
		position := ressources.ISSPosition{
			Date:      time.Unix(raw.Timestamp, 0),
			Timestamp: raw.Timestamp,
			Latitude:  raw.ISSPosition.Latitude,
			Longitude: raw.ISSPosition.Longitude,
		}

		// JSON sent to client
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(position)
	}
}
