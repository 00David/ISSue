package resources

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
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

// Returns a Quiz in DB for a given id, with stats on its responses
func GetQuizWithStats(db *mongo.Database, ctx context.Context, id int32) (QuizWithStats, error) {
	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "idQuiz", Value: id}}
	var quiz Quiz
	err := collection.FindOne(ctx, filter).Decode(&quiz)
	if err != nil {
		return QuizWithStats{}, err
	}

	return toQuizWithStats(db, ctx, quiz)
}

// Returns a Quiz in DB for a given date, with stats on its responses
func GetQuizWithDateWithStats(db *mongo.Database, ctx context.Context, date time.Time) (QuizWithStats, error) {
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
	if err != nil {
		return QuizWithStats{}, err
	}

	return toQuizWithStats(db, ctx, quiz)
}

// Returns all quizzes in DB
func GetAllQuizzes(db *mongo.Database, ctx context.Context) ([]Quiz, error) {
	collection := db.Collection(collectionNameQuiz)

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var quizzes []Quiz

	for cursor.Next(ctx) {
		var quiz Quiz
		err = cursor.Decode(&quiz)
		if err != nil {
			return nil, err
		}
		quizzes = append(quizzes, quiz)
	}

	err = cursor.Err()
	if err != nil {
		return nil, err
	}

	return quizzes, nil
}

// Returns all quizzes in DB, with their stats on them
func GetAllQuizzesWithStats(db *mongo.Database, ctx context.Context) ([]QuizWithStats, error) {
	collection := db.Collection(collectionNameQuiz)

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var quizzes []QuizWithStats

	for cursor.Next(ctx) {
		var quiz Quiz
		err = cursor.Decode(&quiz)
		if err != nil {
			return nil, err
		}
		quizStats, err := toQuizWithStats(db, ctx, quiz)
		if err != nil {
			return nil, err
		}
		quizzes = append(quizzes, quizStats)
	}

	err = cursor.Err()
	if err != nil {
		return nil, err
	}

	return quizzes, nil
}

// Creates a Quiz in DB, returns its new id
func CreateQuiz(db *mongo.Database, ctx context.Context,
	date time.Time, questions []QuizQuestion, country string, countryCode string, region string, ocean bool) (int32, error) {
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
		IdQuiz:        id,
		Date:          date,
		Questions:     questions,
		Country:       country,
		CountryCode:   countryCode,
		Region:        region,
		Ocean:         ocean,
		UserResponses: []int32{},
	}
	_, err = collection.InsertOne(ctx, quiz)
	return id, err
}

// Updates a Quiz user responses indexes
func UpdateQuizUserResponses(db *mongo.Database, ctx context.Context,
	id int32, newUserResponses []int32) error {
	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "idQuiz", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "userResponses", Value: newUserResponses}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a Quiz user responses indexes by adding a given new response index
func AddQuizUserResponse(db *mongo.Database, ctx context.Context,
	id int32, newUserResponseId int32) error {

	collection := db.Collection(collectionNameQuiz)

	filter := bson.D{{Key: "idQuiz", Value: id}}
	update := bson.D{
		{Key: "$push", Value: bson.D{
			{Key: "userResponses", Value: newUserResponseId},
		}},
	}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a Quiz response indexes by deleting a given existing response index
func DeleteQuizUserResponse(db *mongo.Database, ctx context.Context,
	id int32, responseId int32) error {

	quiz, err := GetQuiz(db, ctx, id)
	if err != nil {
		return err
	}

	// Create new slice without the target id
	newUserResponses := make([]int32, 0, len(quiz.UserResponses))
	for _, v := range quiz.UserResponses {
		if v != responseId {
			newUserResponses = append(newUserResponses, v)
		}
	}

	err = UpdateQuizUserResponses(db, ctx, id, newUserResponses)
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
// ======================== HANDLERS ==========================
// ============================================================

// "/api/resources/quizzes[/param]" handler. param can be a quiz id or a date.
func QuizHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential parameter
		paramStr := utility.GetSuffixParams("/api/resources/quizzes/", r)

		if paramStr == "" {
			quizHandlerWithoutParam(db, w, r)
		} else {
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

// "/api/resources/quizzes[?stats=true]" handler
func quizHandlerWithoutParam(db *mongo.Database, w http.ResponseWriter, r *http.Request) {
	fmt.Println("Request received on '/api/resources/quizzes'")

	// Only GET
	if r.Method != http.MethodGet {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// gets the potential stats parameters
	query := r.URL.Query()
	stats := query.Get("stats")

	if stats == "true" { // Quizzes with stats
		quizzesWithStats, err := GetAllQuizzesWithStats(db, r.Context())
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Sort quizes by date (most recent first)
		slices.SortFunc(quizzesWithStats, func(a, b QuizWithStats) int {
			if a.Date.Before(b.Date) {
				return 1
			}
			if a.Date.After(b.Date) {
				return -1
			}
			return 0
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(quizzesWithStats)

	} else { // Quizzes without stats
		quizzes, err := GetAllQuizzes(db, r.Context())
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Sort quizes by date (most recent first)
		slices.SortFunc(quizzes, func(a, b Quiz) int {
			if a.Date.Before(b.Date) {
				return 1
			}
			if a.Date.After(b.Date) {
				return -1
			}
			return 0
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(quizzes)
	}
}

// "/api/resources/quizzes/date[?stats=true]" handler
func quizHandlerWithDate(db *mongo.Database, w http.ResponseWriter, r *http.Request, date time.Time) {
	fmt.Println("Request received on '/api/resources/quizzes/date'")

	// Only GET
	if r.Method != http.MethodGet {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// gets the potential stats parameters
	query := r.URL.Query()
	stats := query.Get("stats")

	if stats == "true" {

		// Getting the Quiz with this date with its stats in DB
		quiz, err := GetQuizWithDateWithStats(db, r.Context(), date)
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

	} else {

		// Getting the Quiz with this date in DB
		quiz, err := GetQuizWithDate(db, r.Context(), date)
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

	}
}

// "/api/resources/quizzes/id[?stats=true]" handler
func quizHandlerWithId(db *mongo.Database, w http.ResponseWriter, r *http.Request, id int32) {
	fmt.Println("Request received on '/api/resources/quizzes/id'")

	// Only GET
	if r.Method != http.MethodGet {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// gets the potential stats parameters
	query := r.URL.Query()
	stats := query.Get("stats")

	if stats == "true" {

		// Getting the Quiz with this id with its stats in DB
		quiz, err := GetQuizWithStats(db, r.Context(), id)
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

	} else {

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

	}
}

// "/api/resources/quizzes/comments/id" handler, with id being a Quiz id
func QuizCommentsHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/resources/quizzes/comments/id'")

		// Only GET
		if r.Method != http.MethodGet {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// gets the potential parameter
		paramStr := utility.GetSuffixParams("/api/resources/quizzes/comments/", r)

		if paramStr == "" {
			http.Error(w, "No quiz id given", http.StatusBadRequest)
			return
		}

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
		for _, idUserResponses := range quiz.UserResponses {

			// Get the UserResponses
			responses, err := GetUserResponses(db, r.Context(), idUserResponses)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No User responses for this id", http.StatusNotFound)
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

		// Sort comments by date (most recent first)
		slices.SortFunc(comments, func(a, b Comment) int {
			if a.Date.Before(b.Date) {
				return 1
			}
			if a.Date.After(b.Date) {
				return -1
			}
			return 0
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(comments)
	}
}
