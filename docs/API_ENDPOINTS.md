# API Endpoints Documentation

## Overview

This document describes the REST API endpoints for the Snippy application. The API is organized around user-owned resources with proper authentication and authorization.

## Base URL

```
http://localhost:8080/api
```

## Authentication

All endpoints (except `api/snippets/public`) require authentication. Include the user session cookie in requests.

## Database Schema

### Core Tables

- **`collections`**: User-owned collections with name, color, and metadata
- **`snippets`**: Code snippets with content, tags, and metadata
- **`collection_snippet_positions`**: Position management for snippets within collections
- **`collection_positions`**: Position management for collections within user's view

### Position Management Tables

#### `collection_snippet_positions`
Stores snippet positions within each collection for drag-and-drop ordering.

```sql
CREATE TABLE collection_snippet_positions (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  snippet_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(collection_id, snippet_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);
```

#### `collection_positions`
Stores collection positions for each user's view ordering.

```sql
CREATE TABLE collection_positions (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(collection_id, user_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);
```

## Collections Endpoints

### GET /api/collections
Get all collections for the authenticated user, ordered by position.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "My Collection",
      "color": "#3b82f6",
      "user_id": "user-uuid",
      "snippet_count": 5,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/collections/create
Create a new collection.

**Request Body:**
```json
{
  "name": "New Collection",
  "color": "#ef4444"
}
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "name": "New Collection",
    "color": "#ef4444",
    "user_id": "user-uuid",
    "snippet_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/collections/{id}
Get a specific collection by ID.

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "My Collection",
    "color": "#3b82f6",
    "user_id": "user-uuid",
    "snippet_count": 5,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/collections/{id}
Update a collection.

**Request Body:**
```json
{
  "name": "Updated Collection Name",
  "color": "#10b981"
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Updated Collection Name",
    "color": "#10b981",
    "user_id": "user-uuid",
    "snippet_count": 5,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/collections/{id}
Delete a collection and all its snippet associations.

**Response:**
```json
{
  "message": "Collection deleted successfully"
}
```

### GET /api/collections/{id}/snippets
Get all snippets belonging to a specific collection, ordered by position.

**Response:**
```json
{
  "data": {
    "collection": {
      "id": 1,
      "name": "My Collection",
      "color": "#3b82f6",
      "user_id": "user-uuid",
      "snippet_count": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "snippets": [
      {
        "id": 1,
        "title": "My Snippet",
        "content": "console.log('Hello World');",
        "is_favorite": false,
        "tags": ["javascript", "console"],
        "position": 0,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## Position Management Endpoints

### PUT /api/collections/positions
Update collection positions for the authenticated user.

**Request Body:**
```json
{
  "positions": [
    {
      "id": 1,
      "position": 0
    },
    {
      "id": 2,
      "position": 1
    }
  ]
}
```

**Response:**
```json
{
  "message": "Collection positions updated successfully"
}
```

### PUT /api/collections/{id}/snippets/positions
Update snippet positions within a specific collection.

**Request Body:**
```json
{
  "positions": [
    {
      "id": 1,
      "position": 0
    },
    {
      "id": 2,
      "position": 1
    }
  ]
}
```

**Response:**
```json
{
  "message": "Snippet positions updated successfully"
}
```

## Snippets Endpoints

### GET /api/snippets
Get all snippets for the authenticated user.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "My Snippet",
      "content": "console.log('Hello World');",
      "is_favorite": false,
      "tags": ["javascript", "console"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/snippets/public
Get public snippets (no authentication required).

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Public Snippet",
      "content": "console.log('Hello World');",
      "tags": ["javascript", "console"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

Error responses include a message describing the issue:

```json
{
  "error": "Error message here"
}
```

## Virtual Favorites Collection

The frontend implements a virtual "Favorites" collection that:

- Is dynamically generated from favorited snippets
- Always appears first in the collections list
- Cannot be edited or deleted
- Has a special heart icon and styling
- Is excluded from position management updates

## Position Management Notes

- Positions are zero-indexed integers
- Lower numbers appear first in the UI
- Position updates are handled in bulk for better performance
- The virtual favorites collection is excluded from position updates
- Position changes are optimistic in the UI with rollback on error
