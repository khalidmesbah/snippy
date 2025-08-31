package api

import (
	"encoding/json"
	"net/http"

	"snippy-server/internal/api/handlers"
	"snippy-server/internal/api/middleware"
	"snippy-server/internal/models"

	"github.com/gorilla/mux"
)

// SetupRoutes configures all the API routes and middleware
func SetupRoutes() *mux.Router {
	r := mux.NewRouter()

	// Apply global middleware
	r.Use(middleware.CORS)
	r.Use(middleware.Logging)

	// Health check endpoint (no auth required)
	r.HandleFunc("/health", handlers.HealthCheck).Methods("GET")

	// Debug endpoint (no auth required)
	r.HandleFunc("/debug", handlers.DebugAuth).Methods("GET")

	// Public endpoints (no auth required)
	// ai-keep-in-mind endpoints
	r.HandleFunc("/api/snippets/public", handlers.GetPublicSnippets).Methods("GET")
	r.HandleFunc("/api/snippets/public/{id}", handlers.GetPublicSnippet).Methods("GET")

	// Protected API routes (require authentication)
	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.Auth)

	// Collection routes (use `collections` table per docs)
	api.HandleFunc("/collections", handlers.GetCollections).Methods("GET")
	api.HandleFunc("/collections/create", handlers.CreateCollection).Methods("POST")
	api.HandleFunc("/collections/positions", handlers.UpdateCollectionPositions).Methods("PUT")
	api.HandleFunc("/collections/{id}", handlers.UpdateCollection).Methods("PUT")
	api.HandleFunc("/collections/{id}", handlers.DeleteCollection).Methods("DELETE")
	api.HandleFunc("/collections/{id}/snippets", handlers.GetCollectionSnippets).Methods("GET")
	api.HandleFunc("/collections/{id}/snippets/positions", handlers.UpdateCollectionSnippetPositions).Methods("PUT")

	// Snippet routes - ai-keep-in-mind
	api.HandleFunc("/snippets", handlers.GetSnippets).Methods("GET")
	api.HandleFunc("/snippets/my-public", handlers.GetUserPublicSnippets).Methods("GET")
	api.HandleFunc("/snippets/create", handlers.CreateSnippet).Methods("POST")
	api.HandleFunc("/snippets/fork", handlers.ForkSnippetByBody).Methods("POST")
	api.HandleFunc("/snippets/{id}", handlers.GetSnippet).Methods("GET")
	api.HandleFunc("/snippets/{id}", handlers.UpdateSnippet).Methods("PUT")
	api.HandleFunc("/snippets/{id}", handlers.DeleteSnippet).Methods("DELETE")

	// Tag routes (use `tags` table per docs)
	api.HandleFunc("/tags", handlers.GetTags).Methods("GET")
	api.HandleFunc("/tags/create", handlers.CreateTag).Methods("POST")
	api.HandleFunc("/tags/{id}", handlers.UpdateTag).Methods("PUT")
	api.HandleFunc("/tags/{id}", handlers.DeleteTag).Methods("DELETE")

	// Handle OPTIONS requests for CORS preflight
	r.Methods("OPTIONS").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// 404 handler for unmatched routes
	r.NotFoundHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(models.Response{
			Success: false,
			Message: "Error",
			Error:   "Endpoint not found",
		})
	})

	return r
}
