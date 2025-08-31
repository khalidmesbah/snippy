package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"snippy-server/internal/database"
	"snippy-server/internal/models"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// createCollection creates a new collection for the authenticated user
func CreateCollection(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID := r.Context().Value("user_id").(string)

	// Parse request body
	var req models.CreateCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Validate required fields
	if req.Name == "" {
		sendError(w, http.StatusBadRequest, "Collection name is required")
		return
	}

	if req.Color == "" {
		req.Color = "#3b82f6" // Default blue color
	}

	// Generate UUID for collection
	collectionID := uuid.New().String()
	now := time.Now()

	// Insert collection into database
	_, err := database.GetDB().Exec(`
		INSERT INTO collections (id, user_id, name, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		collectionID, userID, req.Name, req.Color, now, now)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create collection: "+err.Error())
		return
	}

	// Create response
	collection := models.Collection{
		ID:        collectionID,
		UserID:    userID,
		Name:      req.Name,
		Color:     req.Color,
		CreatedAt: now,
		UpdatedAt: now,
	}

	response := models.Response{
		Success: true,
		Message: "Collection created successfully",
		Data:    collection,
	}

	sendJSON(w, http.StatusCreated, response)
}

// getCollections retrieves all collections for the authenticated user
func GetCollections(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Query collections with snippet counts from database
	rows, err := database.GetDB().Query(`
		SELECT 
			c.id, 
			c.user_id, 
			c.name, 
			c.color, 
			c.created_at, 
			c.updated_at,
			COALESCE(COUNT(s.id), 0) as snippet_count,
			COALESCE(cp.position, 999999) as position
		FROM collections c
		LEFT JOIN snippets s ON c.id = ANY(s.collection_ids)
		LEFT JOIN collection_positions cp ON c.id = cp.collection_id AND cp.user_id = c.user_id
		WHERE c.user_id = $1
		GROUP BY c.id, c.user_id, c.name, c.color, c.created_at, c.updated_at, cp.position
		ORDER BY position ASC, c.created_at DESC`, userID)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch collections: "+err.Error())
		return
	}
	defer rows.Close()

	// initialize as empty slice to avoid null in JSON
	collections := make([]models.Collection, 0)
	for rows.Next() {
		var c models.Collection
		var snippetCount int
		var position int
		err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.Color, &c.CreatedAt, &c.UpdatedAt, &snippetCount, &position)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to scan collection: "+err.Error())
			return
		}
		// Set the snippet count
		c.SnippetCount = &snippetCount
		// Set the position
		c.Position = &position
		collections = append(collections, c)
	}

	response := models.Response{
		Success: true,
		Message: "Collections retrieved successfully",
		Data:    collections,
	}

	sendJSON(w, http.StatusOK, response)
}

// updateCollection updates an existing collection
func UpdateCollection(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Get collection ID from URL parameters
	vars := mux.Vars(r)
	collectionID := vars["id"]

	// Parse request body
	var req models.UpdateCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Check if collection exists and belongs to user
	var existingCollection models.Collection
	err := database.GetDB().QueryRow(`
		SELECT id, user_id, name, color, created_at, updated_at
		FROM collections
		WHERE id = $1 AND user_id = $2`,
		collectionID, userID).Scan(
		&existingCollection.ID, &existingCollection.UserID, &existingCollection.Name,
		&existingCollection.Color, &existingCollection.CreatedAt, &existingCollection.UpdatedAt)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Collection not found")
		return
	}
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch collection: "+err.Error())
		return
	}

	// Build update query dynamically
	query := "UPDATE collections SET updated_at = $1"
	args := []interface{}{time.Now()}
	argIndex := 2

	if req.Name != nil {
		query += ", name = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Name)
		argIndex++
	}

	if req.Color != nil {
		query += ", color = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Color)
		argIndex++
	}

	query += " WHERE id = $" + strconv.Itoa(argIndex) + " AND user_id = $" + strconv.Itoa(argIndex+1)
	args = append(args, collectionID, userID)

	// Execute update
	_, err = database.GetDB().Exec(query, args...)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update collection: "+err.Error())
		return
	}

	// Fetch updated collection
	var updatedCollection models.Collection
	err = database.GetDB().QueryRow(`
		SELECT id, user_id, name, color, created_at, updated_at
		FROM collections
		WHERE id = $1 AND user_id = $2`,
		collectionID, userID).Scan(
		&updatedCollection.ID, &updatedCollection.UserID, &updatedCollection.Name,
		&updatedCollection.Color, &updatedCollection.CreatedAt, &updatedCollection.UpdatedAt)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch updated collection: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Collection updated successfully",
		Data:    updatedCollection,
	}

	sendJSON(w, http.StatusOK, response)
}

// deleteCollection deletes a collection and its snippets
func DeleteCollection(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Get collection ID from URL parameters
	vars := mux.Vars(r)
	collectionID := vars["id"]

	// Check if collection exists and belongs to user
	var collection models.Collection
	err := database.GetDB().QueryRow(`
		SELECT id, user_id, name, color, created_at, updated_at
		FROM collections
		WHERE id = $1 AND user_id = $2`,
		collectionID, userID).Scan(
		&collection.ID, &collection.UserID, &collection.Name,
		&collection.Color, &collection.CreatedAt, &collection.UpdatedAt)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Collection not found")
		return
	}
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch collection: "+err.Error())
		return
	}

	// Start transaction
	tx, err := database.GetDB().Begin()
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start transaction: "+err.Error())
		return
	}
	defer tx.Rollback()

	// Delete collection position record
	_, err = tx.Exec("DELETE FROM collection_positions WHERE collection_id = $1 AND user_id = $2", collectionID, userID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete collection position: "+err.Error())
		return
	}

	// Delete snippet position records for this collection
	_, err = tx.Exec("DELETE FROM collection_snippet_positions WHERE collection_id = $1 AND user_id = $2", collectionID, userID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete snippet positions: "+err.Error())
		return
	}

	// Delete snippets in collection first
	_, err = tx.Exec("DELETE FROM snippets WHERE collection_id = $1 AND user_id = $2", collectionID, userID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete snippets: "+err.Error())
		return
	}

	// Delete collection
	_, err = tx.Exec("DELETE FROM collections WHERE id = $1 AND user_id = $2", collectionID, userID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete collection: "+err.Error())
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to commit transaction: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Collection and all its snippets deleted successfully",
		Data:    collection,
	}

	sendJSON(w, http.StatusOK, response)
}

// GetCollectionSnippets retrieves snippets for a specific collection with positions
func GetCollectionSnippets(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Get collection ID from URL parameters
	vars := mux.Vars(r)
	collectionID := vars["id"]

	// Check if collection exists and belongs to user
	var collection models.Collection
	err := database.GetDB().QueryRow(`
		SELECT id, user_id, name, color, created_at, updated_at
		FROM collections
		WHERE id = $1 AND user_id = $2`,
		collectionID, userID).Scan(
		&collection.ID, &collection.UserID, &collection.Name,
		&collection.Color, &collection.CreatedAt, &collection.UpdatedAt)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Collection not found")
		return
	}
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch collection: "+err.Error())
		return
	}

	// Query snippets with positions for this collection
	rows, err := database.GetDB().Query(`
		SELECT s.id, s.user_id, s.title, s.content, s.is_favorite, s.created_at,
		       COALESCE(csp.position, 0) as position
		FROM snippets s
		LEFT JOIN collection_snippet_positions csp ON s.id = csp.snippet_id AND csp.collection_id = $1
		WHERE s.user_id = $2 AND $1 = ANY(s.collection_ids)
		ORDER BY COALESCE(csp.position, 0), s.created_at DESC`, collectionID, userID)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippets: "+err.Error())
		return
	}
	defer rows.Close()

	// Build response with snippets and positions
	type SnippetWithPosition struct {
		ID         string    `json:"id"`
		UserID     string    `json:"user_id"`
		Title      string    `json:"title"`
		Content    string    `json:"content"`
		IsFavorite bool      `json:"is_favorite"`
		Position   int       `json:"position"`
		CreatedAt  time.Time `json:"created_at"`
	}

	snippets := make([]SnippetWithPosition, 0)
	for rows.Next() {
		var snippet SnippetWithPosition
		err := rows.Scan(&snippet.ID, &snippet.UserID, &snippet.Title, &snippet.Content,
			&snippet.IsFavorite, &snippet.CreatedAt, &snippet.Position)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to scan snippet: "+err.Error())
			return
		}
		snippets = append(snippets, snippet)
	}

	response := models.Response{
		Success: true,
		Message: "Collection snippets retrieved successfully",
		Data: map[string]interface{}{
			"collection": collection,
			"snippets":   snippets,
		},
	}

	sendJSON(w, http.StatusOK, response)
}

// UpdateCollectionPositions updates the positions of collections
func UpdateCollectionPositions(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	log.Printf("UpdateCollectionPositions called for user: %s", userID)

	// Parse request body
	var req struct {
		Positions []struct {
			ID       string `json:"id"`
			Position int    `json:"position"`
		} `json:"positions"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	log.Printf("Received positions update: %+v", req.Positions)

	if len(req.Positions) == 0 {
		log.Printf("No positions provided")
		sendError(w, http.StatusBadRequest, "No positions provided")
		return
	}

	// Start transaction
	tx, err := database.GetDB().Begin()
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start transaction: "+err.Error())
		return
	}
	defer tx.Rollback()

	// Check for duplicate positions first
	positionMap := make(map[int]string)
	for _, pos := range req.Positions {
		if existingID, exists := positionMap[pos.Position]; exists {
			log.Printf("Duplicate position %d found for collections %s and %s", pos.Position, existingID, pos.ID)
			sendError(w, http.StatusBadRequest, fmt.Sprintf("Duplicate position %d found for multiple collections", pos.Position))
			return
		}
		positionMap[pos.Position] = pos.ID
	}

	// Update positions
	for _, pos := range req.Positions {
		// Check if collection belongs to user
		var exists bool
		err := tx.QueryRow("SELECT EXISTS(SELECT 1 FROM collections WHERE id = $1 AND user_id = $2)",
			pos.ID, userID).Scan(&exists)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to validate collection ownership: "+err.Error())
			return
		}
		if !exists {
			sendError(w, http.StatusForbidden, "Collection not found or access denied")
			return
		}

		// Insert or update position
		_, err = tx.Exec(`
			INSERT INTO collection_positions (collection_id, user_id, position, created_at, updated_at)
			VALUES ($1, $2, $3, now(), now())
			ON CONFLICT (collection_id, user_id) 
			DO UPDATE SET position = $3, updated_at = now()`,
			pos.ID, userID, pos.Position)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to update position: "+err.Error())
			return
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to commit transaction: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Collection positions updated successfully",
	}

	sendJSON(w, http.StatusOK, response)
}

