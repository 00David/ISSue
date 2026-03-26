package entities

// Responses for a given "Quiz"
type QuizResponses struct {
	idQuizResponses int        `json:"idQuizResponses"` // quiz responses id, unique for every quiz responses
	idQuiz          int        `json:"idQuiz"`          // "Quiz" id, giving the quiz to which it had responded
	idUser          int        `json:"idUser"`          // "User" id, giving the user that has responded
	responses       []Response `json:"responses"`       // quiz responses. For an index i, the corresponding question within the "Quiz" questions has the same index
	note            int        `json:"note"`            // a note given by the user to the quiz, from 0 to 3 (both inclusive)
	comment         string     `json:"comment"`         // a comment given by the user on the quiz
}
