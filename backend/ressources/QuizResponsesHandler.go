package ressources

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// ============================================================
// =================== DATABASE OPERATIONS ====================
// ============================================================

var collectionNameQuizR = "quizresponses"

// Returns a QuizResponses in DB for a given id
func GetQuizResponses(db *mongo.Database, ctx context.Context, id int32) (QuizResponses, error) {
	collection := db.Collection(collectionNameQuizR)

	filter := bson.D{{Key: "idQuizResponses", Value: id}}
	var quizR QuizResponses
	err := collection.FindOne(ctx, filter).Decode(&quizR)
	return quizR, err
}

// Creates a QuizResponses in DB, returns its new id
func CreateQuizResponses(db *mongo.Database, ctx context.Context,
	idQuiz int32, idUser int32, responses []Response, note int32, comment string) (int32, error) {
	collection := db.Collection(collectionNameQuizR)

	id, err := createUniqueId(collection, ctx, "idQuizResponses")
	if err != nil {
		return -1, err
	}
	quizR := QuizResponses{
		IdQuizResponses: id,
		IdQuiz:          idQuiz,
		IdUser:          idUser,
		Responses:       responses,
		Note:            note,
		Comment:         comment,
	}
	_, err = collection.InsertOne(ctx, quizR)
	return id, err
}

// Updates a QuizResponses note in DB for a given id
func UpdateQuizResponsesNote(db *mongo.Database, ctx context.Context,
	id int32, newNote int32) error {
	collection := db.Collection(collectionNameQuizR)

	filter := bson.D{{Key: "idQuizResponses", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "note", Value: newNote}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a QuizResponses comment in DB for a given id
func UpdateQuizResponsesComment(db *mongo.Database, ctx context.Context,
	id int32, newComment string) error {
	collection := db.Collection(collectionNameQuizR)

	filter := bson.D{{Key: "idQuizResponses", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "comment", Value: newComment}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Deletes a QuizResponses in DB for a given id
func DeleteQuizResponses(db *mongo.Database, ctx context.Context, id int32) error {
	collection := db.Collection(collectionNameQuizR)

	filter := bson.D{{Key: "idQuizResponses", Value: id}}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// ============================================================
// ======================== HANDLER ===========================
// ============================================================

// "/api/ressources/quiz-responses[/id]" handler
func QuizResponsesHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential id parameter
		idStr := strings.TrimPrefix(r.URL.Path, "/api/ressources/quiz-responses/")

		if idStr == "" {
			fmt.Println("Request received on '/api/ressources/quiz-responses'")
			quizResponsesHandlerWithoutId(db, w, r)
		} else {
			fmt.Println("Request received on '/api/ressources/quiz-responses/id'")
			// Checks that the parameter is an integer
			id64, err := strconv.ParseInt(idStr, 10, 32)
			if err != nil {
				http.Error(w, "Invalid id parameter format, must be an integer", http.StatusBadRequest)
				return
			}
			quizResponsesHandlerWithId(db, w, r, int32(id64))
		}

	}
}

// "/api/ressources/quiz-responses" handler
func quizResponsesHandlerWithoutId(db *mongo.Database, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost: // POST

		// Body decoding
		var req QuizResponses
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Creation of the QuizResponses in DB
		id, err := CreateQuizResponses(db, r.Context(), req.IdQuiz, req.IdUser, req.Responses, req.Note, req.Comment)
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"message":         "quiz responses successfuly created in DB",
			"idQuizResponses": id,
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}

// "/api/ressources/quiz-responses/id" handler
func quizResponsesHandlerWithId(db *mongo.Database, w http.ResponseWriter, r *http.Request, id int32) {
	switch r.Method {
	case http.MethodGet: // GET

		// Getting the QuizResponses with this id in DB
		quizR, err := GetQuizResponses(db, r.Context(), id)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No Quiz responses for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(quizR)

	case http.MethodDelete: // DELETE

		// Deletion of the QuizResponses in DB
		err := DeleteQuizResponses(db, r.Context(), id)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No Quiz responses for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "quiz responses successfuly deleted from DB",
		})

	case http.MethodPatch: // PATCH

		// Body decoding
		var req QuizResponses
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Update of the Quiz responses note in DB, if needed
		if req.Note != 0 {
			err := UpdateQuizResponsesNote(db, r.Context(), id, req.Note)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No Quiz responses for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
		// Update of the Quiz responses comment in DB, if needed
		if req.Comment != "" {
			err := UpdateQuizResponsesComment(db, r.Context(), id, req.Comment)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No Quiz responses for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "quiz responses information(s) successfuly updated in DB",
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}