// UpdateCollectionSnippetPositions updates the positions of snippets within a collection
func UpdateCollectionSnippetPositions(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Get collection ID from URL parameters
	vars := mux.Vars(r)
	collectionID := vars["id"]

	// Check if collection exists and belongs to user
	var exists bool
	err := database.GetDB().QueryRow("SELECT EXISTS(SELECT 1 FROM collections WHERE id = $1 AND user_id = $2)",
		collectionID, userID).Scan(&exists)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to validate collection ownership: "+err.Error())
		return
	}
	if !exists {
		sendError(w, http.StatusForbidden, "Collection not found or access denied")
		return
	}

	// Parse request body
	var req struct {
		Positions []struct {
			ID       string `json:"id"`
			Position int    `json:"position"`
		} `json:"positions"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if len(req.Positions) == 0 {
		sendError(w, http.StatusBadRequest, "No positions provided")
		return
	}

	// Start transaction
	tx, err := database.GetDB().Begin()
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start transaction: "+err.Error())
		return
	}
	defer tx.Rollback()

	// Update snippet positions
	for _, pos := range req.Positions {
		// Check if snippet belongs to user and is in this collection
		var exists bool
		err := tx.QueryRow("SELECT EXISTS(SELECT 1 FROM snippets WHERE id = $1 AND user_id = $2 AND $3 = ANY(collection_ids))",
			pos.ID, userID, collectionID).Scan(&exists)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to validate snippet ownership: "+err.Error())
			return
		}
		if !exists {
			sendError(w, http.StatusForbidden, "Snippet not found or not in collection")
			return
		}

		// Insert or update position
		_, err = tx.Exec(`
			INSERT INTO collection_snippet_positions (collection_id, snippet_id, user_id, position, created_at, updated_at)
			VALUES ($1, $2, $3, $4, now(), now())
			ON CONFLICT (collection_id, snippet_id) 
			DO UPDATE SET position = $4, updated_at = now()`,
			collectionID, pos.ID, userID, pos.Position)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to update snippet position: "+err.Error())
			return
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to commit transaction: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Snippet positions updated successfully",
	}

	sendJSON(w, http.StatusOK, response)
}
