package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"snippy-server/internal/database"
	"snippy-server/internal/models"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
)

// getUserIDFromContext safely extracts user ID from request context
func getUserIDFromContext(r *http.Request) (string, error) {
	userIDInterface := r.Context().Value("user_id")
	if userIDInterface == nil {
		return "", fmt.Errorf("user not authenticated")
	}

	userID, ok := userIDInterface.(string)
	if !ok {
		return "", fmt.Errorf("invalid user ID format")
	}

	return userID, nil
}

// createSnippet creates a new snippet for the authenticated user
func CreateSnippet(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, err := getUserIDFromContext(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Parse request body
	var req models.CreateSnippetRequest

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Validate required fields
	if req.Title == "" {
		sendError(w, http.StatusBadRequest, "Snippet title is required")
		return
	}

	if req.Content == "" {
		sendError(w, http.StatusBadRequest, "Snippet content is required")
		return
	}

	// Generate UUID for snippet
	snippetID := uuid.New().String()
	now := time.Now()

	// Start transaction
	tx, err := database.GetDB().Begin()
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start transaction: "+err.Error())
		return
	}
	defer tx.Rollback()

	// Use the arrays as-is, only convert nil to empty arrays
	collectionIDs := req.CollectionIDs
	if collectionIDs == nil {
		collectionIDs = []string{}
	}

	tagIDs := req.TagIDs
	if tagIDs == nil {
		tagIDs = []string{}
	}

	// Insert snippet into database with new schema
	_, err = tx.Exec(`
		INSERT INTO snippets (id, user_id, title, content, collection_ids, tag_ids, is_public, is_favorite, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		snippetID, userID, req.Title, req.Content,
		pq.Array(collectionIDs),
		pq.Array(tagIDs),
		req.IsPublic, req.IsFavorite, now, now)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create snippet: "+err.Error())
		return
	}

	// Fetch the created snippet WITHIN THE TRANSACTION
	var snippet models.Snippet
	var fetchedCollectionIDs pq.StringArray
	var fetchedTagIDs pq.StringArray

	err = tx.QueryRow(`
		SELECT s.id, s.user_id, s.title, s.content, s.collection_ids, s.tag_ids, s.is_public, s.is_favorite, s.fork_count, s.forked_from, s.created_at, s.updated_at
		FROM snippets s
		WHERE s.id = $1`, snippetID).Scan(
		&snippet.ID, &snippet.UserID, &snippet.Title, &snippet.Content,
		&fetchedCollectionIDs, &fetchedTagIDs, &snippet.IsPublic, &snippet.IsFavorite, &snippet.ForkCount,
		&snippet.ForkedFrom, &snippet.CreatedAt, &snippet.UpdatedAt)

	// Convert pq.StringArray to []string, handling nil cases
	if fetchedCollectionIDs == nil {
		snippet.CollectionIDs = []string{}
	} else {
		snippet.CollectionIDs = []string(fetchedCollectionIDs)
	}

	if fetchedTagIDs == nil {
		snippet.TagIDs = []string{}
	} else {
		snippet.TagIDs = []string(fetchedTagIDs)
	}

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch created snippet: "+err.Error())
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to commit transaction: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Snippet created successfully",
		Data:    snippet,
	}

	sendJSON(w, http.StatusCreated, response)
}

// getSnippets retrieves all snippets for the authenticated user
func GetSnippets(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, err := getUserIDFromContext(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Get query parameters
	collectionID := r.URL.Query().Get("collection_id")
	search := r.URL.Query().Get("search")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	// Set default values
	limit := 50
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Build query
	query := `
		SELECT s.id, s.user_id, s.title, s.content, s.collection_ids::text[], s.tag_ids::text[], s.is_public, s.is_favorite, s.fork_count, s.forked_from, s.created_at, s.updated_at
		FROM snippets s
		WHERE s.user_id = $1`

	args := []interface{}{userID}
	argIndex := 2

	if collectionID != "" {
		query += " AND $" + strconv.Itoa(argIndex) + " = ANY(collection_ids)"
		args = append(args, collectionID)
		argIndex++
	}

	if search != "" {
		query += " AND (title ILIKE $" + strconv.Itoa(argIndex) + " OR content ILIKE $" + strconv.Itoa(argIndex) + ")"
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm)
		argIndex++
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argIndex) + " OFFSET $" + strconv.Itoa(argIndex+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := database.GetDB().Query(query, args...)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippets: "+err.Error())
		return
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		var colIDs pq.StringArray
		var tagIDs pq.StringArray
		err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Content, &colIDs, &tagIDs, &s.IsPublic, &s.IsFavorite, &s.ForkCount, &s.ForkedFrom, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to scan snippet: "+err.Error())
			return
		}

		// Convert pq.StringArray to []string, handling nil cases
		if colIDs == nil {
			s.CollectionIDs = []string{}
		} else {
			s.CollectionIDs = []string(colIDs)
		}

		if tagIDs == nil {
			s.TagIDs = []string{}
		} else {
			s.TagIDs = []string(tagIDs)
		}

		snippets = append(snippets, s)
	}

	response := models.Response{
		Success: true,
		Message: "Snippets retrieved successfully",
		Data:    snippets,
	}

	sendJSON(w, http.StatusOK, response)
}

// getSnippet retrieves a specific snippet by ID
func GetSnippet(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, err := getUserIDFromContext(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Get snippet ID from URL parameters
	vars := mux.Vars(r)
	snippetID := vars["id"]

	// Query snippet from database with tag names
	var snippet models.Snippet
	var collectionIDs pq.StringArray
	var tagIDs pq.StringArray
	var tagNames pq.StringArray

	err = database.GetDB().QueryRow(`
		SELECT s.id, s.user_id, s.title, s.content, s.collection_ids::text[], s.tag_ids::text[], 
		       COALESCE(array_agg(t.name ORDER BY array_position(s.tag_ids::text[], t.id::text)) FILTER (WHERE t.name IS NOT NULL), '{}') as tag_names,
		       s.is_public, s.is_favorite, s.fork_count, s.forked_from, s.created_at, s.updated_at
		FROM snippets s
		LEFT JOIN LATERAL unnest(s.tag_ids::text[]) WITH ORDINALITY AS tag_id(id, ord) ON true
		LEFT JOIN tags t ON t.id::text = tag_id.id
		WHERE s.id = $1 AND s.user_id = $2
		GROUP BY s.id, s.user_id, s.title, s.content, s.collection_ids, s.tag_ids, s.is_public, s.is_favorite, s.fork_count, s.forked_from, s.created_at, s.updated_at`,
		snippetID, userID).Scan(
		&snippet.ID, &snippet.UserID, &snippet.Title, &snippet.Content,
		&collectionIDs, &tagIDs, &tagNames, &snippet.IsPublic, &snippet.IsFavorite,
		&snippet.ForkCount, &snippet.ForkedFrom, &snippet.CreatedAt, &snippet.UpdatedAt)

	// Convert pq.StringArray to []string, handling nil cases
	if collectionIDs == nil {
		snippet.CollectionIDs = []string{}
	} else {
		snippet.CollectionIDs = []string(collectionIDs)
	}

	if tagIDs == nil {
		snippet.TagIDs = []string{}
	} else {
		snippet.TagIDs = []string(tagIDs)
	}

	// Add tag names to snippet
	if tagNames == nil {
		snippet.TagNames = []string{}
	} else {
		snippet.TagNames = []string(tagNames)
	}

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Snippet not found")
		return
	}
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippet: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Snippet retrieved successfully",
		Data:    snippet,
	}

	sendJSON(w, http.StatusOK, response)
}

// updateSnippet updates an existing snippet
func UpdateSnippet(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, err := getUserIDFromContext(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Get snippet ID from URL parameters
	vars := mux.Vars(r)
	snippetID := vars["id"]

	// Parse request body
	var req models.UpdateSnippetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Check if snippet exists and belongs to user
	var existingSnippet models.Snippet
	var existingCollectionIDs pq.StringArray
	var existingTagIDs pq.StringArray

	err = database.GetDB().QueryRow(`
		SELECT id, user_id, title, content, collection_ids, tag_ids, is_public, is_favorite, fork_count, forked_from, created_at, updated_at
		FROM snippets
		WHERE id = $1 AND user_id = $2`,
		snippetID, userID).Scan(
		&existingSnippet.ID, &existingSnippet.UserID, &existingSnippet.Title,
		&existingSnippet.Content, &existingCollectionIDs, &existingTagIDs, &existingSnippet.IsPublic, &existingSnippet.IsFavorite,
		&existingSnippet.ForkCount, &existingSnippet.ForkedFrom,
		&existingSnippet.CreatedAt, &existingSnippet.UpdatedAt)

	// Convert pq.StringArray to []string, handling nil cases
	if existingCollectionIDs == nil {
		existingSnippet.CollectionIDs = []string{}
	} else {
		existingSnippet.CollectionIDs = []string(existingCollectionIDs)
	}

	if existingTagIDs == nil {
		existingSnippet.TagIDs = []string{}
	} else {
		existingSnippet.TagIDs = []string(existingTagIDs)
	}

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Snippet not found")
		return
	}
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippet: "+err.Error())
		return
	}

	// Build update query dynamically
	query := "UPDATE snippets SET updated_at = $1"
	args := []interface{}{time.Now()}
	argIndex := 2

	if req.Title != nil {
		query += ", title = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Title)
		argIndex++
	}

	if req.Content != nil {
		query += ", content = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Content)
		argIndex++
	}

	if req.TagIDs != nil {
		query += ", tag_ids = $" + strconv.Itoa(argIndex)
		// Ensure we have empty arrays instead of nil
		tagIDs := req.TagIDs
		if tagIDs == nil {
			tagIDs = []string{}
		}
		args = append(args, pq.Array(tagIDs))
		argIndex++
	}

	if req.IsPublic != nil {
		query += ", is_public = $" + strconv.Itoa(argIndex)
		args = append(args, *req.IsPublic)
		argIndex++
	}

	if req.IsFavorite != nil {
		query += ", is_favorite = $" + strconv.Itoa(argIndex)
		args = append(args, *req.IsFavorite)
		argIndex++
	}

	if req.CollectionIDs != nil {
		query += ", collection_ids = $" + strconv.Itoa(argIndex)
		// Ensure we have empty arrays instead of nil
		collectionIDs := req.CollectionIDs
		if collectionIDs == nil {
			collectionIDs = []string{}
		}
		args = append(args, pq.Array(collectionIDs))
		argIndex++
	}

	query += " WHERE id = $" + strconv.Itoa(argIndex) + " AND user_id = $" + strconv.Itoa(argIndex+1)
	args = append(args, snippetID, userID)

	// Execute update
	_, err = database.GetDB().Exec(query, args...)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update snippet: "+err.Error())
		return
	}

	// Fetch updated snippet
	var updatedSnippet models.Snippet
	var updatedCollectionIDs pq.StringArray
	var updatedTagIDs pq.StringArray

	err = database.GetDB().QueryRow(`
		SELECT id, user_id, title, content, collection_ids, tag_ids, is_public, is_favorite, fork_count, forked_from, created_at, updated_at
		FROM snippets
		WHERE id = $1 AND user_id = $2`,
		snippetID, userID).Scan(
		&updatedSnippet.ID, &updatedSnippet.UserID, &updatedSnippet.Title,
		&updatedSnippet.Content, &updatedCollectionIDs, &updatedTagIDs, &updatedSnippet.IsPublic, &updatedSnippet.IsFavorite,
		&updatedSnippet.ForkCount, &updatedSnippet.ForkedFrom,
		&updatedSnippet.CreatedAt, &updatedSnippet.UpdatedAt)

	// Convert pq.StringArray to []string, handling nil cases
	if updatedCollectionIDs == nil {
		updatedSnippet.CollectionIDs = []string{}
	} else {
		updatedSnippet.CollectionIDs = []string(updatedCollectionIDs)
	}

	if updatedTagIDs == nil {
		updatedSnippet.TagIDs = []string{}
	} else {
		updatedSnippet.TagIDs = []string(updatedTagIDs)
	}

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch updated snippet: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Snippet updated successfully",
		Data:    updatedSnippet,
	}

	sendJSON(w, http.StatusOK, response)
}

// deleteSnippet deletes a snippet
func DeleteSnippet(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, err := getUserIDFromContext(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Get snippet ID from URL parameters
	vars := mux.Vars(r)
	snippetID := vars["id"]

	// First, check if snippet exists and belongs to user
	var snippetIDCheck string
	err = database.GetDB().QueryRow(`
		SELECT id FROM snippets WHERE id = $1 AND user_id = $2`,
		snippetID, userID).Scan(&snippetIDCheck)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Snippet not found")
		return
	}
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to check snippet: "+err.Error())
		return
	}

	// Simple delete without transaction for now
	_, err = database.GetDB().Exec("DELETE FROM snippets WHERE id = $1 AND user_id = $2", snippetID, userID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete snippet: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Snippet deleted successfully",
		Data:    map[string]string{"id": snippetID},
	}

	sendJSON(w, http.StatusOK, response)
}

// forkSnippet forks a public snippet to the user's collection
func ForkSnippet(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, err := getUserIDFromContext(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Get snippet ID from URL parameters
	vars := mux.Vars(r)
	snippetID := vars["id"]

	// Check if snippet exists and is public
	var originalSnippet models.Snippet
	var originalCollectionIDs pq.StringArray
	var originalTagIDs pq.StringArray

	err = database.GetDB().QueryRow(`
		SELECT id, user_id, title, content, collection_ids, tag_ids, is_public, is_favorite, fork_count, forked_from, created_at, updated_at
		FROM snippets
		WHERE id = $1 AND is_public = true`,
		snippetID).Scan(
		&originalSnippet.ID, &originalSnippet.UserID, &originalSnippet.Title,
		&originalSnippet.Content, &originalCollectionIDs, &originalTagIDs, &originalSnippet.IsPublic, &originalSnippet.IsFavorite,
		&originalSnippet.ForkCount, &originalSnippet.ForkedFrom,
		&originalSnippet.CreatedAt, &originalSnippet.UpdatedAt)

	// Convert pq.StringArray to []string, handling nil cases
	if originalCollectionIDs == nil {
		originalSnippet.CollectionIDs = []string{}
	} else {
		originalSnippet.CollectionIDs = []string(originalCollectionIDs)
	}

	if originalTagIDs == nil {
		originalSnippet.TagIDs = []string{}
	} else {
		originalSnippet.TagIDs = []string(originalTagIDs)
	}

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Public snippet not found")
		return
	}
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippet: "+err.Error())
		return
	}

	// Start transaction
	tx, err := database.GetDB().Begin()
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start transaction: "+err.Error())
		return
	}
	defer tx.Rollback()

	// Increment fork count on original snippet
	_, err = tx.Exec("UPDATE snippets SET fork_count = fork_count + 1 WHERE id = $1", snippetID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update fork count: "+err.Error())
		return
	}

	// Create forked snippet
	forkedSnippetID := uuid.New().String()
	now := time.Now()

	// Ensure we have empty arrays instead of nil
	forkedCollectionIDs := originalSnippet.CollectionIDs
	if forkedCollectionIDs == nil {
		forkedCollectionIDs = []string{}
	}

	forkedTagIDs := originalSnippet.TagIDs
	if forkedTagIDs == nil {
		forkedTagIDs = []string{}
	}

	_, err = tx.Exec(`
		INSERT INTO snippets (id, user_id, title, content, collection_ids, tag_ids, is_public, is_favorite, fork_count, forked_from, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		forkedSnippetID, userID, originalSnippet.Title, originalSnippet.Content,
		pq.Array(forkedCollectionIDs), pq.Array(forkedTagIDs), false, false, 0, &snippetID, now, now)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create forked snippet: "+err.Error())
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to commit transaction: "+err.Error())
		return
	}

	// Create response
	forkedSnippet := models.Snippet{
		ID:            forkedSnippetID,
		UserID:        userID,
		CollectionIDs: originalSnippet.CollectionIDs,
		Title:         originalSnippet.Title,
		Content:       originalSnippet.Content,
		TagIDs:        originalSnippet.TagIDs,
		IsPublic:      false,
		IsFavorite:    false,

		ForkCount:  0,
		ForkedFrom: &snippetID,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	response := models.Response{
		Success: true,
		Message: "Snippet forked successfully",
		Data:    forkedSnippet,
	}

	sendJSON(w, http.StatusCreated, response)
}

// ForkSnippetByBody supports POST /api/snippets/fork with JSON body {"id": "<snippet_id>"}
func ForkSnippetByBody(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == "" {
		sendError(w, http.StatusBadRequest, "snippet id is required")
		return
	}
	// Re-route to path param variant for reuse
	r = mux.SetURLVars(r, map[string]string{"id": req.ID})
	ForkSnippet(w, r)
}

// GetPublicSnippets retrieves all public snippets (no authentication required)
func GetPublicSnippets(w http.ResponseWriter, r *http.Request) {
	// Get query parameters
	search := r.URL.Query().Get("search")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	shuffleStr := r.URL.Query().Get("shuffle")
	userID := r.URL.Query().Get("user_id")

	// Set default values
	limit := 50
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Build query
	query := `
		SELECT id, user_id, title, content, collection_ids::text[], tag_ids::text[], is_public, is_favorite, fork_count, forked_from, created_at, updated_at
		FROM snippets
		WHERE is_public = true`

	args := []interface{}{}
	argIndex := 1

	if userID != "" {
		query += " AND user_id = $" + strconv.Itoa(argIndex)
		args = append(args, userID)
		argIndex++
	}

	if search != "" {
		query += " AND (title ILIKE $" + strconv.Itoa(argIndex) + " OR content ILIKE $" + strconv.Itoa(argIndex) + ")"
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm)
		argIndex += 2
	}

	// Add ordering
	if shuffleStr == "true" {
		query += " ORDER BY RANDOM()"
	} else {
		query += " ORDER BY fork_count DESC, created_at DESC"
	}

	query += " LIMIT $" + strconv.Itoa(argIndex) + " OFFSET $" + strconv.Itoa(argIndex+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := database.GetDB().Query(query, args...)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch public snippets: "+err.Error())
		return
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		var colIDs pq.StringArray
		var tagIDs pq.StringArray
		err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Content, &colIDs, &tagIDs, &s.IsPublic, &s.IsFavorite, &s.ForkCount, &s.ForkedFrom, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to scan snippet: "+err.Error())
			return
		}

		// Convert pq.StringArray to []string, handling nil cases
		if colIDs == nil {
			s.CollectionIDs = []string{}
		} else {
			s.CollectionIDs = []string(colIDs)
		}

		if tagIDs == nil {
			s.TagIDs = []string{}
		} else {
			s.TagIDs = []string(tagIDs)
		}

		snippets = append(snippets, s)
	}

	response := models.Response{
		Success: true,
		Message: "Public snippets retrieved successfully",
		Data:    snippets,
	}

	sendJSON(w, http.StatusOK, response)
}

