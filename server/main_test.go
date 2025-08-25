// main_test.go
package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// Setup global db variable for tests
var testDB *sql.DB

// Setup runs before any tests
func TestMain(m *testing.M) {
	// Load env vars from .env file
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		log.Fatal("TEST_DATABASE_URL not set in .env")
	}

	// Connect to test DB
	testDB, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to test database: %v", err)
	}

	// Assign test DB to global app DB
	db = testDB

	// Run tests
	code := m.Run()

	// Cleanup
	_ = testDB.Close()
	os.Exit(code)
}

// Create router with middleware and test handlers
func setupRouter() *mux.Router {
	r := mux.NewRouter()
	r.Use(corsMiddleware)
	r.Use(loggingMiddleware)

	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/collections", createCollection).Methods("POST")
	api.HandleFunc("/collections", getCollections).Methods("GET")
	api.HandleFunc("/snippets", getSnippets).Methods("GET")

	return r
}

// Helper: create JSON POST request
func jsonPost(url string, body interface{}) (*http.Request, error) {
	jsonData, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("POST", url, bytes.NewReader(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	return req, nil
}

// 🔹 TEST: Create Collection
func TestCreateCollection(t *testing.T) {
	router := setupRouter()

	payload := CreateCollectionRequest{
		Name:   "Test Collection",
		Color:  "#22C55E",
		UserID: "test-user-id",
	}

	req, err := jsonPost("/api/collections", payload)
	if err != nil {
		t.Fatalf("Error creating request: %v", err)
	}

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("Expected 201 Created, got %d", rr.Code)
	}

	var res Response
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if !res.Success {
		t.Errorf("Expected success=true, got false: %s", res.Error)
	}
}

// 🔹 TEST: Get Collections
func TestGetCollections(t *testing.T) {
	router := setupRouter()

	req, err := http.NewRequest("GET", "/api/collections?user_id=test-user-id", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d", rr.Code)
	}
}

// 🔹 TEST: Get Snippets
func TestGetSnippets(t *testing.T) {
	router := setupRouter()

	req, err := http.NewRequest("GET", "/api/snippets?user_id=test-user-id", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d", rr.Code)
	}
}
