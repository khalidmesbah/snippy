package models

import (
	"time"
)

// Collection - A folder/category for organizing code snippets
type Collection struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	Name         string    `json:"name"`
	Color        string    `json:"color"` // Hex color for UI
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	SnippetCount *int      `json:"snippet_count,omitempty"` // Optional field for display purposes
	Position     *int      `json:"position,omitempty"`      // Optional field for ordering
}

// Snippet - A single code snippet with metadata
type Snippet struct {
	ID            string   `json:"id"`
	UserID        string   `json:"user_id"`
	CollectionIDs []string `json:"collection_ids"` // Array of collection UUIDs
	Title         string   `json:"title"`
	Content       string   `json:"content"`     // The actual code
	TagIDs        []string `json:"tag_ids"`     // Array of tag UUIDs
	TagNames      []string `json:"tag_names"`   // Array of tag names for display
	IsPublic      bool     `json:"is_public"`   // Public snippets can be viewed by anyone
	IsFavorite    bool     `json:"is_favorite"` // User's favorite snippets

	ForkCount  int       `json:"fork_count"`  // Number of forks
	ForkedFrom *string   `json:"forked_from"` // Original snippet ID if forked
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// CreateCollectionRequest - Payload for creating collections
type CreateCollectionRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// UpdateCollectionRequest - Payload for updating collections (partial updates)
type UpdateCollectionRequest struct {
	Name  *string `json:"name,omitempty"`  // Optional field
	Color *string `json:"color,omitempty"` // Optional field
}

// CreateSnippetRequest - Payload for creating snippets
type CreateSnippetRequest struct {
	// Frontend fields (snake_case - matching what frontend actually sends)
	ID            *string  `json:"id,omitempty"`             // Optional - frontend may send this
	UserID        *string  `json:"user_id,omitempty"`        // Optional - frontend may send this
	CollectionIDs []string `json:"collection_ids,omitempty"` // Array of collection UUIDs (will use first one)
	Title         string   `json:"title"`
	Content       string   `json:"content"`
	TagIDs        []string `json:"tag_ids,omitempty"` // Array of tag UUIDs
	IsPublic      bool     `json:"is_public"`         // Frontend sends this
	IsFavorite    bool     `json:"is_favorite"`       // Frontend sends this

	ForkCount  *int       `json:"fork_count,omitempty"`  // Optional - frontend may send this
	ForkedFrom *string    `json:"forked_from,omitempty"` // Optional - frontend may send this
	CreatedAt  *time.Time `json:"created_at,omitempty"`  // Optional - frontend may send this
	UpdatedAt  *time.Time `json:"updated_at,omitempty"`  // Optional - frontend may send this
}

// UpdateSnippetRequest - Payload for updating snippets (partial updates)
type UpdateSnippetRequest struct {
	Title         *string  `json:"title,omitempty"`
	Content       *string  `json:"content,omitempty"`
	TagIDs        []string `json:"tag_ids,omitempty"`
	IsPublic      *bool    `json:"is_public,omitempty"`
	IsFavorite    *bool    `json:"is_favorite,omitempty"`
	CollectionIDs []string `json:"collection_ids,omitempty"`
}

// Tag - A tag that can be assigned to snippets
type Tag struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateTagRequest - Payload for creating tags
type CreateTagRequest struct {
	Name string `json:"name"`
}

// UpdateTagRequest - Payload for updating tags
type UpdateTagRequest struct {
	Name string `json:"name"`
}

// AssignTagsRequest - Payload for assigning tags to snippets
type AssignTagsRequest struct {
	TagIDs []string `json:"tag_ids"`
}

// ForkSnippetRequest - Payload for forking snippets (no user_id needed - from auth)
type ForkSnippetRequest struct {
	// User ID will be extracted from authentication context
}

// Response - Standard API response format for all endpoints
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
