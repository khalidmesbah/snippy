# Snippy Server 🚀

A modern, feature-rich code snippets management platform built with Go, designed for developers who want to organize, share, and discover code snippets with ease.

## ✨ Features

- **🔐 Secure Authentication**: JWT-based authentication using Clerk
- **📝 Code Snippets Management**: Create, read, update, and delete code snippets
- **📚 Collections**: Organize snippets into custom collections by topic
- **🌍 Public Sharing**: Make snippets public for community discovery
- **🔄 Fork System**: Fork useful snippets to your own collection
- **🔍 Advanced Search**: Search through snippet content and metadata
- **📱 RESTful API**: Clean, well-documented API endpoints

## 🏗️ Project Structure

```
server/
├── cmd/                           # Main applications
│   └── api/                      # API server entry point
│       └── main.go              # Main server application
├── internal/                      # Private application code
│   ├── api/                      # HTTP API layer
│   │   ├── handlers/            # HTTP request handlers
│   │   │   ├── collections.go   # Collection CRUD operations
│   │   │   ├── snippets.go      # Snippet CRUD operations
│   │   │   ├── public.go        # Public endpoints
│   │   │   ├── debug.go         # Debug endpoint
│   │   │   └── utils.go         # Handler utility functions
│   │   ├── middleware/          # HTTP middleware
│   │   │   └── middleware.go    # CORS, logging, auth middleware
│   │   └── routes.go            # Route definitions and setup
│   ├── auth/                     # Authentication logic
│   │   └── auth.go              # JWT verification and user auth
│   ├── config/                   # Configuration management
│   │   └── config.go            # Environment variable handling
│   ├── database/                 # Database operations
│   │   ├── connection.go        # Database connection management
│   │   └── seed.go              # Database seeding functionality
│   └── models/                   # Data models and structs
│       └── models.go            # Collection, Snippet, and request models
├── migrations/                    # Database migration files
│   ├── 000001_create_initial_schema.up.sql
│   ├── 000001_create_initial_schema.down.sql
│   ├── 000002_seed_initial_data.up.sql
│   ├── 000002_seed_initial_data.down.sql
│   └── README.md                # Migration documentation
├── scripts/                      # Utility scripts
│   ├── migrate.sh               # Migration script
│   └── setup.sh                 # Database setup script
├── go.mod                        # Go module definition
├── go.sum                        # Go module checksums
├── env.example                   # Environment variables template
├── Makefile                      # Build and development commands
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- Go 1.23.1 or higher
- PostgreSQL database (or Neon cloud database)
- Clerk account for authentication

### 1. Clone and Setup

```bash
git clone <your-repo>
cd snippy/server
```

### 2. Environment Configuration

Copy the environment template and configure your variables:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```bash
# Clerk Authentication (REQUIRED)
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Server Configuration
PORT=8080
```

### 3. Setup Database

```bash
# Setup database with migrations and seed data
./scripts/setup.sh

# Or use make command
make setup-db
```

### 4. Start the Server

```bash
# Start API server
go run ./cmd/api/main.go

# Or use make command
make run
```

## 🗄️ Database Management

### Migrations

The application uses `golang-migrate` for database migrations. All migrations are stored in the `migrations/` directory.

#### Running Migrations

```bash
# Run all pending migrations
./scripts/migrate.sh up

# Check current migration version
./scripts/migrate.sh version

# Force migration to specific version
./scripts/migrate.sh force 2

# Create new migration
./scripts/migrate.sh create add_new_feature
```

#### Using Make Commands

```bash
# Run migrations up
make migrate-up

# Check migration version
make migrate-version

# Force migration to specific version
make migrate-force version=2
```



For more detailed information about migrations, see [migrations/README.md](migrations/README.md).

## 📚 API Endpoints

### Authentication

All protected endpoints require a valid `__session` cookie from Clerk authentication.

### Public Endpoints (No Auth Required)

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": 1756320000
  }
}
```

#### Debug Information
```http
GET /debug
```

**Response:**
```json
{
  "success": true,
  "message": "Debug information retrieved",
  "data": {
    "method": "GET",
    "url": "/debug",
    "cookies": {
      "__session": "eyJ...",
      "jwt": "eyJ..."
    },
    "headers": {
      "User-Agent": "Mozilla/5.0...",
      "Accept": "application/json"
    }
  }
}
```

