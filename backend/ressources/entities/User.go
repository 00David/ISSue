package entities

// A user registered on the application
type User struct {
	idUser           int    `json:"idUser"`           // user id, unique for every user
	username         string `json:"username"`         // username, unique for every user
	email            string `json:"email"`            // user email, in case of password reseting
	password         string `json:"password"`         // user password, maybe byte[] later ?
	respondedQuizzes []int  `json:"respondedQuizzes"` // ids of user responded "Quiz"
}
