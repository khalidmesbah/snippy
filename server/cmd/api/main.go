/*
Snippy Code Snippet Manager - Backend API Server

This is a REST API server for managing code snippets and collections.
Built with Go, it provides endpoints for creating, reading, updating, and deleting
code snippets organized in collections.
*/
package main

import (
	"database/sql"             // Standard Go database interface for SQL databases
	"encoding/json"            // JSON encoding/decoding for API requests/responses
	"fmt"                      // String formatting utilities
	"github.com/joho/godotenv" // Load environment variables from .env file
	"log"                      // Logging functionality
	"net/http"                 // HTTP server and client functionality
	"os"                       // Environment variables
	"strings"                  // String manipulation utilities
	"time"                     // Time handling for timestamps

	"github.com/google/uuid"      // Generate unique identifiers for database records
	"github.com/gorilla/handlers" // ????
	"github.com/gorilla/mux"      // HTTP router with URL parameters and middleware support
	"github.com/lib/pq"           // PostgreSQL driver
	_ "github.com/lib/pq"         // PostgreSQL database driver (imported for side effects)
)

// ============================================================================
// DATA MODELS - Database table representations
// ============================================================================

// Collection - A folder/category for organizing code snippets
type Collection struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"` // Hex color for UI
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Snippet - A single code snippet with metadata
type Snippet struct {
	ID           string         `json:"id"`
	UserID       string         `json:"user_id"`
	CollectionID *string        `json:"collection_id"` // Optional - can be null
	Title        string         `json:"title"`
	Content      string         `json:"content"`     // The actual code
	Tags         pq.StringArray `db:"tags"`          // <- handles Postgres text[]
	IsPublic     bool           `json:"is_public"`   // Public snippets can be viewed by anyone
	IsFavorite   bool           `json:"is_favorite"` // User's favorite snippets
	Position     int            `json:"position"`    // Order within collection
	ForkCount    int            `json:"fork_count"`  // Number of forks
	ForkedFrom   *string        `json:"forked_from"` // Original snippet ID if forked
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// ============================================================================
// REQUEST MODELS - JSON payloads for API endpoints
// ============================================================================

// CreateCollectionRequest - Payload for creating collections
type CreateCollectionRequest struct {
	Name   string `json:"name"`
	Color  string `json:"color"`
	UserID string `json:"user_id"`
}

// UpdateCollectionRequest - Payload for updating collections (partial updates)
type UpdateCollectionRequest struct {
	Name  *string `json:"name,omitempty"`  // Optional field
	Color *string `json:"color,omitempty"` // Optional field
}

// CreateSnippetRequest - Payload for creating snippets
type CreateSnippetRequest struct {
	UserID       string         `json:"user_id"`
	CollectionID *string        `json:"collection_id"` // Optional
	Title        string         `json:"title"`
	Content      string         `json:"content"`
	Tags         pq.StringArray `json:"tags"`
	IsPublic     bool           `json:"is_public"`
	IsFavorite   bool           `json:"is_favorite"`
}

// UpdateSnippetRequest - Payload for updating snippets (partial updates)
type UpdateSnippetRequest struct {
	Title        *string        `json:"title,omitempty"`
	Content      *string        `json:"content,omitempty"`
	Tags         pq.StringArray `json:"tags,omitempty"`
	IsPublic     *bool          `json:"is_public,omitempty"`
	IsFavorite   *bool          `json:"is_favorite,omitempty"`
	CollectionID *string        `json:"collection_id,omitempty"`
	Position     *int           `json:"position,omitempty"`
}

// ForkSnippetRequest - Payload for forking snippets
type ForkSnippetRequest struct {
	UserID string `json:"user_id"`
}

// Response - Standard API response format for all endpoints
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// ============================================================================
// GLOBAL DATABASE CONNECTION
// ============================================================================

var db *sql.DB // Global database connection pool

// ============================================================================
// MIDDLEWARE FUNCTIONS - Request preprocessing
// ============================================================================

// loggingMiddleware - Logs all HTTP requests for debugging
// Records method, path, and response time for each request
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[%s] %s - %v", r.Method, r.URL.Path, time.Since(start))
	})
}

// ============================================================================
// UTILITY FUNCTIONS - Common response helpers
// ============================================================================

