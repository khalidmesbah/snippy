# Snippy

A modern, feature-rich platform to create, organize, discover, and share code snippets. This monorepo contains a React client and a Go server with a REST API.

## Repository Structure

```
client/   # React (Vite + TypeScript + TanStack Router) UI
server/   # Go HTTP API, auth, database, migrations, scripts
docs/     # Project documentation (moved from scattered .md files)
README.md # This file
```

## Features

- **Snippet management**: Create, read, update, delete, and search snippets
- **Collections**: Organize snippets into customizable collections
- **Tags**: Classify snippets with user-owned tags
- **Privacy**: Keep snippets private or make them public
- **Explore**: Browse public snippets from the community
- **Forking**: Copy public snippets into your own library
- **Auth**: Clerk-based authentication (session cookie)

## Prerequisites

- Node.js and pnpm
- Go 1.23+
- PostgreSQL (local or hosted)
- Clerk account (publishable + secret keys)

## Quick Start

### 1) Server setup

```
cd server
cp env.example .env
```

Set env vars in `.env`:

```
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
DATABASE_URL=postgresql://user:password@host:port/db
PORT=8080
```

Run migrations and start:

```
./scripts/setup.sh     # or: make setup-db
go run ./cmd/api/main.go  # or: make run
```

### 2) Client setup

```
cd client
pnpm install
```

Create `.env.local` with:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8080
```

Start the client:

```
pnpm start
```

## API Endpoints

Base URL: `http://localhost:8080`

- Public (no auth)
  - `GET /health`
  - `GET /debug`
  - `GET /api/snippets/public`
  - `GET /api/snippets/public/user`

- Protected (Clerk session cookie required)
  - Collections
    - `GET /api/collections`
    - `POST /api/collections/create`
    - `PUT /api/collections/{id}`
    - `DELETE /api/collections/{id}`
  - Snippets
    - `GET /api/snippets`
    - `GET /api/snippets/{id}`
    - `POST /api/snippets/create`
    - `PUT /api/snippets/{id}`
    - `DELETE /api/snippets/{id}`
    - `POST /api/snippets/fork`
  - Tags
    - `GET /api/tags`
    - `POST /api/tags/create`
    - `PUT /api/tags/{id}`
    - `DELETE /api/tags/{id}`

Example (create snippet):

```bash
curl -X POST http://localhost:8080/api/snippets/create \
  -H 'Content-Type: application/json' \
  --cookie "__session=your_clerk_session" \
  -d '{
    "collection_id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Array Shuffle",
    "content": "function shuffleArray(array) { ... }",
    "tags": ["javascript", "array"],
    "is_public": true
  }'
```

## Development

- Server
  - `make run`, `make build`, `make migrate-up`, `go test ./...`
- Client
  - `pnpm start`, `pnpm build`, `pnpm test`, `pnpm lint`

## Documentation

All project docs are consolidated under `docs/`. Notable files include:

- `docs/server_README.md` – server details
- `docs/migrations_README.md` – database migrations
- `docs/API_ENDPOINTS.md` – additional API notes

## Contributing

Issues and PRs are welcome. Please include tests where applicable.

---

Built with ❤️ for the developer community.
