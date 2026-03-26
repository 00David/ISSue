package entities

// A quiz question
type Question struct {
	numQuestion   int      `json:"numQuestion"`   // number of the question within its quiz
	question      string   `json:"question"`      // the description of the question
	options       []string `json:"options"`       // the possible responses to the question
	indexResponse int      `json:"indexResponse"` // index of one of the options
}
