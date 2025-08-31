import { useAuth } from "@clerk/clerk-react";
import React from "react";
import { showNotification } from "@/lib/notifications";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Global function to get token (can be called from anywhere)
let getTokenFunction: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  getTokenFunction = getter;
}

// Create a custom hook for authenticated API calls
export function useApiClient() {
  const { getToken } = useAuth();
  
  // Set the global token getter when this hook is used
  React.useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  const apiCall = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    try {
      // Get the JWT token from Clerk
      const token = await getToken();
      
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      const defaultOptions: RequestInit = {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      return await fetch(url, defaultOptions);
    } catch (error) {
      showNotification.error("API call failed", error instanceof Error ? error.message : "An error occurred");
      throw error;
    }
  };

  return { apiCall };
}

// Standalone API client that can be used outside of React components
export const apiClient = {
  async get(endpoint: string) {
    const token = getTokenFunction ? await getTokenFunction() : null;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    return fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  },

  async post(endpoint: string, data?: any) {
    const token = getTokenFunction ? await getTokenFunction() : null;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    return fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put(endpoint: string, data?: any) {
    const token = getTokenFunction ? await getTokenFunction() : null;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    return fetch(url, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete(endpoint: string) {
    const token = getTokenFunction ? await getTokenFunction() : null;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    return fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  },
};
