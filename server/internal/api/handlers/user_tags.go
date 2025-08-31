package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"snippy-server/internal/database"
)

type UserTag struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateUserTagRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type UpdateUserTagRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// CreateUserTag creates a new tag for a user
func CreateUserTag(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateUserTagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Tag name is required", http.StatusBadRequest)
		return
	}

	if req.Color == "" {
		req.Color = "#3b82f6" // Default blue color
	}

	tagID := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO user_tags (id, user_id, name, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, name, color, created_at, updated_at
	`

	var tag UserTag
	err := database.GetDB().QueryRow(
		query,
		tagID,
		userID,
		req.Name,
		req.Color,
		now,
		now,
	).Scan(
		&tag.ID,
		&tag.UserID,
		&tag.Name,
		&tag.Color,
		&tag.CreatedAt,
		&tag.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating user tag: %v", err)
		http.Error(w, "Failed to create tag", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tag,
	})
}

// GetUserTags fetches all tags for a user
func GetUserTags(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := `
		SELECT id, user_id, name, color, created_at, updated_at
		FROM user_tags
		WHERE user_id = $1
		ORDER BY name ASC
	`

	rows, err := database.GetDB().Query(query, userID)
	if err != nil {
		log.Printf("Error fetching user tags: %v", err)
		http.Error(w, "Failed to fetch tags", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tags []UserTag
	for rows.Next() {
		var tag UserTag
		err := rows.Scan(
			&tag.ID,
			&tag.UserID,
			&tag.Name,
			&tag.Color,
			&tag.CreatedAt,
			&tag.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning tag: %v", err)
			continue
		}
		tags = append(tags, tag)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tags,
	})
}

// GetUserTag fetches a specific tag by ID
func GetUserTag(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	tagID := vars["id"]

	query := `
		SELECT id, user_id, name, color, created_at, updated_at
		FROM user_tags
		WHERE id = $1 AND user_id = $2
	`

	var tag UserTag
	err := database.GetDB().QueryRow(query, tagID, userID).Scan(
		&tag.ID,
		&tag.UserID,
		&tag.Name,
		&tag.Color,
		&tag.CreatedAt,
		&tag.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Tag not found", http.StatusNotFound)
		return
	}

	if err != nil {
		log.Printf("Error fetching user tag: %v", err)
		http.Error(w, "Failed to fetch tag", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tag,
	})
}

// UpdateUserTag updates a tag for a user
func UpdateUserTag(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	tagID := vars["id"]

	var req UpdateUserTagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Tag name is required", http.StatusBadRequest)
		return
	}

	if req.Color == "" {
		req.Color = "#3b82f6" // Default blue color
	}

	query := `
		UPDATE user_tags
		SET name = $1, color = $2, updated_at = $3
		WHERE id = $4 AND user_id = $5
		RETURNING id, user_id, name, color, created_at, updated_at
	`

	var tag UserTag
	err := database.GetDB().QueryRow(
		query,
		req.Name,
		req.Color,
		time.Now(),
		tagID,
		userID,
	).Scan(
		&tag.ID,
		&tag.UserID,
		&tag.Name,
		&tag.Color,
		&tag.CreatedAt,
		&tag.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Tag not found", http.StatusNotFound)
		return
	}

	if err != nil {
		log.Printf("Error updating user tag: %v", err)
		http.Error(w, "Failed to update tag", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tag,
	})
}

// DeleteUserTag deletes a tag for a user
func DeleteUserTag(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	tagID := vars["id"]

	// Start a transaction to handle the deletion
	tx, err := database.GetDB().Begin()
	if err != nil {
		log.Printf("Error starting transaction: %v", err)
		http.Error(w, "Failed to delete tag", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// First, remove this tag from all snippets that reference it
	updateQuery := `
		UPDATE snippets
		SET tag_ids = array_remove(tag_ids, $1)
		WHERE user_id = $2 AND $1 = ANY(tag_ids)
	`
	_, err = tx.Exec(updateQuery, tagID, userID)
	if err != nil {
		log.Printf("Error updating snippets: %v", err)
		http.Error(w, "Failed to delete tag", http.StatusInternalServerError)
		return
	}

	// Then delete the tag
	deleteQuery := `
		DELETE FROM user_tags
		WHERE id = $1 AND user_id = $2
	`
	result, err := tx.Exec(deleteQuery, tagID, userID)
	if err != nil {
		log.Printf("Error deleting user tag: %v", err)
		http.Error(w, "Failed to delete tag", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		http.Error(w, "Failed to delete tag", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Tag not found", http.StatusNotFound)
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		http.Error(w, "Failed to delete tag", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Tag deleted successfully",
	})
}