// sendJSON - Sends a JSON response with proper headers
func sendJSON(w http.ResponseWriter, status int, response Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

// sendError - Sends a standardized error response
func sendError(w http.ResponseWriter, status int, message string) {
	sendJSON(w, status, Response{
		Success: false,
		Message: message,
		Error:   message,
	})
}

// checkCollectionNameExists - Checks if collection name already exists for user
// Returns true if name exists, false otherwise
func checkCollectionNameExists(userID, name, excludeID string) (bool, error) {
	var count int
	var query string
	var args []interface{}

	if excludeID != "" {
		// For updates - exclude current collection from check
		query = "SELECT COUNT(*) FROM collections WHERE user_id = $1 AND name = $2 AND id != $3"
		args = []interface{}{userID, name, excludeID}
	} else {
		// For creates - check all collections
		query = "SELECT COUNT(*) FROM collections WHERE user_id = $1 AND name = $2"
		args = []interface{}{userID, name}
	}

	err := db.QueryRow(query, args...).Scan(&count)
	return count > 0, err
}

// verifyOwnership - Checks if user owns a resource (collection or snippet)
// Returns owner's user ID or error if not found
func verifyOwnership(table, resourceID string) (string, error) {
	var ownerID string
	query := fmt.Sprintf("SELECT user_id FROM %s WHERE id = $1", table)
	err := db.QueryRow(query, resourceID).Scan(&ownerID)
	return ownerID, err
}

// ============================================================================
// COLLECTION HANDLERS - Manage snippet collections/folders
// ============================================================================

// createCollection - POST /api/collections
// Creates a new collection for organizing snippets
func createCollection(w http.ResponseWriter, r *http.Request) {
	var req CreateCollectionRequest

	// Parse JSON from request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	// Validate required fields
	if req.Name == "" || req.UserID == "" {
		sendError(w, http.StatusBadRequest, "Name and user_id are required")
		return
	}

	// Check for duplicate collection names
	exists, err := checkCollectionNameExists(req.UserID, req.Name, "")
	if err != nil {
		log.Printf("Error checking collection name: %v", err)
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if exists {
		sendError(w, http.StatusConflict, "Collection with this name already exists")
		return
	}

	// Set default color if not provided
	if req.Color == "" {
		req.Color = "#3B82F6"
	}

	// Insert new collection into database
	id := uuid.New().String()
	query := `
		INSERT INTO collections (id, user_id, name, color)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, name, color, created_at, updated_at`

	var collection Collection
	err = db.QueryRow(query, id, req.UserID, req.Name, req.Color).Scan(
		&collection.ID, &collection.UserID, &collection.Name, &collection.Color,
		&collection.CreatedAt, &collection.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating collection: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to create collection")
		return
	}

	sendJSON(w, http.StatusCreated, Response{
		Success: true,
		Message: "Collection created successfully",
		Data:    collection,
	})
}

// getCollections - GET /api/collections?user_id=<id>
// Retrieves all collections for a specific user
func getCollections(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		sendError(w, http.StatusBadRequest, "user_id parameter is required")
		return
	}

	// Query all collections for the user, ordered by creation date
	query := `
		SELECT id, user_id, name, color, created_at, updated_at
		FROM collections
		WHERE user_id = $1
		ORDER BY created_at DESC`

	rows, err := db.Query(query, userID)
	if err != nil {
		log.Printf("Error fetching collections: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch collections")
		return
	}
	defer rows.Close()

	// Scan all rows into collection slice
	var collections []Collection
	for rows.Next() {
		var collection Collection
		if err := rows.Scan(&collection.ID, &collection.UserID, &collection.Name,
			&collection.Color, &collection.CreatedAt, &collection.UpdatedAt); err != nil {
			log.Printf("Error scanning collection: %v", err)
			continue
		}
		collections = append(collections, collection)
	}

	sendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Collections fetched successfully",
		Data:    collections,
	})
}

