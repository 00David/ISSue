package entities

// A quiz response
type Response struct {
	numQuestion int  `json:"numQuestion"` // number of the question within its "Quiz"
	numResponse int  `json:"numResponse"` // number of the response within its "Question"
	correct     bool `json:"correct"`     // indicates if th response is correct or not
}