// GetPublicSnippet retrieves a specific public snippet by ID (no authentication required)
func GetPublicSnippet(w http.ResponseWriter, r *http.Request) {
	// Get snippet ID from URL parameters
	vars := mux.Vars(r)
	snippetID := vars["id"]

	// Query snippet from database with tag names
	var snippet models.Snippet
	var collectionIDs pq.StringArray
	var tagIDs pq.StringArray
	var tagNames pq.StringArray

	err := database.GetDB().QueryRow(`
		SELECT s.id, s.user_id, s.title, s.content, s.collection_ids::text[], s.tag_ids::text[], 
		       COALESCE(array_agg(t.name ORDER BY array_position(s.tag_ids::text[], t.id::text)) FILTER (WHERE t.name IS NOT NULL), '{}') as tag_names,
		       s.is_public, s.is_favorite, s.fork_count, s.forked_from, s.created_at, s.updated_at
		FROM snippets s
		LEFT JOIN LATERAL unnest(s.tag_ids::text[]) WITH ORDINALITY AS tag_id(id, ord) ON true
		LEFT JOIN tags t ON t.id::text = tag_id.id
		WHERE s.id = $1 AND s.is_public = true
		GROUP BY s.id, s.user_id, s.title, s.content, s.collection_ids, s.tag_ids, s.is_public, s.is_favorite, s.fork_count, s.forked_from, s.created_at, s.updated_at`,
		snippetID).Scan(
		&snippet.ID, &snippet.UserID, &snippet.Title, &snippet.Content,
		&collectionIDs, &tagIDs, &tagNames, &snippet.IsPublic, &snippet.IsFavorite,
		&snippet.ForkCount, &snippet.ForkedFrom, &snippet.CreatedAt, &snippet.UpdatedAt)

	// Convert pq.StringArray to []string, handling nil cases
	if collectionIDs == nil {
		snippet.CollectionIDs = []string{}
	} else {
		snippet.CollectionIDs = []string(collectionIDs)
	}

	if tagIDs == nil {
		snippet.TagIDs = []string{}
	} else {
		snippet.TagIDs = []string(tagIDs)
	}

	// Add tag names to snippet
	if tagNames == nil {
		snippet.TagNames = []string{}
	} else {
		snippet.TagNames = []string(tagNames)
	}

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Public snippet not found")
		return
	}
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch snippet: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Public snippet retrieved successfully",
		Data:    snippet,
	}

	sendJSON(w, http.StatusOK, response)
}

