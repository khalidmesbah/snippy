package handlers

import (
	"net/http"
	"snippy-server/internal/models"
)

// DebugAuth is a debug endpoint to see what authentication data is being received
func DebugAuth(w http.ResponseWriter, r *http.Request) {
	// Get all cookies
	cookies := r.Cookies()
	cookieData := make(map[string]string)
	for _, cookie := range cookies {
		cookieData[cookie.Name] = cookie.Value
	}

	// Get all headers
	headers := make(map[string]string)
	for name, values := range r.Header {
		if len(values) > 0 {
			headers[name] = values[0]
		}
	}

	// Get query parameters
	queryParams := make(map[string]string)
	for name, values := range r.URL.Query() {
		if len(values) > 0 {
			queryParams[name] = values[0]
		}
	}

	debugInfo := map[string]interface{}{
		"method":      r.Method,
		"url":         r.URL.String(),
		"cookies":     cookieData,
		"headers":     headers,
		"queryParams": queryParams,
		"remoteAddr":  r.RemoteAddr,
		"userAgent":   r.UserAgent(),
	}

	response := models.Response{
		Success: true,
		Message: "Debug information retrieved",
		Data:    debugInfo,
	}

	sendJSON(w, http.StatusOK, response)
}
