package ressources

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// ============================================================
// =================== DATABASE OPERATIONS ====================
// ============================================================

var collectionNameISS = "isspositions"

// Returns an ISS Position in DB for a given date
func GetISSPosition(db *mongo.Database, ctx context.Context, date time.Time) (ISSPosition, error) {
	collection := db.Collection(collectionNameISS)

	// time interval containing 'date' exact day
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)
	filter := bson.M{
		"date": bson.M{
			"$gte": start,
			"$lt":  end,
		},
	}

	var isspos ISSPosition
	err := collection.FindOne(ctx, filter).Decode(&isspos)
	return isspos, err
}

// Returns the last ISS position in database
func GetLastISSPosition(db *mongo.Database, ctx context.Context) (ISSPosition, error) {
	collection := db.Collection(collectionNameISS)

	filter := options.FindOne().SetSort(
		bson.D{
			{Key: "timestamp", Value: -1},
		},
	)
	var isspos ISSPosition
	err := collection.FindOne(ctx, filter).Decode(&isspos)
	return isspos, err
}

// Creates an ISS position in database, returns its date
func CreateISSPosition(db *mongo.Database, ctx context.Context,
	timestamp int64, latitude string, longitude string) (time.Time, error) {
	collection := db.Collection(collectionNameISS)

	date := time.Unix(timestamp, 0)
	// We don't create a new ISS position when there is already one existing for the same date
	_, err := GetISSPosition(db, ctx, date)
	if err == nil {
		return time.Time{}, fmt.Errorf("An iss position already exists for the same day")
	}

	isspos := ISSPosition{
		Date:      date,
		Timestamp: timestamp,
		Latitude:  latitude,
		Longitude: longitude,
	}
	_, err = collection.InsertOne(ctx, isspos)
	if err != nil {
		return time.Time{}, err
	}
	return date, nil
}

// Deletes an ISS position in database for a given date
func DeleteISSPosition(db *mongo.Database, ctx context.Context, date time.Time) error {
	collection := db.Collection(collectionNameISS)

	// time interval containing 'date' exact day
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)

	filter := bson.M{
		"date": bson.M{
			"$gte": start,
			"$lt":  end,
		},
	}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// ============================================================
// ======================== HANDLER ===========================
// ============================================================

// "/api/iss[/dd-mm-yyyy]" handler
func ISSHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential date parameter
		dateStr := strings.TrimPrefix(r.URL.Path, "/api/iss/")

		if dateStr == "" {
			fmt.Println("Request received on '/api/iss'")
			ISShandlerWithoutDate(db, w, r)
		} else {
			fmt.Println("Request received on '/api/iss/date'")

			// Checks if the parameter is a date
			date, err := time.Parse(time.RFC3339, dateStr)
			if err == nil {
				ISShandlerWithDate(db, w, r, date)
			}

			if err != nil {
				http.Error(w, "Invalid parameter format, must be a date", http.StatusBadRequest)
				return
			}
		}

	}
}

// "/api/iss" handler
func ISShandlerWithoutDate(db *mongo.Database, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet: // GET

		// Getting last ISS position in DB
		issposition, err := GetLastISSPosition(db, r.Context())
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No ISS Position", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(issposition)

	case http.MethodPost: // POST

		// Body decoding
		var req ISSPosition
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Creation of the ISS position in DB
		date, err := CreateISSPosition(db, r.Context(), req.Timestamp, req.Latitude, req.Longitude)
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"message": "iss position successfully created in DB",
			"Date":    date,
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}

// "/api/iss/dd-mm-yyyy" handler
func ISShandlerWithDate(db *mongo.Database, w http.ResponseWriter, r *http.Request, date time.Time) {
	switch r.Method {
	case http.MethodGet: // GET

		// Getting the ISS position with this date in DB
		issposition, err := GetISSPosition(db, r.Context(), date)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No ISS Position for this date", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(issposition)

	case http.MethodDelete: // DELETE

		// Deletion of the ISS position in DB
		err := DeleteISSPosition(db, r.Context(), date)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No ISS Position for this date", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "iss position successfuly deleted from DB",
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}
