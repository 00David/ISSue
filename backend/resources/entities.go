package resources

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// ============================================================
// ================== STRUCTURES (in DB) ======================
// ============================================================

// ISS postion
type ISSPosition struct {
	Date      time.Time `json:"date" bson:"date"`           // position date. (day-month-year unique for every ISSPosition)
	Timestamp int64     `json:"timestamp" bson:"timestamp"` // position timsetamp
	Latitude  string    `json:"latitude" bson:"latitude"`   // position latitude
	Longitude string    `json:"longitude" bson:"longitude"` // position longitude
}

// A quiz
type Quiz struct {
	IdQuiz      int32      `json:"idQuiz" bson:"idQuiz"`           // quiz id, unique for every quiz
	Date        time.Time  `json:"date" bson:"date"`               // quiz date. (day-month-year unique for every Quiz)
	Questions   []Question `json:"questions" bson:"questions"`     // quiz questions
	Country     string     `json:"country" bson:"country"`         // the main topic of the quiz
	CountryCode string     `json:"countryCode" bson:"countryCode"` // the country code, ISO alpha-2 format
	Region      string     `json:"region" bson:"region"`           // the secondary topic of the quiz
	Ocean       bool       `json:"ocean" bson:"ocean"`             // indicates if an ocean is targeted
}

// A quiz question
type Question struct {
	NumQuestion   int32    `json:"numQuestion" bson:"numQuestion"`     // number of the question within its quiz
	Question      string   `json:"question" bson:"question"`           // the description of the question
	Options       []string `json:"options" bson:"options"`             // the possible responses to the question
	IndexResponse int32    `json:"indexResponse" bson:"indexResponse"` // index of one of the options
}

// Responses for a given "Quiz"
type QuizResponses struct {
	IdQuizResponses int32      `json:"idQuizResponses" bson:"idQuizResponses"` // quiz responses id, unique for every quiz responses
	IdQuiz          int32      `json:"idQuiz" bson:"idQuiz"`                   // "Quiz" id, giving the quiz to which it had responded
	IdUser          int32      `json:"idUser" bson:"idUser"`                   // "User" id, giving the user that has responded
	Responses       []Response `json:"responses" bson:"responses"`             // quiz responses. For an index i, the corresponding question within the "Quiz" questions has the same index
	ResponseDate    time.Time  `json:"responseDate" bson:"responseDate"`       // quiz response date
	Note            int32      `json:"note" bson:"note"`                       // a note given by the user to the quiz, from 1 to 5 (both inclusive)
	Comment         string     `json:"comment" bson:"comment"`                 // a comment given by the user on the quiz
}

// A quiz response
type Response struct {
	NumQuestion int32 `json:"numQuestion"  bson:"numQuestion"` // number of the question within its "Quiz"
	NumResponse int32 `json:"numResponse"  bson:"numResponse"` // number of the response within its "Question"
	Correct     bool  `json:"correct"  bson:"correct"`         // indicates if th response is correct or not
}

// A user registered on the application
type User struct {
	IdUser           int32     `json:"idUser" bson:"idUser"`                     // user id, unique for every user
	Username         string    `json:"username" bson:"username"`                 // username, unique for every user
	Email            string    `json:"email" bson:"email"`                       // user email, in case of password reseting, unique for every user
	Password         string    `json:"password" bson:"password"`                 // user HASHED password
	SubscribeDate    time.Time `json:"subscribeDate" bson:"subscribeDate"`       // user subscribe date
	RespondedQuizzes []int32   `json:"respondedQuizzes" bson:"respondedQuizzes"` // ids of user responded "Quiz"
}

// ============================================================
// ================== ON USER GET METHOD ======================
// ============================================================

// Public informations of a user
type PublicUser struct {
	IdUser           int32     `json:"idUser"`
	Username         string    `json:"username"`
	SubscribeDate    time.Time `json:"subscribeDate"`
	RespondedQuizzes []int32   `json:"respondedQuizzes"`
}

// Private informations of a user
type PrivateUser struct {
	IdUser           int32     `json:"idUser"`
	Username         string    `json:"username"`
	Email            string    `json:"email"`
	SubscribeDate    time.Time `json:"subscribeDate"`
	RespondedQuizzes []int32   `json:"respondedQuizzes"`
}

// Get the public structure representing a User
func toPublicUser(u User) PublicUser {
	return PublicUser{
		IdUser:           u.IdUser,
		Username:         u.Username,
		SubscribeDate:    u.SubscribeDate,
		RespondedQuizzes: u.RespondedQuizzes,
	}
}

// Get the private structure representing a User
func toPrivateUser(u User) PrivateUser {
	return PrivateUser{
		IdUser:           u.IdUser,
		Username:         u.Username,
		Email:            u.Email,
		SubscribeDate:    u.SubscribeDate,
		RespondedQuizzes: u.RespondedQuizzes,
	}
}

// ============================================================
// ===================== HELPER METHOD ========================
// ============================================================

// Returns the first available id for a given database collection, and by giving the id label used in it ("IdUser" for instance)
func createUniqueId(collection *mongo.Collection, ctx context.Context, idLabel string) (int32, error) {

	// Sorting by descending idLabel, for having the biggest id
	opts := options.FindOne().SetSort(bson.M{idLabel: -1})

	var result bson.M
	err := collection.FindOne(ctx, bson.M{}, opts).Decode(&result)

	// If it is the first document of the collection (there is nothing yet)
	if err == mongo.ErrNoDocuments {
		return 1, nil // First id
	}
	if err != nil {
		return 0, err
	}

	switch maxId := result[idLabel].(type) {
	case int32:
		return maxId + 1, nil
	case int64:
		return int32(maxId) + 1, nil
	case int:
		return int32(maxId) + 1, nil
	default:
		return 0, fmt.Errorf("%s not a valid id (need int32, got %T)", idLabel, result[idLabel])
	}
}