// GetUserPublicSnippets retrieves public snippets for the authenticated user
func GetUserPublicSnippets(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, err := getUserIDFromContext(r)
	if err != nil {
		sendError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Get query parameters
	search := r.URL.Query().Get("search")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	// Set default values
	limit := 50
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Build query
	query := `
		SELECT id, user_id, title, content, collection_ids::text[], tag_ids::text[], is_public, is_favorite, fork_count, forked_from, created_at, updated_at
		FROM snippets
		WHERE user_id = $1 AND is_public = true`

	args := []interface{}{userID}
	argIndex := 2

	if search != "" {
		query += " AND (title ILIKE $" + strconv.Itoa(argIndex) + " OR content ILIKE $" + strconv.Itoa(argIndex) + ")"
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argIndex) + " OFFSET $" + strconv.Itoa(argIndex+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := database.GetDB().Query(query, args...)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch user public snippets: "+err.Error())
		return
	}
	defer rows.Close()

	var snippets []models.Snippet
	for rows.Next() {
		var s models.Snippet
		var colIDs pq.StringArray
		var tagIDs pq.StringArray
		err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Content, &colIDs, &tagIDs, &s.IsPublic, &s.IsFavorite, &s.ForkCount, &s.ForkedFrom, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to scan snippet: "+err.Error())
			return
		}

		// Convert pq.StringArray to []string, handling nil cases
		if colIDs == nil {
			s.CollectionIDs = []string{}
		} else {
			s.CollectionIDs = []string(colIDs)
		}

		if tagIDs == nil {
			s.TagIDs = []string{}
		} else {
			s.TagIDs = []string(tagIDs)
		}

		snippets = append(snippets, s)
	}

	response := models.Response{
		Success: true,
		Message: "User public snippets retrieved successfully",
		Data:    snippets,
	}

	sendJSON(w, http.StatusOK, response)
}

// HealthCheck provides a simple health check endpoint
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	// Test database connection
	err := database.GetDB().Ping()
	if err != nil {
		sendError(w, http.StatusServiceUnavailable, "Database connection failed: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Service is healthy",
		Data: map[string]interface{}{
			"status":    "healthy",
			"database":  "connected",
			"timestamp": time.Now().Unix(),
		},
	}

	sendJSON(w, http.StatusOK, response)
}
