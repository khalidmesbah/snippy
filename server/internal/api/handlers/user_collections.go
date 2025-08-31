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

type UserCollection struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateUserCollectionRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type UpdateUserCollectionRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// CreateUserCollection creates a new collection for a user
func CreateUserCollection(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateUserCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Collection name is required", http.StatusBadRequest)
		return
	}

	if req.Color == "" {
		req.Color = "#3b82f6" // Default blue color
	}

	collectionID := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO user_collections (id, user_id, name, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, name, color, created_at, updated_at
	`

	var collection UserCollection
	err := database.GetDB().QueryRow(
		query,
		collectionID,
		userID,
		req.Name,
		req.Color,
		now,
		now,
	).Scan(
		&collection.ID,
		&collection.UserID,
		&collection.Name,
		&collection.Color,
		&collection.CreatedAt,
		&collection.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating user collection: %v", err)
		http.Error(w, "Failed to create collection", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    collection,
	})
}

// GetUserCollections fetches all collections for a user
func GetUserCollections(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := `
		SELECT id, user_id, name, color, created_at, updated_at
		FROM user_collections
		WHERE user_id = $1
		ORDER BY name ASC
	`

	rows, err := database.GetDB().Query(query, userID)
	if err != nil {
		log.Printf("Error fetching user collections: %v", err)
		http.Error(w, "Failed to fetch collections", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var collections []UserCollection
	for rows.Next() {
		var collection UserCollection
		err := rows.Scan(
			&collection.ID,
			&collection.UserID,
			&collection.Name,
			&collection.Color,
			&collection.CreatedAt,
			&collection.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning collection: %v", err)
			continue
		}
		collections = append(collections, collection)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    collections,
	})
}

// GetUserCollection fetches a specific collection by ID
func GetUserCollection(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	collectionID := vars["id"]

	query := `
		SELECT id, user_id, name, color, created_at, updated_at
		FROM user_collections
		WHERE id = $1 AND user_id = $2
	`

	var collection UserCollection
	err := database.GetDB().QueryRow(query, collectionID, userID).Scan(
		&collection.ID,
		&collection.UserID,
		&collection.Name,
		&collection.Color,
		&collection.CreatedAt,
		&collection.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	if err != nil {
		log.Printf("Error fetching user collection: %v", err)
		http.Error(w, "Failed to fetch collection", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    collection,
	})
}

// UpdateUserCollection updates a collection for a user
func UpdateUserCollection(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	collectionID := vars["id"]

	var req UpdateUserCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Collection name is required", http.StatusBadRequest)
		return
	}

	if req.Color == "" {
		req.Color = "#3b82f6" // Default blue color
	}

	query := `
		UPDATE user_collections
		SET name = $1, color = $2, updated_at = $3
		WHERE id = $4 AND user_id = $5
		RETURNING id, user_id, name, color, created_at, updated_at
	`

	var collection UserCollection
	err := database.GetDB().QueryRow(
		query,
		req.Name,
		req.Color,
		time.Now(),
		collectionID,
		userID,
	).Scan(
		&collection.ID,
		&collection.UserID,
		&collection.Name,
		&collection.Color,
		&collection.CreatedAt,
		&collection.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	if err != nil {
		log.Printf("Error updating user collection: %v", err)
		http.Error(w, "Failed to update collection", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    collection,
	})
}

// DeleteUserCollection deletes a collection for a user
func DeleteUserCollection(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	collectionID := vars["id"]

	// Start a transaction to handle the deletion
	tx, err := database.GetDB().Begin()
	if err != nil {
		log.Printf("Error starting transaction: %v", err)
		http.Error(w, "Failed to delete collection", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// First, remove this collection from all snippets that reference it
	updateQuery := `
		UPDATE snippets
		SET collection_ids = array_remove(collection_ids, $1)
		WHERE user_id = $2 AND $1 = ANY(collection_ids)
	`
	_, err = tx.Exec(updateQuery, collectionID, userID)
	if err != nil {
		log.Printf("Error updating snippets: %v", err)
		http.Error(w, "Failed to delete collection", http.StatusInternalServerError)
		return
	}

	// Then delete the collection
	deleteQuery := `
		DELETE FROM user_collections
		WHERE id = $1 AND user_id = $2
	`
	result, err := tx.Exec(deleteQuery, collectionID, userID)
	if err != nil {
		log.Printf("Error deleting user collection: %v", err)
		http.Error(w, "Failed to delete collection", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		http.Error(w, "Failed to delete collection", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		http.Error(w, "Failed to delete collection", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Collection deleted successfully",
	})
}
