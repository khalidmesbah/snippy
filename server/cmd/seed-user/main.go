package main

import (
	"log"
	"snippy-server/internal/database"
)

func main() {
	if err := database.SeedUserData(); err != nil {
		log.Fatalf("Failed to seed user data: %v", err)
	}

	log.Println("✅ Successfully seeded data for user from .env file")
}
