package resources

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/00David/ISSue/backend/utility"
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
	idQuiz int32, idUser int32, responses []Response, responseDate time.Time, note int32, comment string) (int32, error) {
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
		ResponseDate:    responseDate,
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

// "/api/resources/quiz-responses[/params]" handler
func QuizResponsesHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential id parameter
		idStr := utility.GetSuffixParams("/api/resources/quiz-responses/", r)

		// gets the potential quiz and user parameters
		query := r.URL.Query()
		idQuizStr := query.Get("idquiz")
		idUserStr := query.Get("iduser")

		if idStr == "" && len(query) == 0 {
			fmt.Println("Request received on '/api/resources/quiz-responses'")
			quizResponsesHandlerWithoutId(db, w, r, jwtSecret)
		} else if idQuizStr != "" && idUserStr != "" {
			fmt.Println("Request received on '/api/resources/quiz-responses?idquiz=’id1’&iduser=’id2’'")
			quizResponsesHandlerWithQuizAnsUser(db, w, r, idQuizStr, idUserStr)
		} else {
			fmt.Println("Request received on '/api/resources/quiz-responses/id'")
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

// "/api/resources/quiz-responses" handler
func quizResponsesHandlerWithoutId(db *mongo.Database, w http.ResponseWriter,
	r *http.Request, jwtSecret []byte) {

	// Only POST
	if r.Method != http.MethodPost {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// Body decoding
	var req QuizResponses
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Extract user ID from JWT
	userID, err := utility.ExtractUserIDFromRequest(r, jwtSecret)
	if err != nil {
		switch err {
		case utility.ErrNoCookie:
			http.Error(w, "Missing authentication cookie", http.StatusUnauthorized)
			return
		case utility.ErrInvalidToken:
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		case utility.ErrInvalidClaims, utility.ErrMissingSub, utility.ErrInvalidSub:
			http.Error(w, "Malformed token: "+err.Error(), http.StatusUnauthorized)
			return
		default:
			http.Error(w, "Authentication error", http.StatusInternalServerError)
			return
		}
	}

	// Creation of the QuizResponses in DB
	idQuizR, err := CreateQuizResponses(db, r.Context(), req.IdQuiz, req.IdUser, req.Responses, time.Now().UTC(), req.Note, req.Comment)
	if err != nil {
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update user's responded quizzes ids
	err = AddUserRespondedQuiz(db, r.Context(), userID, idQuizR)
	if err != nil {
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update quiz responded quizzes ids
	err = AddQuizRespondedQuiz(db, r.Context(), req.IdQuiz, idQuizR)
	if err != nil {
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"message":         "quiz responses successfuly created in DB",
		"idQuizResponses": idQuizR,
	})
}

// "/api/resources/quiz-responses?idquiz=’id1’&iduser=’id2’" handler
func quizResponsesHandlerWithQuizAnsUser(db *mongo.Database, w http.ResponseWriter,
	r *http.Request, idQuizStr string, idUserStr string) {

	// Only GET
	if r.Method != http.MethodGet {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// Verify the query parameters format
	if idQuizStr == "" {
		http.Error(w, "missing idquiz", http.StatusBadRequest)
		return
	}
	if idUserStr == "" {
		http.Error(w, "missing iduser", http.StatusBadRequest)
		return
	}

	idQuiz64, err := strconv.ParseInt(idQuizStr, 10, 32)
	if err != nil {
		http.Error(w, "invalid idquiz", http.StatusBadRequest)
		return
	}
	idUser64, err := strconv.ParseInt(idUserStr, 10, 32)
	if err != nil {
		http.Error(w, "invalid iduser", http.StatusBadRequest)
		return
	}
	idQuiz := int32(idQuiz64)
	idUser := int32(idUser64)

	// Get the User in DB
	user, err := GetUser(db, r.Context(), idUser)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "No User for this id", http.StatusNotFound)
			return
		}
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Search among responded quizzes if one has responded to the given quiz
	for _, idRespondedQuizes := range user.RespondedQuizzes {
		quizR, err := GetQuizResponses(db, r.Context(), idRespondedQuizes)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No Quiz responses for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Return the quiz responses if found
		if quizR.IdQuiz == idQuiz {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(quizR)
			return
		}
	}

	http.Error(w, "No Quiz responses for those user and quiz ids", http.StatusNotFound)
}

// "/api/resources/quiz-responses/id" handler
func quizResponsesHandlerWithId(db *mongo.Database, w http.ResponseWriter, r *http.Request, id int32) {

	// Only GET
	if r.Method != http.MethodGet {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

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
}
