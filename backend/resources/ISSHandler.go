package resources

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/00David/ISSue/backend/utility"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
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

// "/api/resources/iss/date" handler
func ISSHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// Only GET
		if r.Method != http.MethodGet {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// gets the potential date parameter
		dateStr := utility.GetSuffixParams("/api/resources/iss/", r)

		// Checks if the parameter is a date
		date, err := time.Parse(time.RFC3339, dateStr)
		if err != nil {
			http.Error(w, "Invalid parameter format, must be a date", http.StatusBadRequest)
			return
		}

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
	}
}
