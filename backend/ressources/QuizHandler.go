package ressources

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// ============================================================
// =================== DATABASE OPERATIONS ====================
// ============================================================

var collectionNameQuiz = "quizzes"

// Returns a Quiz in DB for a given id
func GetQuiz(db *mongo.Database, ctx context.Context, id int32) (Quiz, error) {
	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "IdQuiz", Value: id}}
	var quiz Quiz
	err := collection.FindOne(ctx, filter).Decode(&quiz)
	return quiz, err
}

// Returns a Quiz in DB for a given date
func GetQuizWithDate(db *mongo.Database, ctx context.Context, date time.Time) (Quiz, error) {
	collection := db.Collection(collectionNameQuiz)

	// time interval containing 'date' exact day
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)
	filter := bson.M{
		"date": bson.M{
			"$gte": start,
			"$lt":  end,
		},
	}

	var quiz Quiz
	err := collection.FindOne(ctx, filter).Decode(&quiz)
	return quiz, err
}

// Creates a Quiz in DB, returns its new id
func CreateQuiz(db *mongo.Database, ctx context.Context,
	date time.Time, questions []Question, country string, region string, ocean bool) (int32, error) {
	collection := db.Collection(collectionNameQuiz)

	// We don't create a new Quiz when there is already one existing for the same date
	_, err := GetQuizWithDate(db, ctx, date)
	if err == nil {
		return -1, fmt.Errorf("A Quiz already exists for the same day")
	}

	id, err := createUniqueId(collection, ctx, "IdQuiz")
	if err != nil {
		return -1, err
	}

	quiz := Quiz{
		IdQuiz:    id,
		Date:      date,
		Questions: questions,
		Country:   country,
		Region:    region,
		Ocean:     ocean,
	}
	_, err = collection.InsertOne(ctx, quiz)
	return id, err
}

// Deletes a Quiz in DB for a given id
func DeleteQuiz(db *mongo.Database, ctx context.Context, id int32) error {
	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "IdQuiz", Value: id}}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// ============================================================
// ======================== HANDLER ===========================
// ============================================================

// "/api/quizzes[/id]" handler
func QuizHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential id parameter
		idStr := strings.TrimPrefix(r.URL.Path, "/api/quizzes/")

		if idStr == "" {
			fmt.Println("Request received on '/api/quizzes'")
			quizHandlerWithoutId(db, w, r)
		} else {
			fmt.Println("Request received on '/api/quizzes/id'")
			// Checks that the parameter is an integer
			id64, err := strconv.ParseInt(idStr, 10, 32)
			if err != nil {
				http.Error(w, "Invalid id parameter format, must be an integer", http.StatusBadRequest)
				return
			}
			id := int32(id64)
			quizHandlerWithId(db, w, r, id)
		}

	}
}

// "/api/quizzes" handler
func quizHandlerWithoutId(db *mongo.Database, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost: // POST

		// Body decoding
		var req Quiz
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Creation of the Quiz in DB
		id, err := CreateQuiz(db, r.Context(), req.Date, req.Questions, req.Country, req.Region, req.Ocean)
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"message": "quiz successfuly created in DB",
			"IdQuiz":  id,
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}

// "/api/quizzes/id" handler
func quizHandlerWithId(db *mongo.Database, w http.ResponseWriter, r *http.Request, id int32) {
	switch r.Method {
	case http.MethodGet: // GET

		// Getting the Quiz with this id in DB
		quiz, err := GetQuiz(db, r.Context(), id)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No Quiz for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(quiz)

	case http.MethodDelete: // DELETE

		// Deletion of the Quiz in DB
		err := DeleteQuiz(db, r.Context(), id)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No Quiz for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "quiz successfuly deleted from DB",
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}