#### Public Snippets
```http
GET /api/public/snippets?search=javascript&limit=10&offset=0&shuffle=false
```

**Query Parameters:**
- `search` (optional): Search in title and content
- `limit` (optional): Number of snippets to return (default: 50)
- `offset` (optional): Number of snippets to skip (default: 0)
- `shuffle` (optional): Randomize results (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Public snippets retrieved successfully",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "user_123",
      "title": "Debounce Function",
      "content": "function debounce(func, wait) { ... }",
      "tags": ["javascript", "utility", "performance"],
      "is_public": true,
      "fork_count": 15,
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

#### Public Snippet by ID
```http
GET /api/public/snippets/{id}
```

### Protected Endpoints (Auth Required)

#### Collections

**Create Collection**
```http
POST /api/collections
Content-Type: application/json

{
  "name": "JavaScript Utils",
  "color": "#3b82f6"
}
```

**Get Collections**
```http
GET /api/collections
```

**Update Collection**
```http
PUT /api/collections/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "color": "#ef4444"
}
```

**Delete Collection**
```http
DELETE /api/collections/{id}
```

#### Snippets

**Create Snippet**
```http
POST /api/snippets
Content-Type: application/json

{
  "collection_id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Array Shuffle",
  "content": "function shuffleArray(array) { ... }",
  "tags": ["javascript", "array", "utility"],
  "is_public": true,
  "is_favorite": false
}
```

**Get Snippets**
```http
GET /api/snippets?collection_id=550e8400-e29b-41d4-a716-446655440001&search=shuffle&limit=20&offset=0
```

**Query Parameters:**
- `collection_id` (optional): Filter by collection
- `search` (optional): Search in title and content
- `limit` (optional): Number of snippets to return (default: 50)
- `offset` (optional): Number of snippets to skip (default: 0)

**Get Snippet by ID**
```http
GET /api/snippets/{id}
```

**Update Snippet**
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

**Delete Snippet**
```http
DELETE /api/snippets/{id}
```

**Fork Snippet**
```http
POST /api/snippets/{id}/fork
```

## 🔧 Development

### Project Organization

- **`cmd/`**: Main application entry points
- **`internal/`**: Private application code (not importable from outside)
- **`scripts/`**: Utility scripts for development and deployment
- **`configs/`**: Configuration files

### Adding New Features

#### 1. New API Endpoint
```bash
# 1. Add handler in internal/api/handlers/
# 2. Update routes in internal/api/routes.go
# 3. Add models if needed in internal/models/
```

#### 2. New Middleware
```bash
# 1. Create middleware in internal/api/middleware/
# 2. Apply in internal/api/routes.go
```

#### 3. Database Changes
```bash
# 1. Update schema.sql
# 2. Create migration files in internal/database/migrations/
# 3. Update models in internal/models/
```

### Testing

```bash
# Test all packages
go test ./...

# Test specific package
go test ./internal/api/handlers

# Test with coverage
go test -cover ./...
```

### Building

```bash
# Build API server
go build ./cmd/api

# Build seed tool
go build ./cmd/seed

# Using Makefile
make build
```

## 🌐 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 8080 | No |
| `DATABASE_URL` | Database connection string | - | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key for JWT verification | - | Yes |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | - | No |
| `JWKS_URL` | Clerk JWKS URL | https://api.clerk.com/v1/jwks | No |

## 📊 Database Schema

### Collections Table
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Snippets Table
```sql
CREATE TABLE snippets (
  id UUID PRIMARY KEY,
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
  updated_at TIMESTAMP DEFAULT now()
);
```

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o main ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]
```

### Environment Setup
```bash
# Production environment variables
export DATABASE_URL="postgresql://user:password@host:port/database"
export CLERK_SECRET_KEY="sk_live_..."
export PORT=8080
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check this README and code comments
- **API**: Use the debug endpoint `/debug` to inspect requests

---

**Built with ❤️ for the developer community**

_Snippy makes code snippet management simple, powerful, and social._
