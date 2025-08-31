/*
Snippy Code Snippet Manager - Backend API Server with Clerk Authentication

This is a REST API server for managing code snippets and collections.
Built with Go, it provides endpoints for creating, reading, updating, and deleting
code snippets organized in collections. All endpoints require Clerk authentication.
*/
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"snippy-server/internal/api"
	"snippy-server/internal/auth"
	"snippy-server/internal/config"
	"snippy-server/internal/database"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database connection
	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Initialize JWKS client for JWT verification
	if err := auth.InitializeJWKS(); err != nil {
		log.Fatalf("Failed to initialize JWKS client: %v", err)
	}

	// Setup routes
	router := api.SetupRoutes()

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Starting Snippy API server on port %s", cfg.Server.Port)
		log.Printf("📚 API endpoints available at http://localhost:%s/api", cfg.Server.Port)
		log.Printf("🏥 Health check available at http://localhost:%s/health", cfg.Server.Port)
		
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// Create a deadline for server shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited gracefully")
}
