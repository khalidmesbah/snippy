# Architecture Overview

## System Architecture

Snippy is a full-stack application built with modern technologies for performance, scalability, and developer experience.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│   Go API Server │────│   PostgreSQL    │
│   (Port 3000)   │    │   (Port 8080)   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐            ┌──────────┐           ┌─────────────┐
    │  Clerk  │            │   CORS   │           │ Migrations  │
    │  Auth   │            │Middleware│           │   System    │
    └─────────┘            └──────────┘           └─────────────┘
```

## Frontend Stack

### Core Technologies
- **React 19.1.1** - Modern UI library with concurrent features
- **TypeScript 5.9.2** - Type-safe development
- **Vite 7.1.3** - Fast build tool and dev server
- **TanStack Router 1.131.27** - Type-safe file-based routing
- **TanStack Query 5.85.5** - Data fetching and caching

### UI & Styling
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI primitives
- **shadcn/ui** - Pre-built component library
- **Lucide React** - Icon library
- **CodeMirror 6.x** - Code editor with syntax highlighting

### Development Tools
- **Biome 2.2.2** - Fast linting and formatting
- **Vitest 3.2.4** - Unit testing framework
- **pnpm** - Package manager

## Backend Stack

### Core Technologies
- **Go 1.23.1** - High-performance backend language
- **Gorilla Mux 1.8.1** - HTTP router and URL matcher
- **PostgreSQL** - Relational database with JSONB support
- **Clerk SDK v2.3.1** - Authentication and user management

### Project Structure
```
server/
├── cmd/                    # Application entry points
│   └── api/               # Main API server
├── internal/              # Private application code
│   ├── api/              # HTTP layer
│   │   ├── handlers/     # Request handlers
│   │   ├── middleware/   # HTTP middleware
│   │   └── routes.go     # Route definitions
│   ├── auth/             # Authentication logic
│   ├── config/           # Configuration management
│   ├── database/         # Database operations
│   └── models/           # Data models
├── migrations/           # Database migrations
└── scripts/             # Utility scripts
```

## Database Design

### Core Tables
- **`collections`** - User-owned snippet collections
- **`snippets`** - Code snippets with metadata
- **`collection_snippet_positions`** - Drag-and-drop ordering
- **`collection_positions`** - Collection ordering per user

### Key Features
- **UUID Primary Keys** - Distributed-friendly identifiers
- **User Isolation** - All data scoped to user_id
- **Position Management** - Flexible ordering system
- **JSONB Arrays** - Efficient tag storage
- **Timestamps** - Automatic created_at/updated_at

## Authentication Flow

1. **Client** - Clerk React components handle UI
2. **Session Cookie** - `__session` cookie sent with requests
3. **JWT Verification** - Go server validates with Clerk JWKS
4. **User Context** - Extracted user_id used for data isolation

## API Design

### Principles
- **RESTful** - Standard HTTP methods and status codes
- **JSON** - Consistent request/response format
- **User-Scoped** - All endpoints filter by authenticated user
- **Error Handling** - Structured error responses

### Endpoint Categories
- **Public** - `/api/snippets/public` (no auth required)
- **Collections** - `/api/collections/*` (CRUD operations)
- **Snippets** - `/api/snippets/*` (CRUD + search)
- **Positions** - Drag-and-drop ordering endpoints

## Development Workflow

### Hot Reload
- **Frontend** - Vite HMR for instant updates
- **Backend** - Manual restart (consider air for auto-reload)

### Code Quality
- **TypeScript** - Compile-time type checking
- **Biome** - Consistent formatting and linting
- **Go Modules** - Dependency management
- **Testing** - Vitest for frontend, Go testing for backend

### Database Management
- **Migrations** - Version-controlled schema changes
- **Seeding** - Consistent test data setup
- **Connection Pooling** - Efficient database connections
