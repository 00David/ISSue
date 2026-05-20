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
	"golang.org/x/crypto/bcrypt"
)

// ============================================================
// =================== DATABASE OPERATIONS ====================
// ============================================================

var collectionNameUsers = "users"

// Returns a User in DB for a given id
func GetUser(db *mongo.Database, ctx context.Context, id int32) (User, error) {
	collection := db.Collection(collectionNameUsers)

	filter := bson.D{{Key: "idUser", Value: id}}
	var user User
	err := collection.FindOne(ctx, filter).Decode(&user)
	return user, err
}

// Returns a User in DB for a given string information (username, or email)
func GetUserWithInfo(db *mongo.Database, ctx context.Context,
	field string, fieldValue string) (User, error) {
	collection := db.Collection(collectionNameUsers)

	validFields := map[string]bool{
		"username": true,
		"email":    true,
	}
	if !validFields[field] {
		return User{}, fmt.Errorf("Invalid field : %s", field)
	}

	filter := bson.D{{Key: field, Value: fieldValue}}
	var user User
	err := collection.FindOne(ctx, filter).Decode(&user)
	return user, err
}

// Returns all Users in DB
func GetAllUsers(db *mongo.Database, ctx context.Context) ([]User, error) {
	collection := db.Collection(collectionNameUsers)

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []User

	for cursor.Next(ctx) {
		var user User
		if err := cursor.Decode(&user); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

// Creates a User in DB, returns its new id
func CreateUser(db *mongo.Database, ctx context.Context,
	username string, email string, password string, subscribeDate time.Time) (int32, error) {
	collection := db.Collection(collectionNameUsers)

	id, err := createUniqueId(collection, ctx, "idUser")
	if err != nil {
		return -1, err
	}
	user := User{
		IdUser:           id,
		Username:         username,
		Email:            email,
		Password:         password,
		SubscribeDate:    subscribeDate,
		RespondedQuizzes: make([]int32, 0),
		PinnedQuizzes:    make([]int32, 0),
	}
	_, err = collection.InsertOne(ctx, user)
	return id, err
}

// Updates a User string information (username, or email, or password)
func UpdateUserInfo(db *mongo.Database, ctx context.Context,
	id int32, fieldToModify string, newFieldValue string) error {
	collection := db.Collection(collectionNameUsers)

	validFields := map[string]bool{
		"username": true,
		"email":    true,
		"password": true,
	}
	if !validFields[fieldToModify] {
		return fmt.Errorf("Invalid field : %s", fieldToModify)
	}

	// If a user already exists with the new username or email, error
	if fieldToModify == "username" {
		_, err := GetUserWithInfo(db, ctx, "username", newFieldValue)
		if err == nil {
			return utility.ErrExistantUsername
		}
	}
	if fieldToModify == "email" {
		_, err := GetUserWithInfo(db, ctx, "email", newFieldValue)
		if err == nil {
			return utility.ErrExistantEmail
		}
	}

	filter := bson.D{{Key: "idUser", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: fieldToModify, Value: newFieldValue}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a User responded quizzes indexes
func UpdateUserRespondedQuizzes(db *mongo.Database, ctx context.Context,
	id int32, newRespondedQuizzes []int32) error {
	collection := db.Collection(collectionNameUsers)

	filter := bson.D{{Key: "idUser", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "respondedQuizzes", Value: newRespondedQuizzes}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a User responded quizzes indexes by adding a given new response index
func AddUserRespondedQuiz(db *mongo.Database, ctx context.Context,
	id int32, newRespondedQuizId int32) error {
	collection := db.Collection(collectionNameUsers)

	filter := bson.D{{Key: "idUser", Value: id}}
	update := bson.D{
		{Key: "$push", Value: bson.D{
			{Key: "respondedQuizzes", Value: newRespondedQuizId},
		}},
	}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a User pinned quizzes indexes
func UpdateUserPinnedQuizzes(db *mongo.Database, ctx context.Context,
	id int32, newPinnedQuizzes []int32) error {
	collection := db.Collection(collectionNameUsers)

	filter := bson.D{{Key: "idUser", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "pinnedQuizzes", Value: newPinnedQuizzes}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a User pinned quizzes indexes by adding a given new pinned index
func AddUserPinnedQuiz(db *mongo.Database, ctx context.Context,
	id int32, newPinnedQuizId int32) error {
	collection := db.Collection(collectionNameUsers)

	filter := bson.D{{Key: "idUser", Value: id}}
	update := bson.D{
		{Key: "$push", Value: bson.D{
			{Key: "pinnedQuizzes", Value: newPinnedQuizId},
		}},
	}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a User pinned quizzes indexes by deleting a given existing quiz index
func DeleteUserPinnedQuiz(db *mongo.Database, ctx context.Context,
	id int32, pinnedQuizId int32) error {

	user, err := GetUser(db, ctx, id)
	if err != nil {
		return err
	}

	// Create new slice without the target id
	newPinnedQuizzes := make([]int32, 0, len(user.PinnedQuizzes))
	for _, v := range user.PinnedQuizzes {
		if v != pinnedQuizId {
			newPinnedQuizzes = append(newPinnedQuizzes, v)
		}
	}

	err = UpdateUserPinnedQuizzes(db, ctx, id, newPinnedQuizzes)
	return err
}

// Deletes a User in DB for a given id
func DeleteUser(db *mongo.Database, ctx context.Context, id int32) error {
	collection := db.Collection(collectionNameUsers)

	filter := bson.D{{Key: "idUser", Value: id}}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// ============================================================
// ======================== HANDLER ===========================
// ============================================================

// "/api/resources/users[/id]" handler
func UsersHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential id parameter
		idStr := utility.GetSuffixParams("/api/resources/users/", r)

		if idStr == "" {
			fmt.Println("Request received on '/api/resources/users'")
			userHandlerWithoutId(db, w, r)
		} else {
			fmt.Println("Request received on '/api/resources/users/id'")
			// Checks that the parameter is an integer
			id64, err := strconv.ParseInt(idStr, 10, 32)
			if err != nil {
				http.Error(w, "Invalid id parameter format, must be an integer", http.StatusBadRequest)
				return
			}
			userHandlerWithId(db, w, r, jwtSecret, int32(id64))
		}

	}
}

// "/api/resources/users" handler
func userHandlerWithoutId(db *mongo.Database, w http.ResponseWriter, r *http.Request) {

	// Only POST
	if r.Method != http.MethodPost {
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}

	// Body decoding
	var req User
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Creation of the User in DB
	id, err := CreateUser(db, r.Context(), req.Username, req.Email, req.Password, time.Now().UTC())
	if err != nil {
		http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"message": "user successfuly created in DB",
		"idUser":  id,
	})
}

// "/api/resources/users/id" handler
func userHandlerWithId(db *mongo.Database, w http.ResponseWriter, r *http.Request, jwtSecret []byte, id int32) {

	// If the user token indicates that he is the concerned user : he can do any action on its data
	allRights := utility.IsUserAuthorized(r, jwtSecret, id)

	switch r.Method {
	case http.MethodGet: // GET

		// Getting the User with this id in DB
		user, err := GetUser(db, r.Context(), id)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No User for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if allRights {
			// Return all of user data, knowing that it can only be the user wanting to retrieve it
			json.NewEncoder(w).Encode(toPrivateUser(user))
		} else {
			// Return only a partial user data otherwise
			json.NewEncoder(w).Encode(toPublicUser(user))
		}

	case http.MethodDelete: // DELETE

		if !allRights {
			http.Error(w, "Unauthorized deletion", http.StatusUnauthorized)
			return
		}

		// Get the User in DB
		user, err := GetUser(db, r.Context(), id)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No User for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Search for responses to quizzes : delete those responses and references to them
		for _, idResponses := range user.RespondedQuizzes {

			// First get the QuizResponses
			responses, err := GetQuizResponses(db, r.Context(), idResponses)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No Quiz responses for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}

			// Then delete this QuizResponses id from the Quiz it has responded
			err = DeleteQuizRespondedQuiz(db, r.Context(), responses.IdQuiz, idResponses)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No Quiz for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}

			// Finally, delete the QuizResponses
			err = DeleteQuizResponses(db, r.Context(), idResponses)
			if err != nil {
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		// Deletion of the User in DB
		err = DeleteUser(db, r.Context(), id)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No User for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "user successfuly deleted from DB",
		})

	case http.MethodPatch: // PATCH

		if !allRights {
			http.Error(w, "Unauthorized modification", http.StatusUnauthorized)
			return
		}

		// Body decoding
		var req User
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Update of the User username in DB, if needed
		if req.Username != "" {
			err := UpdateUserInfo(db, r.Context(), id, "username", req.Username)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No User for this id", http.StatusNotFound)
					return
				}
				if err == utility.ErrExistantUsername {
					http.Error(w, err.Error(), http.StatusConflict)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
		// Update of the User email in DB, if needed
		if req.Email != "" {

			// Email format verification
			if !utility.IsValidEmail(req.Email) {
				http.Error(w, "Incorrect email format", http.StatusBadRequest)
				return
			}

			err := UpdateUserInfo(db, r.Context(), id, "email", req.Email)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No User for this id", http.StatusNotFound)
					return
				}
				if err == utility.ErrExistantEmail {
					http.Error(w, err.Error(), http.StatusConflict)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
		// Update of the User password in DB, if needed
		if req.Password != "" {

			// The password is hashed, we're profesional here
			hashedPassword, err := bcrypt.GenerateFromPassword(
				[]byte(req.Password),
				bcrypt.DefaultCost,
			)
			if err != nil {
				http.Error(w, "Error hashing password", http.StatusInternalServerError)
				return
			}

			err = UpdateUserInfo(db, r.Context(), id, "password", string(hashedPassword))
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No User for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
		// Update of the User responded quizzes indexes, if needed
		if len(req.RespondedQuizzes) > 0 {
			err := UpdateUserRespondedQuizzes(db, r.Context(), id, req.RespondedQuizzes)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No User for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "user information(s) successfuly updated in DB",
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}

type Pin struct {
	IdQuiz int32 `json:"idQuiz"`
}

// "/api/resources/users/pin" handler
func UsersPinQuizHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/resources/users/pin'")

		// Only POST
		if r.Method != http.MethodPost {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// Extract user ID from JWT
		idUser, err := utility.ExtractUserIDFromRequest(r, jwtSecret)
		if err != nil {
			switch err {
			case utility.ErrNoCookie:
				http.Error(w, "No cookie", http.StatusBadRequest)
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

		// Body decoding
		var req Pin
		err = json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		err = AddUserPinnedQuiz(db, r.Context(), idUser, req.IdQuiz)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "No User for this id", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "quiz " + strconv.Itoa(int(req.IdQuiz)) + " succesfully pinned",
		})
	}
}

type Unpin struct {
	IdQuiz int32 `json:"idQuiz"`
}

// "/api/resources/users/unpin" handler
func UsersUnpinQuizHandler(db *mongo.Database, jwtSecret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/resources/users/unpin'")

		// Only POST
		if r.Method != http.MethodPost {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// Extract user ID from JWT
		idUser, err := utility.ExtractUserIDFromRequest(r, jwtSecret)
		if err != nil {
			switch err {
			case utility.ErrNoCookie:
				http.Error(w, "No cookie", http.StatusBadRequest)
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

		// Body decoding
		var req Unpin
		err = json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Then delete the given quiz id from User's pinned quizzes
		err = DeleteUserPinnedQuiz(db, r.Context(), idUser, req.IdQuiz)
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "quiz " + strconv.Itoa(int(req.IdQuiz)) + " succesfully unpinned",
		})
	}
}

// "/api/resources/users/leaderboard" handler
func UsersLeaderboardHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received on '/api/resources/users/leaderboard'")

		// Only GET
		if r.Method != http.MethodGet {
			http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
			return
		}

		// Get users in DB
		users, err := GetAllUsers(db, r.Context())
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		leaderboardUsers := make([]LeaderboardUser, 0)
		// For every user, get its leaderboard infos
		for _, user := range users {

			leaderboardUser, err := toLeaderboardUser(db, r.Context(), user)
			if err != nil {
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}

			leaderboardUsers = append(leaderboardUsers, leaderboardUser)
		}

		// Sort users by total score (higher first), then by alphabetical order on the username in case of ties
		slices.SortFunc(leaderboardUsers, func(a, b LeaderboardUser) int {
			if a.TotalScore < b.TotalScore {
				return 1
			}
			if a.TotalScore > b.TotalScore {
				return -1
			}

			if a.Username > b.Username {
				return 1
			}
			if a.Username < b.Username {
				return -1
			}
			return 0
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(leaderboardUsers)

	}
}
