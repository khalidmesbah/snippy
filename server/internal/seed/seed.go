// seed.go
package seed

import (
	"database/sql"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
	"log"
	"time"
)

// clearData removes all existing data from tables
func ClearData(db *sql.DB) error {
	// Delete in order to respect foreign key constraints
	if _, err := db.Exec("DELETE FROM snippets"); err != nil {
		return err
	}
	if _, err := db.Exec("DELETE FROM collections"); err != nil {
		return err
	}
	log.Println("   - Cleared existing data")
	return nil
}

// seedCollections inserts test collections
func SeedCollections(db *sql.DB) error {
	collections := []struct {
		id        string
		userID    string
		name      string
		color     string
		createdAt time.Time
		updatedAt time.Time
	}{
		{"550e8400-e29b-41d4-a716-446655440001", "user_123", "JavaScript Utils", "#3b82f6", parseTime("2024-01-15 10:30:00"), parseTime("2024-01-15 10:30:00")},
		{"550e8400-e29b-41d4-a716-446655440002", "user_123", "CSS Animations", "#ef4444", parseTime("2024-01-20 14:20:00"), parseTime("2024-01-20 14:20:00")},
		{"550e8400-e29b-41d4-a716-446655440003", "user_123", "Go Snippets", "#22c55e", parseTime("2024-01-25 09:10:00"), parseTime("2024-01-25 09:10:00")},
		{"550e8400-e29b-41d4-a716-446655440004", "user_123", "SQL Queries", "#eab308", parseTime("2024-01-30 16:45:00"), parseTime("2024-01-30 16:45:00")},
		{"550e8400-e29b-41d4-a716-446655440005", "user_123", "React Components", "#a855f7", parseTime("2024-02-02 13:00:00"), parseTime("2024-02-02 13:00:00")},
		{"550e8400-e29b-41d4-a716-446655440006", "user_456", "Python Tricks", "#06b6d4", parseTime("2024-02-10 11:00:00"), parseTime("2024-02-10 11:00:00")},
		{"550e8400-e29b-41d4-a716-446655440007", "user_456", "Docker Tips", "#f97316", parseTime("2024-02-12 17:30:00"), parseTime("2024-02-12 17:30:00")},
		{"550e8400-e29b-41d4-a716-446655440008", "user_789", "Machine Learning", "#84cc16", parseTime("2024-02-15 09:20:00"), parseTime("2024-02-15 09:20:00")},
		{"550e8400-e29b-41d4-a716-446655440009", "user_101", "Rust Patterns", "#ec4899", parseTime("2024-02-18 14:50:00"), parseTime("2024-02-18 14:50:00")},
		{"550e8400-e29b-41d4-a716-446655440010", "user_999", "Miscellaneous", "#94a3b8", parseTime("2024-02-20 08:40:00"), parseTime("2024-02-20 08:40:00")},
	}

	for _, c := range collections {
		_, err := db.Exec(`
			INSERT INTO collections (id, user_id, name, color, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, c.id, c.userID, c.name, c.color, c.createdAt, c.updatedAt)
		if err != nil {
			return err
		}
	}
	log.Printf("   - %d collections seeded", len(collections))
	return nil
}

// seedSnippets inserts test snippets
func SeedSnippets(db *sql.DB) error {
	snippets := []struct {
		id           string
		userID       string
		collectionID *string
		title        string
		content      string
		tags         []string
		isPublic     bool
		isFavorite   bool
		createdAt    time.Time
		updatedAt    time.Time
	}{
		{"660e8400-e29b-41d4-a716-446655440001", "user_123", nil, "Hello World JS", "console.log('Hello World');", []string{"javascript", "beginner"}, true, false, parseTime("2024-02-01 12:00:00"), parseTime("2024-02-01 12:00:00")},
		{"660e8400-e29b-41d4-a716-446655440002", "user_123", strPtr("550e8400-e29b-41d4-a716-446655440001"), "Array Shuffle", "function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }", []string{"javascript", "array"}, true, true, parseTime("2024-02-02 15:00:00"), parseTime("2024-02-02 15:00:00")},
		{"660e8400-e29b-41d4-a716-446655440003", "user_123", strPtr("550e8400-e29b-41d4-a716-446655440002"), "Fade In Animation", ".fade-in { animation: fadeIn 2s ease-in; }", []string{"css", "animation"}, false, false, parseTime("2024-02-03 18:00:00"), parseTime("2024-02-03 18:00:00")},
		{"660e8400-e29b-41d4-a716-446655440004", "user_123", strPtr("550e8400-e29b-41d4-a716-446655440003"), "Go HTTP Server", "http.ListenAndServe(\":8080\", nil)", []string{"go", "http"}, true, true, parseTime("2024-02-04 10:30:00"), parseTime("2024-02-04 10:30:00")},
		{"660e8400-e29b-41d4-a716-446655440005", "user_123", strPtr("550e8400-e29b-41d4-a716-446655440004"), "Select All Users", "SELECT * FROM users;", []string{"sql", "query"}, true, false, parseTime("2024-02-05 09:15:00"), parseTime("2024-02-05 09:15:00")},
		{"660e8400-e29b-41d4-a716-446655440006", "user_123", strPtr("550e8400-e29b-41d4-a716-446655440005"), "Button Component", "export const Button = ({children}) => <button>{children}</button>", []string{"react", "component"}, true, true, parseTime("2024-02-06 14:45:00"), parseTime("2024-02-06 14:45:00")},
		{"660e8400-e29b-41d4-a716-446655440007", "user_456", strPtr("550e8400-e29b-41d4-a716-446655440006"), "List Comprehension", "squares = [x*x for x in range(10)]", []string{"python", "list"}, true, false, parseTime("2024-02-07 11:25:00"), parseTime("2024-02-07 11:25:00")},
		{"660e8400-e29b-41d4-a716-446655440008", "user_456", strPtr("550e8400-e29b-41d4-a716-446655440007"), "Dockerfile Example", "FROM node:18-alpine", []string{"docker", "devops"}, true, false, parseTime("2024-02-08 13:10:00"), parseTime("2024-02-08 13:10:00")},
		{"660e8400-e29b-41d4-a716-446655440009", "user_789", strPtr("550e8400-e29b-41d4-a716-446655440008"), "Linear Regression", "from sklearn.linear_model import LinearRegression", []string{"python", "ml"}, true, true, parseTime("2024-02-09 09:40:00"), parseTime("2024-02-09 09:40:00")},
		{"660e8400-e29b-41d4-a716-446655440010", "user_101", strPtr("550e8400-e29b-41d4-a716-446655440009"), "Ownership in Rust", "let s = String::from(\"hello\");", []string{"rust", "ownership"}, false, true, parseTime("2024-02-10 16:55:00"), parseTime("2024-02-10 16:55:00")},
		{"660e8400-e29b-41d4-a716-446655440011", "user_999", strPtr("550e8400-e29b-41d4-a716-446655440010"), "Random Notes", "// just some test code", []string{"misc"}, false, false, parseTime("2024-02-11 19:30:00"), parseTime("2024-02-11 19:30:00")},
	}

	for _, s := range snippets {
		_, err := db.Exec(`
			INSERT INTO snippets (id, user_id, collection_id, title, content, tags, is_public, is_favorite, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, s.id, s.userID, s.collectionID, s.title, s.content, pq.StringArray(s.tags), s.isPublic, s.isFavorite, s.createdAt, s.updatedAt)
		if err != nil {
			return err
		}
	}
	log.Printf("   - %d snippets seeded", len(snippets))
	return nil
}

// helper: parse fixed timestamps
func parseTime(str string) time.Time {
	t, _ := time.Parse("2006-01-02 15:04:05", str)
	return t
}

// helper: return pointer to string
func strPtr(s string) *string {
	return &s
}
