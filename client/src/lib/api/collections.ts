import { showNotification } from "@/lib/notifications";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface PositionUpdate {
  id: string;
  position: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Update collection positions
 */
export const updateCollectionPositions = async (positions: PositionUpdate[]): Promise<ApiResponse<void>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections/positions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ positions }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showNotification.success("Collection positions updated successfully");
    return data;
  } catch (error) {
    showNotification.error("Failed to update collection positions", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

/**
 * Update snippet positions within a collection
 */
export const updateCollectionSnippetPositions = async (
  collectionId: string, 
  positions: PositionUpdate[]
): Promise<ApiResponse<void>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/snippets/positions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ positions }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showNotification.success("Snippet positions updated successfully");
    return data;
  } catch (error) {
    showNotification.error("Failed to update snippet positions", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

/**
 * Get collections with positions
 */
export const getCollections = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    showNotification.error("Failed to fetch collections", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

/**
 * Get collection with snippets and positions
 */
export const getCollectionWithSnippets = async (collectionId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/snippets`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    showNotification.error("Failed to fetch collection with snippets", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

/**
 * Create a new collection
 */
export const createCollection = async (data: { name: string; color: string }): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    showNotification.success("Collection created successfully");
    return responseData;
  } catch (error) {
    showNotification.error("Failed to create collection", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

/**
 * Update a collection
 */
export const updateCollection = async (
  collectionId: string, 
  updates: { name?: string; color?: string }
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showNotification.success("Collection updated successfully");
    return data;
  } catch (error) {
    showNotification.error("Failed to update collection", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

/**
 * Delete a collection
 */
export const deleteCollection = async (collectionId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showNotification.success("Collection deleted successfully");
    return data;
  } catch (error) {
    showNotification.error("Failed to delete collection", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};
