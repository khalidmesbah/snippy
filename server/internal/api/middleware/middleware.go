package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"snippy-server/internal/auth"
	"snippy-server/internal/models"
)

// CORS middleware to handle cross-origin requests
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}

		// Allow specific origins in production - for now allowing all for development
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "3600")

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Logging middleware - Logs all HTTP requests for debugging
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[%s] %s - %v", r.Method, r.URL.Path, time.Since(start))
	})
}

// Authentication middleware - wraps handlers to require authentication
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Handle preflight OPTIONS request - skip authentication
		if r.Method == "OPTIONS" {
			next.ServeHTTP(w, r)
			return
		}

		// Set response type to JSON
		w.Header().Set("Content-Type", "application/json")

		// Extract and validate user ID from token
		userID, err := auth.GetUserIDFromContext(r)
		if err != nil {
			sendUnauthorized(w, "Authentication failed: "+err.Error())
			return
		}

		// Add user ID to request context for handlers to use
		ctx := r.Context()
		ctx = context.WithValue(ctx, "user_id", userID)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

// sendUnauthorized sends an unauthorized response
func sendUnauthorized(w http.ResponseWriter, message string) {
	w.WriteHeader(http.StatusUnauthorized)
	response := models.Response{
		Success: false,
		Message: "Unauthorized",
		Error:   message,
	}
	json.NewEncoder(w).Encode(response)
}


