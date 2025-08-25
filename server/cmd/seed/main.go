package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"snippy-server/internal/seed"
)

func main() {
	// load .env
	_ = godotenv.Load()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		log.Fatal("TEST_DATABASE_URL not set in .env")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}
	defer db.Close()

	log.Println("🌱 Seeding database with dummy data...")

	if err := seed.ClearData(db); err != nil {
		log.Fatalf("Failed to clear data: %v", err)
	}
	if err := seed.SeedCollections(db); err != nil {
		log.Fatalf("Failed to seed collections: %v", err)
	}
	if err := seed.SeedSnippets(db); err != nil {
		log.Fatalf("Failed to seed snippets: %v", err)
	}

	log.Println("✅ Database seeded successfully")
}
