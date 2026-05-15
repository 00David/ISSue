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

var collectionNameQuiz = "quizzes"

// Returns a Quiz in DB for a given id
func GetQuiz(db *mongo.Database, ctx context.Context, id int32) (Quiz, error) {
	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "idQuiz", Value: id}}
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
	date time.Time, questions []Question, country string, countryCode string, region string, ocean bool) (int32, error) {
	collection := db.Collection(collectionNameQuiz)

	// We don't create a new Quiz when there is already one existing for the same date
	_, err := GetQuizWithDate(db, ctx, date)
	if err == nil {
		return -1, fmt.Errorf("A Quiz already exists for the same day")
	}

	id, err := createUniqueId(collection, ctx, "idQuiz")
	if err != nil {
		return -1, err
	}

	quiz := Quiz{
		IdQuiz:           id,
		Date:             date,
		Questions:        questions,
		Country:          country,
		CountryCode:      countryCode,
		Region:           region,
		Ocean:            ocean,
		RespondedQuizzes: []int32{},
	}
	_, err = collection.InsertOne(ctx, quiz)
	return id, err
}

// Updates a Quiz responded quizzes indexes
func UpdateQuizRespondedQuizzes(db *mongo.Database, ctx context.Context,
	id int32, newRespondedQuizzes []int32) error {
	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "idQuiz", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "respondedQuizzes", Value: newRespondedQuizzes}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a Quiz responded quizzes indexes by adding a given new response index
func AddQuizRespondedQuiz(db *mongo.Database, ctx context.Context,
	id int32, newRespondedQuizId int32) error {

	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "idQuiz", Value: id}}
	update := bson.D{
		{Key: "$push", Value: bson.D{
			{Key: "respondedQuizzes", Value: newRespondedQuizId},
		}},
	}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a Quiz responded quizzes indexes by deleting a given existing response index
func DeleteQuizRespondedQuiz(db *mongo.Database, ctx context.Context,
	id int32, respondedQuizId int32) error {

	quiz, err := GetQuiz(db, ctx, id)
	if err != nil {
		return err
	}

	// Create new slice without the target id
	newRespondedQuizzes := make([]int32, 0, len(quiz.RespondedQuizzes))
	for _, v := range quiz.RespondedQuizzes {
		if v != respondedQuizId {
			newRespondedQuizzes = append(newRespondedQuizzes, v)
		}
	}

	err = UpdateQuizRespondedQuizzes(db, ctx, id, newRespondedQuizzes)
	return err
}

// Deletes a Quiz in DB for a given id
func DeleteQuiz(db *mongo.Database, ctx context.Context, id int32) error {
	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "idQuiz", Value: id}}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// ============================================================
// ======================== HANDLER ===========================
// ============================================================

// "/api/resources/quizzes[/param]" handler. param can be a quiz id or a date.
func QuizHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential parameter
		paramStr := utility.GetSuffixParams("/api/resources/quizzes/", r)

		if paramStr == "" {
			fmt.Println("Request received on '/api/resources/quizzes'")
			quizHandlerWithoutParam(db, w, r)
		} else {
			fmt.Println("Request received on '/api/resources/quizzes/param'")

			// Checks if the parameter is an integer
			id64, err := strconv.ParseInt(paramStr, 10, 32)
			if err == nil {
				quizHandlerWithId(db, w, r, int32(id64))
				return
			}

			// Checks if the parameter is a date
			date, err := time.Parse(time.RFC3339, paramStr)
			if err == nil {
				quizHandlerWithDate(db, w, r, date)
				return
			}

			http.Error(w, "Invalid parameter format, must be an integer or a date", http.StatusBadRequest)
		}

	}
}

// "/api/resources/quizzes" handler
func quizHandlerWithoutParam(db *mongo.Database, w http.ResponseWriter, r *http.Request) {
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
		id, err := CreateQuiz(db, r.Context(), time.Now().UTC(), req.Questions, req.Country, req.Region, req.CountryCode, req.Ocean)
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"message": "quiz successfuly created in DB",
			"idQuiz":  id,
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}

// "/api/resources/quizzes/date" handler
func quizHandlerWithDate(db *mongo.Database, w http.ResponseWriter, r *http.Request, date time.Time) {
	switch r.Method {
	case http.MethodGet: // GET

		// Getting the Quiz with this date in DB
		quiz, err := GetQuizWithDate(db, r.Context(), date)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No Quiz for this date", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(quiz)

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}

// "/api/resources/quizzes/id" handler
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

// "/api/resources/quizzes/comments/id" handler, with id being a quiz id.
func QuizCommentsHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential parameter
		paramStr := utility.GetSuffixParams("/api/resources/quizzes/comments/", r)

		if paramStr == "" {
			http.Error(w, "No quiz id given", http.StatusBadRequest)
			return
		} else {
			fmt.Println("Request received on '/api/resources/quizzes/comments/id'")

			// Checks if the parameter is an integer
			id64, err := strconv.ParseInt(paramStr, 10, 32)
			if err != nil {
				http.Error(w, "Invalid parameter format, must be an integer", http.StatusBadRequest)
				return
			}
			idQuiz := int32(id64)

			// Get the Quiz with this id in DB
			quiz, err := GetQuiz(db, r.Context(), idQuiz)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No Quiz for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}

			comments := make([]Comment, 0)
			// Search for responses to quizzes : get their informations for our comments
			for _, idResponses := range quiz.RespondedQuizzes {

				// Get the QuizResponses
				responses, err := GetQuizResponses(db, r.Context(), idResponses)
				if err != nil {
					if err == mongo.ErrNoDocuments {
						http.Error(w, "No Quiz responses for this id", http.StatusNotFound)
						return
					}
					http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
					return
				}

				// Get the User (for its username)
				user, err := GetUser(db, r.Context(), responses.IdUser)
				if err != nil {
					if err == mongo.ErrNoDocuments {
						http.Error(w, "No User for this id", http.StatusNotFound)
						return
					}
					http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
					return
				}

				// Create and add the comment to the resulting slice, if at least a note or a comment were given
				if responses.Note > 0 || responses.Comment != "" {
					comment := Comment{
						IdUser:   responses.IdUser,
						Username: user.Username,
						Date:     responses.ResponseDate,
						Note:     responses.Note,
						Comment:  responses.Comment,
					}
					comments = append(comments, comment)
				}
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(comments)
		}
	}
}
