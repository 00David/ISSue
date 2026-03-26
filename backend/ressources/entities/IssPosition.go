package entities

// ISS postion
type ISSPosition struct {
	Timestamp int64  `json:"timestamp"` // position timsetamp, unique for every ISSPosition
	Latitude  string `json:"latitude"`  // position latitude
	Longitude string `json:"longitude"` // position longitude
}
