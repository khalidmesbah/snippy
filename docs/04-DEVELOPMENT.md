# Development Guide

## Database Management

### Migrations

The application uses `golang-migrate` for database schema management. All migrations are in `server/migrations/`.

#### Running Migrations
```bash
# Setup database with migrations and seed data
./scripts/setup.sh
make setup-db

# Run pending migrations
./scripts/migrate.sh up
make migrate-up

# Check current version
./scripts/migrate.sh version
make migrate-version

# Rollback last migration
./scripts/migrate.sh down 1
make migrate-down

# Force to specific version (if dirty)
./scripts/migrate.sh force 2
make migrate-force version=2
```

#### Creating New Migrations
```bash
# Create new migration files
./scripts/migrate.sh create add_new_feature
make migrate-create name=add_new_feature

# This creates:
# - XXXXXX_add_new_feature.up.sql
# - XXXXXX_add_new_feature.down.sql
```

#### Migration Best Practices
- Always create both up and down migrations
- Use descriptive names for migrations
- Test in development environment first
- Use transactions for complex changes
- Include proper indexes and constraints
- Document complex migrations with comments

### Environment Variables

#### Server (.env)
```bash
# Required
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
PORT=8080
CLERK_PUBLISHABLE_KEY=pk_test_...
JWKS_URL=https://api.clerk.com/v1/jwks
```

#### Client (.env.local)
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8080
```

## Development Workflow

### Frontend Development
```bash
cd client

# Install dependencies
pnpm install

# Development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm serve

# Testing
pnpm test

# Code quality
pnpm lint        # Check linting
pnpm lint:fix    # Fix linting issues
pnpm format      # Format code
pnpm check       # Check everything
pnpm check:fix   # Fix everything
```

### Backend Development
```bash
cd server

# Install dependencies
go mod download
go mod tidy

# Run API server
go run ./cmd/api/main.go
make run

# Build binary
go build ./cmd/api
make build

# Run tests
go test ./...
go test -cover ./...

# Test specific package
go test ./internal/api/handlers
```

### Adding New Features

#### 1. New API Endpoint
1. Add handler in `internal/api/handlers/`
2. Update routes in `internal/api/routes.go`
3. Add models if needed in `internal/models/`
4. Update API documentation

#### 2. New Frontend Route
1. Create file in `src/routes/` (TanStack Router auto-generates)
2. Add navigation links using `<Link>` component
3. Update route types if needed

#### 3. Database Changes
1. Create migration files in `migrations/`
2. Update models in `internal/models/`
3. Update API handlers if needed
4. Update documentation

## Code Quality Tools

### Frontend (Biome)
- **Linting** - Fast JavaScript/TypeScript linting
- **Formatting** - Consistent code style
- **Import Sorting** - Organized imports

Configuration in `biome.json`:
```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

### Backend (Go)
- **go fmt** - Standard Go formatting
- **go vet** - Static analysis
- **golangci-lint** - Comprehensive linting (optional)

## Testing

### Frontend Testing (Vitest)
```bash
# Run all tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage report
pnpm test --coverage
```

Test files: `*.test.ts`, `*.test.tsx`

### Backend Testing (Go)
```bash
# Run all tests
go test ./...

# Verbose output
go test -v ./...

# Coverage
go test -cover ./...

# Specific package
go test ./internal/api/handlers
```

Test files: `*_test.go`

## Debugging

### Frontend Debugging
- **Browser DevTools** - Standard debugging
- **TanStack Query Devtools** - Query state inspection
- **TanStack Router Devtools** - Route debugging
- **React DevTools** - Component inspection

### Backend Debugging
- **Go Debugger (delve)** - Step-through debugging
- **Logging** - Structured logging with context
- **Database Logs** - PostgreSQL query logging
- **API Testing** - Postman, curl, or HTTP files

### Debug Endpoint
```http
GET /debug
```
Returns request information for debugging authentication and headers.

## Performance

### Frontend Optimization
- **Code Splitting** - Automatic route-based splitting
- **Tree Shaking** - Dead code elimination via Vite
- **Hot Module Replacement** - Instant updates during development
- **Web Vitals** - Performance metrics collection

### Backend Optimization
- **Connection Pooling** - Efficient database connections
- **Query Optimization** - Proper indexing and query structure
- **Go Profiling** - Built-in performance profiling tools

## Deployment

### Build Process
```bash
# Frontend
cd client && pnpm build

# Backend
cd server && go build ./cmd/api
```

### Environment Setup
```bash
# Production environment variables
export DATABASE_URL="postgresql://user:password@host:port/database"
export CLERK_SECRET_KEY="sk_live_..."
export PORT=8080
```

### Docker (Optional)
```dockerfile
# Multi-stage build example
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY server/ .
RUN go mod download && go build -o main ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]
```
