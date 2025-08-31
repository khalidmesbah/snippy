package handlers

import (
	"encoding/json"
	"net/http"
	"snippy-server/internal/models"
)

// sendJSON sends a JSON response with the specified status code
func sendJSON(w http.ResponseWriter, status int, response models.Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

// sendError sends an error response with the specified status code
func sendError(w http.ResponseWriter, status int, message string) {
	response := models.Response{
		Success: false,
		Message: "Error",
		Error:   message,
	}
	sendJSON(w, status, response)
}
