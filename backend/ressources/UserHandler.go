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

var collectionNameUsers = "users"

// Returns a User in DB for a given id
func GetUser(db *mongo.Database, ctx context.Context, id int32) (User, error) {
	collection := db.Collection(collectionNameUsers)

	filter := bson.D{{Key: "IdUser", Value: id}}
	var user User
	err := collection.FindOne(ctx, filter).Decode(&user)
	return user, err
}

// Returns a User in DB for a given string information (Username, or Email)
func GetUserWithInfo(db *mongo.Database, ctx context.Context,
	field string, fieldValue string) (User, error) {
	collection := db.Collection(collectionNameQuiz)

	validFields := map[string]bool{
		"Username": true,
		"Email":    true,
	}
	if !validFields[field] {
		return User{}, fmt.Errorf("Invalid field : %s", field)
	}

	filter := bson.D{{Key: field, Value: fieldValue}}
	var user User
	err := collection.FindOne(ctx, filter).Decode(&user)
	return user, err
}

// Creates a User in DB, returns its new id
func CreateUser(db *mongo.Database, ctx context.Context,
	username string, email string, password string) (int32, error) {
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
		RespondedQuizzes: make([]int32, 0),
	}
	_, err = collection.InsertOne(ctx, user)
	return id, err
}

// Updates a User string information (Username, or Email, or Password)
func UpdateUserInfo(db *mongo.Database, ctx context.Context,
	id int32, fieldToModify string, newFieldValue string) error {
	collection := db.Collection(collectionNameQuizR)

	validFields := map[string]bool{
		"Username": true,
		"Email":    true,
		"Password": true,
	}
	if !validFields[fieldToModify] {
		return fmt.Errorf("Invalid field : %s", fieldToModify)
	}

	// If a user already exists with the new username or email, error
	if fieldToModify == "Username" {
		_, err := GetUserWithInfo(db, ctx, "Username", newFieldValue)
		if err == nil {
			return fmt.Errorf("A user already exists with the same username")
		}
	}
	if fieldToModify == "Email" {
		_, err := GetUserWithInfo(db, ctx, "Email", newFieldValue)
		if err == nil {
			return fmt.Errorf("A user already exists with the same email")
		}
	}

	filter := bson.D{{Key: "IdUser", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: fieldToModify, Value: newFieldValue}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Updates a User responded quizzes indexes
func UpdateUserRespondedQuizzes(db *mongo.Database, ctx context.Context,
	id int32, newRespondedQuizzes []int32) error {
	collection := db.Collection(collectionNameQuizR)

	filter := bson.D{{Key: "IdUser", Value: id}}
	update := bson.D{{Key: "$set",
		Value: bson.D{{Key: "RespondedQuizzes", Value: newRespondedQuizzes}},
	}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// Deletes a User in DB for a given id
func DeleteUser(db *mongo.Database, ctx context.Context, id int32) error {
	collection := db.Collection(collectionNameUsers)

	filter := bson.D{{Key: "IdUser", Value: id}}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// ============================================================
// ======================== HANDLER ===========================
// ============================================================

// "/api/users[/id]" handler
func UsersHandler(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// gets the potential id parameter
		idStr := strings.TrimPrefix(r.URL.Path, "/api/users/")

		if idStr == "" {
			fmt.Println("Request received on '/api/users'")
			userHandlerWithoutId(db, w, r)
		} else {
			fmt.Println("Request received on '/api/users/id'")
			// Checks that the parameter is an integer
			id64, err := strconv.ParseInt(idStr, 10, 32)
			if err != nil {
				http.Error(w, "Invalid id parameter format, must be an integer", http.StatusBadRequest)
				return
			}
			userHandlerWithId(db, w, r, int32(id64))
		}

	}
}

// "/api/users" handler
func userHandlerWithoutId(db *mongo.Database, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost: // POST

		// Body decoding
		var req User
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Creation of the User in DB
		id, err := CreateUser(db, r.Context(), req.Username, req.Email, req.Password)
		if err != nil {
			http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{
			"message": "user successfuly created in DB",
			"IdUser":  id,
		})

	default:
		http.Error(w, "Unauthorized method", http.StatusMethodNotAllowed)
		return
	}
}

// "/api/users/id" handler
func userHandlerWithId(db *mongo.Database, w http.ResponseWriter, r *http.Request, id int32) {
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
		json.NewEncoder(w).Encode(user)

	case http.MethodDelete: // DELETE

		// Deletion of the User in DB
		err := DeleteUser(db, r.Context(), id)
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
			err := UpdateUserInfo(db, r.Context(), id, "Username", req.Username)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No User for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
		// Update of the User email in DB, if needed
		if req.Email != "" {
			err := UpdateUserInfo(db, r.Context(), id, "Email", req.Email)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "No User for this id", http.StatusNotFound)
					return
				}
				http.Error(w, "Internal error : "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
		// Update of the User password in DB, if needed
		if req.Password != "" {
			err := UpdateUserInfo(db, r.Context(), id, "Password", req.Password)
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
