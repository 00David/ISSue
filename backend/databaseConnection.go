package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

// Connects the backend to the MongoDB Atlas database
func connect_db(password string) *mongo.Database {
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI("mongodb+srv://david_db_user:" + password + "@issue-cluster.jgi7pm2.mongodb.net/?appName=ISSue-cluster").SetServerAPIOptions(serverAPI)

	client, err := mongo.Connect(opts)
	if err != nil {
		log.Println("❌ ERROR : Impossible to connect to MongoDB.\nDetails : ", err)
		os.Exit(1)
	}
	defer func() {
		if err = client.Disconnect(context.TODO()); err != nil {
			log.Println("⚠️ Disconnection error.\nDetails : ", err)
			os.Exit(1)
		}
	}()

	// Send a ping to confirm a successful connection
	if err := client.Ping(context.TODO(), readpref.Primary()); err != nil {
		log.Println("❌ ERROR : MongoDB ping failed.\nDetails : ", err)
		os.Exit(1)
	}
	fmt.Println("Connected to MongoDB database ✅")
	return client.Database("issue")
}