// updateCollection - PUT /api/collections/{id}?user_id=<id>
// Updates an existing collection (name and/or color)
func updateCollection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collectionID := vars["id"]

	var req UpdateCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		sendError(w, http.StatusBadRequest, "user_id parameter is required")
		return
	}

	// Verify user owns this collection
	ownerID, err := verifyOwnership("collections", collectionID)
	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Collection not found")
		return
	}
	if err != nil {
		log.Printf("Error checking ownership: %v", err)
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if ownerID != userID {
		sendError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Check for duplicate name if name is being updated
	if req.Name != nil {
		exists, err := checkCollectionNameExists(userID, *req.Name, collectionID)
		if err != nil {
			log.Printf("Error checking collection name: %v", err)
			sendError(w, http.StatusInternalServerError, "Database error")
			return
		}
		if exists {
			sendError(w, http.StatusConflict, "Collection with this name already exists")
			return
		}
	}

	// Build dynamic update query based on provided fields
	var setParts []string
	var args []interface{}
	argCount := 0

	if req.Name != nil {
		argCount++
		setParts = append(setParts, fmt.Sprintf("name = $%d", argCount))
		args = append(args, *req.Name)
	}

	if req.Color != nil {
		argCount++
		setParts = append(setParts, fmt.Sprintf("color = $%d", argCount))
		args = append(args, *req.Color)
	}

	if len(setParts) == 0 {
		sendError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	// Add updated_at timestamp
	argCount++
	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argCount))
	args = append(args, time.Now())

	// Add WHERE conditions
	argCount++
	args = append(args, collectionID)
	argCount++
	args = append(args, userID)

	// Execute update and return updated collection
	query := fmt.Sprintf(`
		UPDATE collections SET %s 
		WHERE id = $%d AND user_id = $%d 
		RETURNING id, user_id, name, color, created_at, updated_at`,
		strings.Join(setParts, ", "), argCount-1, argCount)

	var collection Collection
	err = db.QueryRow(query, args...).Scan(
		&collection.ID, &collection.UserID, &collection.Name, &collection.Color,
		&collection.CreatedAt, &collection.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error updating collection: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to update collection")
		return
	}

	sendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Collection updated successfully",
		Data:    collection,
	})
}

// deleteCollection - DELETE /api/collections/{id}?user_id=<id>
// Removes a collection (only if user owns it)
func deleteCollection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collectionID := vars["id"]

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		sendError(w, http.StatusBadRequest, "user_id parameter is required")
		return
	}

	// Delete collection only if user owns it
	result, err := db.Exec("DELETE FROM collections WHERE id = $1 AND user_id = $2",
		collectionID, userID)
	if err != nil {
		log.Printf("Error deleting collection: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to delete collection")
		return
	}

	// Check if any rows were deleted
	affected, _ := result.RowsAffected()
	if affected == 0 {
		sendError(w, http.StatusNotFound, "Collection not found or access denied")
		return
	}

	sendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Collection deleted successfully",
	})
}

// ============================================================================
// SNIPPET HANDLERS - Manage individual code snippets
// ============================================================================

// createSnippet - POST /api/snippets
// Creates a new code snippet
func createSnippet(w http.ResponseWriter, r *http.Request) {
	var req CreateSnippetRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	// Validate required fields
	if req.Title == "" || req.Content == "" || req.UserID == "" {
		sendError(w, http.StatusBadRequest, "Title, content, and user_id are required")
		return
	}

	// Insert snippet into database
	id := uuid.New().String()
	query := `
		INSERT INTO snippets (id, user_id, collection_id, title, content, tags, is_public, is_favorite)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, user_id, collection_id, title, content, tags, is_public, is_favorite, 
		          position, fork_count, forked_from, created_at, updated_at`

	var snippet Snippet
	err := db.QueryRow(query, id, req.UserID, req.CollectionID, req.Title,
		req.Content, req.Tags, req.IsPublic, req.IsFavorite).Scan(
		&snippet.ID, &snippet.UserID, &snippet.CollectionID, &snippet.Title, &snippet.Content,
		&snippet.Tags, &snippet.IsPublic, &snippet.IsFavorite, &snippet.Position,
		&snippet.ForkCount, &snippet.ForkedFrom, &snippet.CreatedAt, &snippet.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating snippet: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to create snippet")
		return
	}

	sendJSON(w, http.StatusCreated, Response{
		Success: true,
		Message: "Snippet created successfully",
		Data:    snippet,
	})
}

