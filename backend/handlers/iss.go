package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// Structure de la réponse de l'API Open Notify (ISS)
type ISSRawResponse struct {
	Message     string `json:"message"`
	Timestamp   int64  `json:"timestamp"`
	ISSPosition struct {
		Latitude  string `json:"latitude"`
		Longitude string `json:"longitude"`
	} `json:"iss_position"`
}

// Structure qu'on renvoie au client
type ISSPosition struct {
	Timestamp int64  `json:"timestamp"`
	Latitude  string `json:"latitude"`
	Longitude string `json:"longitude"`
}

// "/api/iss"
func ISSHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Requête reçue sur '/api/iss'")

	// Uniquement GET
	if r.Method != http.MethodGet {
		http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		return
	}

	// Appel à l'API Open Notify
	resp, err := http.Get("http://api.open-notify.org/iss-now.json")
	if err != nil {
		http.Error(w, "Erreur API ISS", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Lecture du body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Erreur lecture réponse", http.StatusInternalServerError)
		return
	}

	// Parsing JSON
	var raw ISSRawResponse
	if err := json.Unmarshal(body, &raw); err != nil {
		http.Error(w, "Erreur parsing JSON", http.StatusInternalServerError)
		return
	}

	// Construction de la réponse
	position := ISSPosition{
		Latitude:  raw.ISSPosition.Latitude,
		Longitude: raw.ISSPosition.Longitude,
		Timestamp: raw.Timestamp,
	}

	// Envoi au client en JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(position)
}
