# Getting Started with Snippy

A modern, feature-rich platform to create, organize, discover, and share code snippets.

## Prerequisites

- **Node.js** and **pnpm** (for client)
- **Go 1.23+** (for server)
- **PostgreSQL** (local or hosted like Neon)
- **Clerk account** (for authentication)

## Quick Setup

### 1. Clone Repository
```bash
git clone <your-repo>
cd snippy
```

### 2. Server Setup

```bash
cd server
cp env.example .env
```

Configure your `.env` file:
```bash
# Clerk Authentication (REQUIRED)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Server Configuration
PORT=8080
```

Setup database and start server:
```bash
./scripts/setup.sh     # Setup database with migrations
go run ./cmd/api/main.go  # Start server on port 8080
```

### 3. Client Setup

```bash
cd client
pnpm install
```

Create `.env.local`:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8080
```

Start the client:
```bash
pnpm dev  # Development server on port 3000
```

## Development Commands

### Server
- `make run` - Start API server
- `make build` - Build server binary
- `make setup-db` - Setup database with migrations
- `make migrate-up` - Run pending migrations
- `go test ./...` - Run tests

### Client
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint` - Lint code
- `pnpm format` - Format code

## Verification

1. **Server**: Visit `http://localhost:8080/health`
2. **Client**: Visit `http://localhost:3000`
3. **Authentication**: Sign up/login via Clerk

## Next Steps

- Read [Architecture Overview](02-ARCHITECTURE.md)
- Check [API Documentation](03-API-REFERENCE.md)
- Review [Development Guide](04-DEVELOPMENT.md)