// getSnippets - GET /api/snippets with optional query parameters
// Supports filtering by: user_id, collection_id, is_public, is_favorite,
// search, tags
func getSnippets(w http.ResponseWriter, r *http.Request) {
	// Build dynamic query based on query parameters
	var conditions []string
	var args []interface{}
	argCount := 0

	// Add conditions based on query parameters
	if userID := r.URL.Query().Get("user_id"); userID != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argCount))
		args = append(args, userID)
	}

	if collectionID := r.URL.Query().Get("collection_id"); collectionID != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("collection_id = $%d", argCount))
		args = append(args, collectionID)
	}

	// Handle boolean filters
	if isPublic := r.URL.Query().Get("is_public"); isPublic == "true" {
		conditions = append(conditions, "is_public = true")
	} else if isPublic == "false" {
		conditions = append(conditions, "is_public = false")
	}

	if isFavorite := r.URL.Query().Get("is_favorite"); isFavorite == "true" {
		conditions = append(conditions, "is_favorite = true")
	} else if isFavorite == "false" {
		conditions = append(conditions, "is_favorite = false")
	}

	// Search in title and content
	if search := r.URL.Query().Get("search"); search != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("(title ILIKE $%d OR content ILIKE $%d)", argCount, argCount))
		args = append(args, "%"+search+"%")
	}

	// Build final query
	query := `
		SELECT id, user_id, collection_id, title, content, tags, is_public, is_favorite, 
		       position, fork_count, forked_from, created_at, updated_at
		FROM snippets`

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY created_at DESC"

	// Execute query
	rows, err := db.Query(query, args...)
	if err != nil {
		log.Printf("Error fetching snippets: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippets")
		return
	}
	defer rows.Close()

	// Scan all rows
	var snippets []Snippet
	for rows.Next() {
		var snippet Snippet
		if err := rows.Scan(&snippet.ID, &snippet.UserID, &snippet.CollectionID,
			&snippet.Title, &snippet.Content, &snippet.Tags, &snippet.IsPublic,
			&snippet.IsFavorite, &snippet.Position, &snippet.ForkCount,
			&snippet.ForkedFrom, &snippet.CreatedAt, &snippet.UpdatedAt); err != nil {
			log.Printf("Error scanning snippet: %v", err)
			continue
		}
		snippets = append(snippets, snippet)
	}

	sendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Snippets fetched successfully",
		Data:    snippets,
	})
}

// getSnippet - GET /api/snippets/{id}?user_id=<id>
// Retrieves a single snippet by ID (must be public or owned by user)
func getSnippet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	snippetID := vars["id"]
	userID := r.URL.Query().Get("user_id")

	var query string
	var args []interface{}

	if userID != "" {
		// User provided: return if they own it OR if it's public
		query = `
			SELECT id, user_id, collection_id, title, content, tags, is_public, is_favorite, 
			       position, fork_count, forked_from, created_at, updated_at
			FROM snippets
			WHERE id = $1 AND (user_id = $2 OR is_public = true)`
		args = []interface{}{snippetID, userID}
	} else {
		// No user: only return public snippets
		query = `
			SELECT id, user_id, collection_id, title, content, tags, is_public, is_favorite, 
			       position, fork_count, forked_from, created_at, updated_at
			FROM snippets
			WHERE id = $1 AND is_public = true`
		args = []interface{}{snippetID}
	}

	var snippet Snippet
	err := db.QueryRow(query, args...).Scan(
		&snippet.ID, &snippet.UserID, &snippet.CollectionID, &snippet.Title, &snippet.Content,
		&snippet.Tags, &snippet.IsPublic, &snippet.IsFavorite, &snippet.Position,
		&snippet.ForkCount, &snippet.ForkedFrom, &snippet.CreatedAt, &snippet.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Snippet not found or access denied")
		return
	}

	if err != nil {
		log.Printf("Error fetching snippet: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippet")
		return
	}

	sendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Snippet fetched successfully",
		Data:    snippet,
	})
}

