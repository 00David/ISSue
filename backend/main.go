package main

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/00David/ISSue/backend/handlers"
)

var PORT int = 4572

// main.go
func main() {
	host := os.Getenv("HOST") // lit la variable d'environnement
	if host == "" {
		host = "localhost" // valeur par défaut en local
	}
	addr := host + ":" + strconv.Itoa(PORT)

	// Handlers des requêtes
	http.HandleFunc("/api/iss", handlers.ISSHandler)

	fmt.Println("Serveur démarré sur http://" + addr + " ✅")
	http.ListenAndServe(addr, nil)
}
