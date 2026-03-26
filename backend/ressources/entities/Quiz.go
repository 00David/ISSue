package entities

import "time"

type Quiz struct {
	idQuiz    int        `json:"idQuiz"`    // quiz id, unique for every quiz
	date      time.Time  `json:"date"`      // quiz date
	questions []Question `json:"questions"` // quiz questions
	country   string     `json:"country"`   // the main topic of the quiz
	region    string     `json:"region"`    // the secondary topic of the quiz
	ocean     bool       `json:"ocean"`     // indicates if an ocean is targeted
}