// updateSnippet - PUT /api/snippets/{id}?user_id=<id>
// Updates an existing snippet (only owner can update)
func updateSnippet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	snippetID := vars["id"]

	var req UpdateSnippetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		sendError(w, http.StatusBadRequest, "user_id parameter is required")
		return
	}

	// Verify ownership
	ownerID, err := verifyOwnership("snippets", snippetID)
	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Snippet not found")
		return
	}
	if err != nil {
		log.Printf("Error checking ownership: %v", err)
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if ownerID != userID {
		sendError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Build dynamic update query
	var setParts []string
	var args []interface{}
	argCount := 0

	if req.Title != nil {
		argCount++
		setParts = append(setParts, fmt.Sprintf("title = $%d", argCount))
		args = append(args, *req.Title)
	}

	if req.Content != nil {
		argCount++
		setParts = append(setParts, fmt.Sprintf("content = $%d", argCount))
		args = append(args, *req.Content)
	}

	if req.IsPublic != nil {
		argCount++
		setParts = append(setParts, fmt.Sprintf("is_public = $%d", argCount))
		args = append(args, *req.IsPublic)
	}

	if req.IsFavorite != nil {
		argCount++
		setParts = append(setParts, fmt.Sprintf("is_favorite = $%d", argCount))
		args = append(args, *req.IsFavorite)
	}

	if req.CollectionID != nil {
		argCount++
		setParts = append(setParts, fmt.Sprintf("collection_id = $%d", argCount))
		args = append(args, req.CollectionID)
	}

	if req.Position != nil {
		argCount++
		setParts = append(setParts, fmt.Sprintf("position = $%d", argCount))
		args = append(args, *req.Position)
	}

	if len(setParts) == 0 {
		sendError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	// Add updated_at timestamp
	argCount++
	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argCount))
	args = append(args, time.Now())

	// Add WHERE conditions
	argCount++
	args = append(args, snippetID)
	argCount++
	args = append(args, userID)

	query := fmt.Sprintf("UPDATE snippets SET %s WHERE id = $%d AND user_id = $%d",
		strings.Join(setParts, ", "), argCount-1, argCount)

	result, err := db.Exec(query, args...)
	if err != nil {
		log.Printf("Error updating snippet: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to update snippet")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		sendError(w, http.StatusNotFound, "Snippet not found or access denied")
		return
	}

	sendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Snippet updated successfully",
	})
}

// deleteSnippet - DELETE /api/snippets/{id}?user_id=<id>
// Removes a snippet (only owner can delete)
func deleteSnippet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	snippetID := vars["id"]

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		sendError(w, http.StatusBadRequest, "user_id parameter is required")
		return
	}

	result, err := db.Exec("DELETE FROM snippets WHERE id = $1 AND user_id = $2",
		snippetID, userID)
	if err != nil {
		log.Printf("Error deleting snippet: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to delete snippet")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		sendError(w, http.StatusNotFound, "Snippet not found or access denied")
		return
	}

	sendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Snippet deleted successfully",
	})
}

// forkSnippet - POST /api/snippets/{id}/fork
// Creates a copy of a public snippet for the requesting user
func forkSnippet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	snippetID := vars["id"]

	var req ForkSnippetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if req.UserID == "" {
		sendError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	// Get original public snippet
	var original Snippet
	query := `SELECT title, content, tags FROM snippets WHERE id = $1 AND is_public = true`
	err := db.QueryRow(query, snippetID).Scan(&original.Title, &original.Content, &original.Tags)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Public snippet not found")
		return
	}
	if err != nil {
		log.Printf("Error fetching original snippet: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippet")
		return
	}

	// Create forked snippet (always private by default)
	forkID := uuid.New().String()
	insertQuery := `
		INSERT INTO snippets (id, user_id, title, content, tags, is_public, forked_from)
		VALUES ($1, $2, $3, $4, $5, false, $6)
		RETURNING id, user_id, collection_id, title, content, tags, is_public, is_favorite, 
		          position, fork_count, forked_from, created_at, updated_at`

	var forked Snippet
	err = db.QueryRow(insertQuery, forkID, req.UserID, "Fork of "+original.Title,
		original.Content, original.Tags, snippetID).Scan(
		&forked.ID, &forked.UserID, &forked.CollectionID, &forked.Title, &forked.Content,
		&forked.Tags, &forked.IsPublic, &forked.IsFavorite, &forked.Position,
		&forked.ForkCount, &forked.ForkedFrom, &forked.CreatedAt, &forked.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating fork: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fork snippet")
		return
	}

	// Increment fork count on original snippet
	db.Exec("UPDATE snippets SET fork_count = fork_count + 1 WHERE id = $1", snippetID)

	sendJSON(w, http.StatusCreated, Response{
		Success: true,
		Message: "Snippet forked successfully",
		Data:    forked,
	})
}

// ============================================================================
// HEALTH CHECK - Server status endpoint
// ============================================================================

