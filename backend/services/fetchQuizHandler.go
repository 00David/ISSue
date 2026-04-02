package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/00David/ISSue/backend/ressources"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"google.golang.org/genai"
)

// BigDataCloud (reverse geocoding) API response structure
type ReverseGeocoding struct {
	Continent            string `json:"continent"`
	CountryName          string `json:"countryName"`
	PrincipalSubdivision string `json:"principalSubdivision"`
	City                 string `json:"city"`
	Locality             string `json:"locality"`
}

// Gemini response structure
type GeminiQuizResponse struct {
	Questions []GeminiQuestion `json:"questions"`
	Country   string           `json:"country"`
	Region    string           `json:"region"`
	Ocean     bool             `json:"ocean"`
}
type GeminiQuestion struct {
	Question      string   `json:"question"`
	Options       []string `json:"options"`
	IndexResponse int64    `json:"indexResponse"`
}

// "/api/fetch-quiz" handler
func FetchQuizHandler(db *mongo.Database, gemini_key string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/fetch-quiz'")

		// Only POST
		if r.Method != http.MethodPost {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// Gets the ISSPosition in database for the current day
		// if there is no ISSPosition, it is created into the database
		issPosition, err := ressources.GetISSPosition(db, r.Context(), time.Now())
		if err != nil && err == mongo.ErrNoDocuments {

			// Calls Open Notify API
			resp, err := http.Get("http://api.open-notify.org/iss-now.json")
			if err != nil {
				http.Error(w, "Error ISS API : "+err.Error(), http.StatusBadGateway)
				return
			}
			defer resp.Body.Close()

			// Body reading + JSON parsing
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				http.Error(w, "Error ISS API response reading : "+err.Error(), http.StatusInternalServerError)
				return
			}
			var raw ISSRawPosition
			if err := json.Unmarshal(body, &raw); err != nil {
				http.Error(w, "Error ISS API JSON parsing : "+err.Error(), http.StatusInternalServerError)
				return
			}

			// inserts the new ISSPosition into DB
			issPosition = ressources.ISSPosition{
				Date:      time.Unix(raw.Timestamp, 0),
				Timestamp: raw.Timestamp,
				Latitude:  raw.ISSPosition.Latitude,
				Longitude: raw.ISSPosition.Longitude,
			}
			_, err = ressources.CreateISSPosition(db, r.Context(), issPosition.Timestamp, issPosition.Latitude, issPosition.Longitude)
			if err != nil {
				http.Error(w, "New ISSPosition insertion failure : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		// Calls BigDataCloud API for reverse geocoding the ISS position
		resp, err := http.Get("https://api-bdc.io/data/reverse-geocode-client?latitude=" + issPosition.Latitude + "&longitude=" + issPosition.Longitude + "&localityLanguage=en")
		if err != nil {
			http.Error(w, "Error reverse geocoding API : "+err.Error(), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		// Body reading + JSON parsing
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Error reverse geocoding API response reading : "+err.Error(), http.StatusInternalServerError)
			return
		}
		var geoInfos ReverseGeocoding
		if err := json.Unmarshal(body, &geoInfos); err != nil {
			http.Error(w, "Error reverse geocoding API JSON parsing : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Gemini connection setup
		ctx := context.Background()
		client, err := genai.NewClient(ctx, &genai.ClientConfig{
			APIKey:  gemini_key,
			Backend: genai.BackendGeminiAPI,
		})

		// Prompt description
		locationDesc := fmt.Sprintf("Continent: %s, Country: %s, Region: %s, City: %s, Locality: %s",
			geoInfos.Continent, geoInfos.CountryName, geoInfos.PrincipalSubdivision, geoInfos.City, geoInfos.Locality)
		prompt := fmt.Sprintf(`Create a geography quiz based on this location: %s

			Instructions:
			- Generate EXACTLY 10 questions about this geographic location
			- Each question must be related to the location's geography, culture, history, or notable features
			- Questions must be general knowledge (max 200 characters each)
			- Each question has EXACTLY 4 options (max 80 characters each)
			- Only ONE option is correct per question
			- Provide the index (0-3) of the correct answer

			For the metadata:
			- "country": Use ISO standard country name (e.g., "France", "United States", "Japan"). If ocean, use the ocean name (e.g., "Pacific Ocean")
			- "region": The principal subdivision/region name. If ocean, use "" (empty string)
			- "ocean": true if the location is in an ocean, false otherwise

			Return ONLY valid JSON matching this exact structure, no additional text.`, locationDesc)

		config := &genai.GenerateContentConfig{
			ResponseMIMEType: "application/json",
			ResponseJsonSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"questions": map[string]any{
						"type": "array",
						"items": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"question": map[string]any{
									"type":        "string",
									"description": "The question text (max 200 characters)",
								},
								"options": map[string]any{
									"type": "array",
									"items": map[string]any{
										"type": "string",
									},
									"description": "Array of exactly 4 options (max 80 characters each)",
								},
								"indexResponse": map[string]any{
									"type":        "integer",
									"description": "Index (0-3) of the correct answer",
								},
							},
							"required": []string{"question", "options", "indexResponse"},
						},
					},
					"country": map[string]any{
						"type":        "string",
						"description": "ISO standard country name or ocean name",
					},
					"region": map[string]any{
						"type":        "string",
						"description": "Principal subdivision or empty string for oceans",
					},
					"ocean": map[string]any{
						"type":        "boolean",
						"description": "true if location is in an ocean",
					},
				},
				"required": []string{"questions", "country", "region", "ocean"},
			},
		}

		// Generate content
		genResp, err := client.Models.GenerateContent(
			ctx,
			"gemini-3-flash-preview",
			genai.Text(prompt),
			config,
		)
		if err != nil {
			http.Error(w, "Gemini generation error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Parse Gemini response
		if len(genResp.Candidates) == 0 || len(genResp.Candidates[0].Content.Parts) == 0 {
			http.Error(w, "Empty Gemini response", http.StatusInternalServerError)
			return
		}
		responseText := genResp.Text()
		var geminiQuiz GeminiQuizResponse
		if err := json.Unmarshal([]byte(responseText), &geminiQuiz); err != nil {
			http.Error(w, "Gemini JSON parsing error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Conversion of the questions to our Question entity
		questions := make([]ressources.Question, len(geminiQuiz.Questions))
		for i, q := range geminiQuiz.Questions {
			questions[i] = ressources.Question{
				NumQuestion:   int64(i),
				Question:      q.Question,
				Options:       q.Options,
				IndexResponse: q.IndexResponse,
			}
		}

		// Insertion of the quiz into our database
		_, err = ressources.CreateQuiz(db, r.Context(),
			issPosition.Date, questions, geminiQuiz.Country, geminiQuiz.Region, geminiQuiz.Ocean)
		if err != nil {
			http.Error(w, "New Quiz insertion failure : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "new quiz fetched from Gemini and inserted into database",
		})
	}
}
