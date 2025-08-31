package auth

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwks"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
)

// JWKSClient holds the JWKS client for JWT verification
var JWKSClient *jwks.Client

// InitializeJWKS initializes the JWKS client
func InitializeJWKS() error {
	// Create a default client config
	config := &clerk.ClientConfig{}
	
	// If we have a Clerk secret key, set it
	if secretKey := os.Getenv("CLERK_SECRET_KEY"); secretKey != "" {
		clerk.SetKey(secretKey)
		log.Println("✅ Clerk secret key configured")
	} else {
		log.Println("⚠️  No Clerk secret key found, using default configuration")
	}
	
	JWKSClient = jwks.NewClient(config)
	
	//log.Printf("✅ JWKS client initialized successfully with config: %+v", config)
	//log.Printf("✅ JWKS client instance: %+v", JWKSClient)
	return nil
}

// GetJWKSClient returns the JWKS client
func GetJWKSClient() *jwks.Client {
	return JWKSClient
}

// ExtractUserIDFromToken extracts the user ID from a JWT token
func ExtractUserIDFromToken(tokenString string) (string, error) {
	log.Printf("🔍 Attempting to verify JWT token with length: %d", len(tokenString))
	
	// First, let's try to decode the JWT without verification to see what's in it
	// This will help us debug the token structure
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return "", fmt.Errorf("invalid JWT format: expected 3 parts, got %d", len(parts))
	}
	
	// Try to decode the payload (second part) to see the claims
	payload := parts[1]
	// Add padding if needed
	if len(payload)%4 != 0 {
		payload += strings.Repeat("=", 4-len(payload)%4)
	}
	
	log.Printf("🔍 JWT payload (base64): %s", payload[:5]) // print the first 5 charaters of the payload
	
	// Parse and verify the JWT token using Clerk SDK v2
	claims, err := jwt.Verify(context.Background(), &jwt.VerifyParams{
		Token:      tokenString,
		JWKSClient: JWKSClient,
	})
	if err != nil {
		log.Printf("❌ JWT verification failed: %v", err)
		return "", fmt.Errorf("failed to parse JWT token: %v", err)
	}

	// Get the user ID from the sub claim
	userID := claims.Subject
	if userID == "" {
		log.Printf("❌ No user ID found in JWT claims")
		return "", fmt.Errorf("user ID not found in token")
	}

	log.Printf("✅ Successfully extracted user ID: %s", userID[:5], userID[len(userID)-5:])
	return userID, nil
}

// ExtractTokenFromRequest extracts the JWT token from the request
func ExtractTokenFromRequest(r *http.Request) (string, error) {
	// First try __session cookie (Clerk's primary cookie)
	cookie, err := r.Cookie("__session")
	if err == nil && cookie.Value != "" {
		log.Printf("🔐 Found __session cookie with length: %d", len(cookie.Value))
		return cookie.Value, nil
	}

	// Try jwt cookie as fallback
	cookie, err = r.Cookie("jwt")
	if err == nil && cookie.Value != "" {
		log.Printf("🔐 Found jwt cookie with length: %d", len(cookie.Value))
		return cookie.Value, nil
	}

	// Try Authorization header as fallback
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		// Extract token from "Bearer <token>" format
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			log.Printf("🔐 Found Authorization header with token length: %d", len(parts[1]))
			return parts[1], nil
		}
	}

	// Log all available cookies for debugging
	log.Printf("🔍 Available cookies: %v", r.Cookies())
	log.Printf("🔍 Authorization header: %s", authHeader)

	return "", fmt.Errorf("no valid authentication token found in cookies or headers")
}

// ValidateToken validates a JWT token and returns the user ID
func ValidateToken(tokenString string) (string, error) {
	// Basic validation - check if token has JWT format (3 parts)
	if tokenString == "" || len(strings.Split(tokenString, ".")) != 3 {
		return "", fmt.Errorf("invalid token format")
	}

	// Extract user ID from token
	userID, err := ExtractUserIDFromToken(tokenString)
	if err != nil {
		return "", err
	}

	// Basic validation that user ID exists and is not empty
	if userID == "" {
		return "", fmt.Errorf("user ID is empty in token")
	}

	// Log successful token validation for debugging
	log.Printf("✅ Token validated successfully for user: %s", userID)
	log.Printf("✅ Token validated successfully for user: %s", userID[:5], userID[len(userID)-5:])

	return userID, nil
}

// GetUserIDFromContext extracts user ID from the request context
func GetUserIDFromContext(r *http.Request) (string, error) {
	token, err := ExtractTokenFromRequest(r)
	if err != nil {
		return "", err
	}

	return ValidateToken(token)
}