// healthCheck - GET /health
// Verifies that the server and database are working properly
func healthCheck(w http.ResponseWriter, r *http.Request) {
	// Test database connection
	if err := db.Ping(); err != nil {
		sendError(w, http.StatusServiceUnavailable, "Database connection failed")
		return
	}

	sendJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Server is healthy",
		Data: map[string]interface{}{
			"status":    "ok",
			"timestamp": time.Now().Unix(),
			"database":  "connected",
		},
	})
}

// ============================================================================
// MAIN FUNCTION - Server initialization and startup
// ============================================================================

func main() {
	// Database connection setup
	// Using Neon PostgreSQL hosting service
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️  No .env file found, falling back to system environment variables")
	}

	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("❌ DATABASE_URL not set in environment")
	}

	// Open database connection
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}
	defer db.Close()

	// Test the connection
	if err = db.Ping(); err != nil {
		log.Fatal("❌ Failed to ping database:", err)
	}

	log.Println("✅ Database connected successfully")
	// HTTP router setup using Gorilla Mux
	// Mux provides URL parameter extraction and middleware support
	r := mux.NewRouter()

	// Apply middleware to all routes
	r.Use(loggingMiddleware) // Log all requests

	// API routes group - all API endpoints start with /api
	api := r.PathPrefix("/api").Subrouter()

	// Collection management endpoints
	api.HandleFunc("/collections", createCollection).Methods("POST")        // Create collection
	api.HandleFunc("/collections", getCollections).Methods("GET")           // List collections
	api.HandleFunc("/collections/{id}", updateCollection).Methods("PUT")    // Update collection
	api.HandleFunc("/collections/{id}", deleteCollection).Methods("DELETE") // Delete collection

	// Snippet management endpoints
	api.HandleFunc("/snippets", createSnippet).Methods("POST")         // Create snippet
	api.HandleFunc("/snippets", getSnippets).Methods("GET")            // List/search snippets
	api.HandleFunc("/snippets/{id}", getSnippet).Methods("GET")        // Get single snippet
	api.HandleFunc("/snippets/{id}", updateSnippet).Methods("PUT")     // Update snippet
	api.HandleFunc("/snippets/{id}", deleteSnippet).Methods("DELETE")  // Delete snippet
	api.HandleFunc("/snippets/{id}/fork", forkSnippet).Methods("POST") // Fork public snippet

	// Health check endpoint (outside /api prefix for monitoring tools)
	r.HandleFunc("/health", healthCheck).Methods("GET")

	// Start the HTTP server
	port := ":8080"
	log.Printf("🚀 Snippy Server starting on http://localhost%s", port)
	log.Println("📋 API Endpoints:")
	log.Println("   Collections:")
	log.Println("     POST   /api/collections                    - Create collection")
	log.Println("     GET    /api/collections?user_id=<id>       - List user collections")
	log.Println("     PUT    /api/collections/{id}?user_id=<id>  - Update collection")
	log.Println("     DELETE /api/collections/{id}?user_id=<id> - Delete collection")
	log.Println("   Snippets:")
	log.Println("     POST   /api/snippets                       - Create snippet")
	log.Println("     GET    /api/snippets?[filters]             - List/search snippets")
	log.Println("     GET    /api/snippets/{id}?user_id=<id>     - Get single snippet")
	log.Println("     PUT    /api/snippets/{id}?user_id=<id>     - Update snippet")
	log.Println("     DELETE /api/snippets/{id}?user_id=<id>     - Delete snippet")
	log.Println("     POST   /api/snippets/{id}/fork             - Fork public snippet")
	log.Println("   Health:")
	log.Println("     GET    /health                             - Server health check")

	log.Println("📊 Summary:")
	log.Println("   - 6 collections created")
	log.Println("   - 14 snippets created")
	log.Println("   - Multiple users: user_123, user_456, user_789, user_101, user_999")

	// Start server - this blocks until server stops
	log.Fatal(http.ListenAndServe(port, handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Authorization", "Content-Type"}),
	)(r)))
}

// Helper function to convert string to *string pointer
func stringPtr(s string) *string {
	return &s
}

// Helper function to parse time strings
func parseTime(timeStr string) time.Time {
	t, err := time.Parse("2006-01-02 15:04:05", timeStr)
	if err != nil {
		log.Fatal("Error parsing time:", err)
	}
	return t
}
