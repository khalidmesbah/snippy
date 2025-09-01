# API Reference

## Base URL
```
http://localhost:8080/api
```

## Authentication

All protected endpoints require a valid `__session` cookie from Clerk authentication. Public endpoints are marked explicitly.

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error message describing the issue"
}
```

## HTTP Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Internal Server Error

## Public Endpoints

### Health Check
```http
GET /health
```
Returns server health status and database connectivity.

### Debug Information
```http
GET /debug
```
Returns request debugging information (headers, cookies, etc.).

### Public Snippets
```http
GET /api/snippets/public?search=javascript&limit=10&offset=0&shuffle=false
```

**Query Parameters:**
- `search` (optional) - Search in title and content
- `limit` (optional) - Number of results (default: 50, max: 100)
- `offset` (optional) - Pagination offset (default: 0)
- `shuffle` (optional) - Randomize results (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "user_123",
      "title": "Array Shuffle Function",
      "content": "function shuffleArray(array) { ... }",
      "tags": ["javascript", "utility"],
      "is_public": true,
      "fork_count": 15,
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

## Collections Endpoints

### Get Collections
```http
GET /api/collections
```
Returns all collections for the authenticated user, ordered by position.

### Create Collection
```http
POST /api/collections/create
Content-Type: application/json

{
  "name": "JavaScript Utils",
  "color": "#3b82f6"
}
```

### Get Collection by ID
```http
GET /api/collections/{id}
```

### Update Collection
```http
PUT /api/collections/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "color": "#ef4444"
}
```

### Delete Collection
```http
DELETE /api/collections/{id}
```

### Get Collection Snippets
```http
GET /api/collections/{id}/snippets
```
Returns collection details and all snippets within it, ordered by position.

## Position Management

### Update Collection Positions
```http
PUT /api/collections/positions
Content-Type: application/json

{
  "positions": [
    { "id": 1, "position": 0 },
    { "id": 2, "position": 1 }
  ]
}
```

### Update Snippet Positions
```http
PUT /api/collections/{id}/snippets/positions
Content-Type: application/json

{
  "positions": [
    { "id": 1, "position": 0 },
    { "id": 2, "position": 1 }
  ]
}
```

## Snippets Endpoints

### Get Snippets
```http
GET /api/snippets?collection_id=uuid&search=function&limit=20&offset=0
```

**Query Parameters:**
- `collection_id` (optional) - Filter by collection
- `search` (optional) - Search in title and content
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

### Create Snippet
```http
POST /api/snippets/create
Content-Type: application/json

{
  "collection_id": "uuid",
  "title": "Array Shuffle",
  "content": "function shuffleArray(array) { ... }",
  "tags": ["javascript", "array"],
  "is_public": true,
  "is_favorite": false
}
```

### Get Snippet by ID
```http
GET /api/snippets/{id}
```

### Update Snippet
```http
PUT /api/snippets/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "tags": ["javascript", "updated"],
  "is_public": false
}
```

### Delete Snippet
```http
DELETE /api/snippets/{id}
```

### Fork Snippet
```http
POST /api/snippets/fork
Content-Type: application/json

{
  "snippet_id": "uuid",
  "collection_id": "uuid"
}
```

## Database Schema

### Collections Table
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, name)
);
```

### Snippets Table
```sql
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  collection_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  fork_count INT DEFAULT 0,
  forked_from UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (collection_id) REFERENCES collections(id)
);
```

### Position Management Tables
```sql
CREATE TABLE collection_snippet_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL,
  snippet_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(collection_id, snippet_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);

CREATE TABLE collection_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(collection_id, user_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);
```

## Virtual Favorites Collection

The frontend implements a virtual "Favorites" collection that:
- Dynamically generates from `is_favorite: true` snippets
- Always appears first in collections list
- Cannot be edited or deleted
- Excluded from position management
- Has special heart icon styling
