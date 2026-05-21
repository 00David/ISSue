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

var collectionNameUserR = "userresponses"

// Returns a UserResponses in DB for a given id
func GetUserResponses(db *mongo.Database, ctx context.Context, id int32) (UserResponses, error) {
	collection := db.Collection(collectionNameUserR)

	filter := bson.D{{Key: "idUserResponses", Value: id}}
	var userR UserResponses
	err := collection.FindOne(ctx, filter).Decode(&userR)
	return userR, err
}

// Creates a UserResponses in DB, returns its new id
func CreateUserResponses(db *mongo.Database, ctx context.Context,
	idQuiz int32, idUser int32, questionsResponses []UserResponse, responseDate time.Time, note int32, comment string) (int32, error) {
	collection := db.Collection(collectionNameUserR)

	id, err := createUniqueId(collection, ctx, "idUserResponses")
	if err != nil {
		return -1, err
	}
	userR := UserResponses{
		IdUserResponses:    id,
		IdQuiz:             idQuiz,
		IdUser:             idUser,
		QuestionsResponses: questionsResponses,
		ResponseDate:       responseDate,
		Note:               note,
		Comment:            comment,
	}
	_, err = collection.InsertOne(ctx, userR)
	return id, err
}

// Updates a UserResponses note in DB for a given id
func UpdateUserResponsesNote(db *mongo.Database, ctx context.Context,
	id int32, newNote int32) error {
	collection := db.Collection(collectionNameUserR)

	filter := bson.D{{Key: "idUserResponses", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "note", Value: newNote}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a UserResponses comment in DB for a given id
func UpdateUserResponsesComment(db *mongo.Database, ctx context.Context,
	id int32, newComment string) error {
	collection := db.Collection(collectionNameUserR)

	filter := bson.D{{Key: "idUserResponses", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "comment", Value: newComment}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Deletes a UserResponses in DB for a given id
func DeleteUserResponses(db *mongo.Database, ctx context.Context, id int32) error {
	collection := db.Collection(collectionNameUserR)

	filter := bson.D{{Key: "idUserResponses", Value: id}}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// ============================================================
// ======================== HANDLERS ==========================
// ============================================================

// "/api/resources/user-responses[/params]" handler
func UserResponsesHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential id parameter
		idStr := utility.GetSuffixParams("/api/resources/user-responses/", r)

		// gets the potential quiz and user parameters
		query := r.URL.Query()
		idQuizStr := query.Get("idquiz")
		idUserStr := query.Get("iduser")

		if idStr == "" && len(query) == 0 {
			userResponsesHandlerWithoutId(db, w, r, jwtSecret)
		} else if idQuizStr != "" && idUserStr != "" {
			userResponsesHandlerWithQuizAnsUser(db, w, r, idQuizStr, idUserStr)
		} else {
			// Checks that the parameter is an integer
			id64, err := strconv.ParseInt(idStr, 10, 32)
			if err != nil {
				http.Error(w, "Invalid id parameter format, must be an integer", http.StatusBadRequest)
				return
			}
			userResponsesHandlerWithId(db, w, r, int32(id64))

		}

	}
}

// "/api/resources/user-responses/id" handler
func userResponsesHandlerWithId(db *mongo.Database, w http.ResponseWriter, r *http.Request, id int32) {
	fmt.Println("Request received on '/api/resources/user-responses/id'")

	// Only GET
	if r.Method != http.MethodGet {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// Getting the UserResponses with this id in DB
	userR, err := GetUserResponses(db, r.Context(), id)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "No User responses for this id", http.StatusNotFound)
			return
		}
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userR)
}

// "/api/resources/user-responses" handler
func userResponsesHandlerWithoutId(db *mongo.Database, w http.ResponseWriter,
	r *http.Request, jwtSecret []byte) {
	fmt.Println("Request received on '/api/resources/user-responses'")

	// Only POST
	if r.Method != http.MethodPost {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// Body decoding
	var req UserResponses
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

	// Creation of the UserResponses in DB
	idUserR, err := CreateUserResponses(db, r.Context(), req.IdQuiz, req.IdUser, req.QuestionsResponses, time.Now().UTC(), req.Note, req.Comment)
	if err != nil {
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update user's responses ids
	err = AddUserResponse(db, r.Context(), userID, idUserR)
	if err != nil {
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update quiz responses ids
	err = AddQuizUserResponse(db, r.Context(), req.IdQuiz, idUserR)
	if err != nil {
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"message":         "user responses successfuly created in DB",
		"idUserResponses": idUserR,
	})
}

// "/api/resources/user-responses?idquiz=’id1’&iduser=’id2’" handler
func userResponsesHandlerWithQuizAnsUser(db *mongo.Database, w http.ResponseWriter,
	r *http.Request, idQuizStr string, idUserStr string) {
	fmt.Println("Request received on '/api/resources/user-responses?idquiz=’...’&iduser=’...’'")

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

	// Search among user responses if one has responded to the given quiz
	for _, idUserResponses := range user.UserResponses {
		userR, err := GetUserResponses(db, r.Context(), idUserResponses)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No User responses for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Return the user responses if found
		if userR.IdQuiz == idQuiz {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(userR)
			return
		}
	}

	http.Error(w, "No User responses for those user and quiz ids", http.StatusNotFound)
}
