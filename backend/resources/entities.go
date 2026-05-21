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
	Date      time.Time `json:"date" bson:"date"`           // position ISO 8601 date, example : 2026-05-16T12:39:13.000+00:00. Unique for every ISSPosition
	Timestamp int64     `json:"timestamp" bson:"timestamp"` // position timestamp, example : 1778935153
	Latitude  string    `json:"latitude" bson:"latitude"`   // position latitude
	Longitude string    `json:"longitude" bson:"longitude"` // position longitude
}

// A quiz
type Quiz struct {
	IdQuiz        int32          `json:"idQuiz" bson:"idQuiz"`               // quiz id, unique for every quiz
	Date          time.Time      `json:"date" bson:"date"`                   // quiz ISO 8601 date, example : 2026-05-16T12:39:13.000+00:00. Unique for every Quiz, and is equal to an ISSPosition date
	Questions     []QuizQuestion `json:"questions" bson:"questions"`         // quiz questions
	Country       string         `json:"country" bson:"country"`             // the main topic of the quiz
	CountryCode   string         `json:"countryCode" bson:"countryCode"`     // the country code, ISO alpha-2 format
	Region        string         `json:"region" bson:"region"`               // the secondary topic of the quiz
	Ocean         bool           `json:"ocean" bson:"ocean"`                 // indicates if an ocean is targeted
	UserResponses []int32        `json:"userResponses" bson:"userResponses"` // ids of user responses to this quiz (UserResponses)
}

// A Quiz question
type QuizQuestion struct {
	NumQuestion   int32    `json:"numQuestion" bson:"numQuestion"`     // number of the question within its quiz
	Question      string   `json:"question" bson:"question"`           // the description of the question
	Options       []string `json:"options" bson:"options"`             // the possible responses to the question
	IndexResponse int32    `json:"indexResponse" bson:"indexResponse"` // index of one of the options, being the correct one
}

// User responses to a Quiz
type UserResponses struct {
	IdUserResponses    int32          `json:"idUserResponses" bson:"idUserResponses"`       // user responses id, unique for every user responses
	IdQuiz             int32          `json:"idQuiz" bson:"idQuiz"`                         // "Quiz" id, giving the quiz to which it has responded
	IdUser             int32          `json:"idUser" bson:"idUser"`                         // "User" id, giving the user that has responded
	QuestionsResponses []UserResponse `json:"questionsResponses" bson:"questionsResponses"` // user responses to the quiz questions. For an index i, the corresponding question within the "Quiz" questions has the same index
	ResponseDate       time.Time      `json:"responseDate" bson:"responseDate"`             // user response date
	Note               int32          `json:"note" bson:"note"`                             // an optionnal note given by the user to the quiz, from 1 to 5 (both inclusive). At 0 it has not been noted
	Comment            string         `json:"comment" bson:"comment"`                       // an optionnal comment given by the user on the quiz
}

// A user individual response to a quiz question
type UserResponse struct {
	NumQuestion int32 `json:"numQuestion"  bson:"numQuestion"` // number of the question within its "Quiz"
	NumResponse int32 `json:"numResponse"  bson:"numResponse"` // number of the response within its "Question"
	Correct     bool  `json:"correct"  bson:"correct"`         // indicates if the response is correct or not
}

// A user registered on the application
type User struct {
	IdUser        int32     `json:"idUser" bson:"idUser"`               // user id, unique for every user
	Username      string    `json:"username" bson:"username"`           // username, unique for every user
	Email         string    `json:"email" bson:"email"`                 // user email, unique for every user
	Password      string    `json:"password" bson:"password"`           // user HASHED password
	SubscribeDate time.Time `json:"subscribeDate" bson:"subscribeDate"` // user subscribe date
	UserResponses []int32   `json:"userResponses" bson:"userResponses"` // ids of this user responses to quizzes (UserResponses)
	PinnedQuizzes []int32   `json:"pinnedQuizzes" bson:"pinnedQuizzes"` // ids of this user pinned quizzes
}

// ============================================================
// ================== ON USER GET METHOD ======================
// ============================================================

// Public informations of a user
type PublicUser struct {
	IdUser        int32     `json:"idUser"`
	Username      string    `json:"username"`
	SubscribeDate time.Time `json:"subscribeDate"`
	UserResponses []int32   `json:"userResponses"`
	PinnedQuizzes []int32   `json:"pinnedQuizzes"`
}

// Private informations of a user
type PrivateUser struct {
	IdUser        int32     `json:"idUser"`
	Username      string    `json:"username"`
	Email         string    `json:"email"`
	SubscribeDate time.Time `json:"subscribeDate"`
	UserResponses []int32   `json:"userResponses"`
	PinnedQuizzes []int32   `json:"pinnedQuizzes"`
}

