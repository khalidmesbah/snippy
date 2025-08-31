package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"snippy-server/internal/database"
	"snippy-server/internal/models"
)

// CreateTag creates a new tag for the authenticated user
func CreateTag(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Parse request body
	var req models.CreateTagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Validate required fields
	if req.Name == "" {
		sendError(w, http.StatusBadRequest, "Tag name is required")
		return
	}

	// Normalize tag name (trim whitespace, convert to lowercase)
	tagName := strings.TrimSpace(strings.ToLower(req.Name))
	if tagName == "" {
		sendError(w, http.StatusBadRequest, "Tag name cannot be empty")
		return
	}

	// Check if tag already exists for this user (case-insensitive)
	var existingTagID string
	err := database.GetDB().QueryRow(`
		SELECT id FROM tags 
		WHERE LOWER(name) = LOWER($1) AND user_id = $2`,
		tagName, userID).Scan(&existingTagID)

	if err == nil {
		// Tag already exists
		sendError(w, http.StatusConflict, "Tag with this name already exists")
		return
	} else if err != sql.ErrNoRows {
		// Database error
		sendError(w, http.StatusInternalServerError, "Failed to check tag existence: "+err.Error())
		return
	}

	// Generate UUID for tag
	tagID := uuid.New().String()
	now := time.Now()

	// Insert tag into database (provide default color)
	_, err = database.GetDB().Exec(`
		INSERT INTO tags (id, name, user_id, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		tagID, tagName, userID, "#3b82f6", now, now)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create tag: "+err.Error())
		return
	}

	// Create response
	tag := models.Tag{
		ID:        tagID,
		Name:      tagName,
		UserID:    userID,
		CreatedAt: now,
		UpdatedAt: now,
	}

	response := models.Response{
		Success: true,
		Message: "Tag created successfully",
		Data:    tag,
	}

	log.Printf("✅ Tag created: %s (ID: %s) for user: %s", tagName, tagID, userID)
	sendJSON(w, http.StatusCreated, response)
}

// GetTags retrieves all tags for the authenticated user
func GetTags(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Query tags from database
	rows, err := database.GetDB().Query(`
		SELECT id, name, user_id, created_at, updated_at
		FROM tags
		WHERE user_id = $1`, userID)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch tags: "+err.Error())
		return
	}
	defer rows.Close()

	// initialize as empty slice to avoid null in JSON
	tags := make([]models.Tag, 0)
	for rows.Next() {
		var t models.Tag
		err := rows.Scan(&t.ID, &t.Name, &t.UserID, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to scan tag: "+err.Error())
			return
		}
		tags = append(tags, t)
	}

	if err = rows.Err(); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to iterate tags: "+err.Error())
		return
	}

	log.Println("tags: ", tags)
	response := models.Response{
		Success: true,
		Message: "Tags retrieved successfully",
		Data:    tags,
	}

	sendJSON(w, http.StatusOK, response)
}

// UpdateTag updates an existing tag
func UpdateTag(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Get tag ID from URL
	vars := mux.Vars(r)
	tagID := vars["id"]

	// Parse request body
	var req models.UpdateTagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Validate required fields
	if req.Name == "" {
		sendError(w, http.StatusBadRequest, "Tag name is required")
		return
	}

	// Normalize tag name
	tagName := strings.TrimSpace(strings.ToLower(req.Name))
	if tagName == "" {
		sendError(w, http.StatusBadRequest, "Tag name cannot be empty")
		return
	}

	// Check if tag exists and belongs to user
	var existingTag models.Tag
	err := database.GetDB().QueryRow(`
		SELECT id, name, user_id, created_at, updated_at
		FROM tags
		WHERE id = $1 AND user_id = $2`,
		tagID, userID).Scan(&existingTag.ID, &existingTag.Name, &existingTag.UserID, &existingTag.CreatedAt, &existingTag.UpdatedAt)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Tag not found")
		return
	} else if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch tag: "+err.Error())
		return
	}

	// Check if new name conflicts with existing tag (case-insensitive)
	var conflictingTagID string
	err = database.GetDB().QueryRow(`
		SELECT id FROM tags 
		WHERE LOWER(name) = LOWER($1) AND user_id = $2 AND id != $3`,
		tagName, userID, tagID).Scan(&conflictingTagID)

	if err == nil {
		// Tag name conflicts with another tag
		sendError(w, http.StatusConflict, "Tag with this name already exists")
		return
	} else if err != sql.ErrNoRows {
		// Database error
		sendError(w, http.StatusInternalServerError, "Failed to check tag name conflict: "+err.Error())
		return
	}

	// Update tag in database
	now := time.Now()
	_, err = database.GetDB().Exec(`
		UPDATE tags 
		SET name = $1, updated_at = $2
		WHERE id = $3 AND user_id = $4`,
		tagName, now, tagID, userID)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update tag: "+err.Error())
		return
	}

	// Create response
	updatedTag := models.Tag{
		ID:        tagID,
		Name:      tagName,
		UserID:    userID,
		CreatedAt: existingTag.CreatedAt,
		UpdatedAt: now,
	}

	response := models.Response{
		Success: true,
		Message: "Tag updated successfully",
		Data:    updatedTag,
	}

	log.Printf("✅ Tag updated: %s (ID: %s) for user: %s", tagName, tagID, userID)
	sendJSON(w, http.StatusOK, response)
}

// DeleteTag deletes a tag and removes it from all snippets
func DeleteTag(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Get tag ID from URL
	vars := mux.Vars(r)
	tagID := vars["id"]

	// Check if tag exists and belongs to user
	var tagName string
	err := database.GetDB().QueryRow(`
		SELECT name FROM tags
		WHERE id = $1 AND user_id = $2`,
		tagID, userID).Scan(&tagName)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Tag not found")
		return
	} else if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch tag: "+err.Error())
		return
	}

	// Start transaction
	tx, err := database.GetDB().Begin()
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start transaction: "+err.Error())
		return
	}
	defer tx.Rollback()

	// Delete tag from all snippets (snippet_tags table)
	_, err = tx.Exec(`DELETE FROM snippet_tags WHERE tag_id = $1`, tagID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to remove tag from snippets: "+err.Error())
		return
	}

	// Delete the tag
	_, err = tx.Exec(`DELETE FROM tags WHERE id = $1 AND user_id = $2`, tagID, userID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete tag: "+err.Error())
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to commit transaction: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Tag deleted successfully",
		Data: map[string]interface{}{
			"deleted_tag_id":   tagID,
			"deleted_tag_name": tagName,
		},
	}

	log.Printf("🗑️ Tag deleted: %s (ID: %s) for user: %s", tagName, tagID, userID)
	sendJSON(w, http.StatusOK, response)
}

// AssignTagsToSnippet assigns tags to a snippet
func AssignTagsToSnippet(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("user_id").(string)

	// Get snippet ID from URL
	vars := mux.Vars(r)
	snippetID := vars["id"]

	// Parse request body
	var req models.AssignTagsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Check if snippet exists and belongs to user
	var snippetTitle string
	err := database.GetDB().QueryRow(`
		SELECT title FROM snippets
		WHERE id = $1 AND user_id = $2`,
		snippetID, userID).Scan(&snippetTitle)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Snippet not found")
		return
	} else if err != nil {
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

	// Remove existing tag assignments
	_, err = tx.Exec(`DELETE FROM snippet_tags WHERE snippet_id = $1`, snippetID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to remove existing tag assignments: "+err.Error())
		return
	}

	// Assign new tags
	if len(req.TagIDs) > 0 {
		// Verify all tags belong to user
		placeholders := make([]string, len(req.TagIDs))
		args := make([]interface{}, len(req.TagIDs)+1)
		args[0] = userID

		for i, tagID := range req.TagIDs {
			placeholders[i] = fmt.Sprintf("$%d", i+2)
			args[i+1] = tagID
		}

		query := fmt.Sprintf(`
			SELECT id FROM tags 
			WHERE user_id = $1 AND id IN (%s)`, strings.Join(placeholders, ","))

		rows, err := tx.Query(query, args...)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to verify tags: "+err.Error())
			return
		}
		defer rows.Close()

		var validTagIDs []string
		for rows.Next() {
			var tagID string
			if err := rows.Scan(&tagID); err != nil {
				sendError(w, http.StatusInternalServerError, "Failed to scan tag ID: "+err.Error())
				return
			}
			validTagIDs = append(validTagIDs, tagID)
		}

		// Insert new tag assignments
		for _, tagID := range validTagIDs {
			_, err = tx.Exec(`
				INSERT INTO snippet_tags (snippet_id, tag_id, created_at)
				VALUES ($1, $2, $3)`,
				snippetID, tagID, time.Now())
			if err != nil {
				sendError(w, http.StatusInternalServerError, "Failed to assign tag: "+err.Error())
				return
			}
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to commit transaction: "+err.Error())
		return
	}

	response := models.Response{
		Success: true,
		Message: "Tags assigned successfully",
		Data: map[string]interface{}{
			"snippet_id": snippetID,
			"tag_count":  len(req.TagIDs),
		},
	}

	log.Printf("🏷️ Tags assigned to snippet: %s (ID: %s) for user: %s", snippetTitle, snippetID, userID)
	sendJSON(w, http.StatusOK, response)
}