// Get the public structure representing a User
func toPublicUser(u User) PublicUser {
	return PublicUser{
		IdUser:        u.IdUser,
		Username:      u.Username,
		SubscribeDate: u.SubscribeDate,
		UserResponses: u.UserResponses,
		PinnedQuizzes: u.PinnedQuizzes,
	}
}

// Get the private structure representing a User
func toPrivateUser(u User) PrivateUser {
	return PrivateUser{
		IdUser:        u.IdUser,
		Username:      u.Username,
		Email:         u.Email,
		SubscribeDate: u.SubscribeDate,
		UserResponses: u.UserResponses,
		PinnedQuizzes: u.PinnedQuizzes,
	}
}

// Leaderboard informations of a user
type LeaderboardUser struct {
	IdUser          int32  `json:"idUser"`
	Username        string `json:"username"`
	TotalScore      int32  `json:"totalScore"`
	NbQuizResponded int32  `json:"nbQuizResponded"`
}

// Get a mix of public user infos and its performances
func toLeaderboardUser(db *mongo.Database, ctx context.Context, user User) (LeaderboardUser, error) {
	totalScore := 0

	// Search for responses of our user and sum its total score
	for _, idUserResponses := range user.UserResponses {
		userResponses, err := GetUserResponses(db, ctx, idUserResponses)
		if err != nil {
			return LeaderboardUser{}, err
		}
		score := 0
		for _, r := range userResponses.QuestionsResponses {
			if r.Correct {
				score++
			}
		}
		totalScore += score
	}

	leaderboarduser := LeaderboardUser{
		IdUser:          user.IdUser,
		Username:        user.Username,
		TotalScore:      int32(totalScore),
		NbQuizResponded: int32(len(user.UserResponses)),
	}

	return leaderboarduser, nil
}

// ============================================================
// ============== ON QUIZ COMMENTS GET METHOD =================
// ============================================================

type Comment struct {
	IdUser   int32     `json:"idUser"`
	Username string    `json:"username"`
	Date     time.Time `json:"date"`
	Note     int32     `json:"note"`
	Comment  string    `json:"comment"`
}

// ============================================================
// =========== ON QUIZ / QUIZZES GET METHOD (WITH STATS) ======
// ============================================================

type QuizWithStats struct {
	IdQuiz        int32          `json:"idQuiz"`
	Date          time.Time      `json:"date"`
	Questions     []QuizQuestion `json:"questions"`
	Country       string         `json:"country"`
	CountryCode   string         `json:"countryCode"`
	Region        string         `json:"region"`
	Ocean         bool           `json:"ocean"`
	UserResponses []int32        `json:"userResponses"`
	AvgScore      float32        `json:"avgScore"`    // -1 if no scores to take into account
	AvgUserNote   float32        `json:"avgUserNote"` // -1 if no given notes to take into account
	NbComments    int32          `json:"nbComments"`
}

// Construct the quiz structure containing statistics on its responses
func toQuizWithStats(db *mongo.Database, ctx context.Context, quiz Quiz) (QuizWithStats, error) {
	totalScores := 0
	var totalComments int32 = 0
	var totalNotes int32 = 0
	var countedNotes int32 = 0

	// Search for responses to this quiz and sum with our constructed stats
	for _, idUserResponses := range quiz.UserResponses {
		userResponses, err := GetUserResponses(db, ctx, idUserResponses)
		if err != nil {
			return QuizWithStats{}, err
		}
		score := 0
		for _, r := range userResponses.QuestionsResponses {
			if r.Correct {
				score++
			}
		}
		totalScores += score

		if userResponses.Comment != "" {
			totalComments++
		}

		if userResponses.Note > 0 { // a note of 0 = not been given
			totalNotes += userResponses.Note
			countedNotes++
		}
	}

	avgScore := float32(-1)
	if len(quiz.UserResponses) > 0 {
		avgScore = float32(totalScores) / float32(len(quiz.UserResponses))
	}

	avgNote := float32(-1)
	if countedNotes > 0 { // note at 0 : no note given
		avgNote = float32(totalNotes) / float32(countedNotes)
	}

	quizStats := QuizWithStats{
		IdQuiz:        quiz.IdQuiz,
		Date:          quiz.Date,
		Questions:     quiz.Questions,
		Country:       quiz.Country,
		CountryCode:   quiz.CountryCode,
		Region:        quiz.Region,
		Ocean:         quiz.Ocean,
		UserResponses: quiz.UserResponses,
		AvgScore:      avgScore,
		AvgUserNote:   avgNote,
		NbComments:    totalComments,
	}

	return quizStats, nil
}

// ============================================================
// ============== ON USER PIN / UNPIN POST METHODS ============
// ============================================================

type Pin struct {
	IdQuiz int32 `json:"idQuiz"`
}

type Unpin struct {
	IdQuiz int32 `json:"idQuiz"`
}

// ============================================================
// ===================== HELPER METHOD ========================
// ============================================================

// Returns the first available id for a given database collection, and by giving the id label used in it ("idUser" for users collections for instance)
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
