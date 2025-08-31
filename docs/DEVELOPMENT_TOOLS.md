# Snippy Development Tools & Environment 🛠️

This document outlines all the tools, CLIs, editors, and technologies used in the development of Snippy - the modern code snippets management platform.

## 🎯 Core Technologies

### Frontend Stack
- **React 19.1.1** - Modern UI library with hooks and concurrent features
- **TypeScript 5.9.2** - Type-safe JavaScript development
- **Vite 7.1.3** - Fast build tool and dev server
- **TanStack Router 1.131.27** - Type-safe routing for React
- **TanStack Query 5.85.5** - Data fetching and state management
- **Tailwind CSS 4.1.12** - Utility-first CSS framework

### Backend Stack
- **Go 1.23.1** - High-performance backend language
- **Gorilla Mux 1.8.1** - HTTP router and URL matcher
- **PostgreSQL** - Relational database (via lib/pq driver)
- **Clerk SDK v2.3.1** - Authentication and user management

## 🔧 Development Tools

### Build & Package Management
- **Vite** - Frontend build tool with hot reload
  ```bash
  npm run dev    # Development server on port 3000
  npm run build  # Production build
  npm run serve  # Preview production build
  ```

- **Go Modules** - Backend dependency management
  ```bash
  go mod tidy    # Clean up dependencies
  go run ./cmd/api  # Run the API server
  ```

### Code Quality & Formatting
- **Biome 2.2.2** - Fast formatter and linter for JavaScript/TypeScript
  ```bash
  npm run format  # Format code
  npm run lint    # Lint code
  npm run check   # Check formatting and linting
  ```

### Testing Framework
- **Vitest 3.2.4** - Fast unit testing framework
- **Testing Library** - React component testing utilities
- **jsdom 26.1.0** - DOM implementation for testing
  ```bash
  npm run test   # Run tests
  ```

## 🎨 UI & Component Libraries

### Design System
- **Radix UI** - Unstyled, accessible UI primitives
  - Dialog, Dropdown Menu, Select, Tabs, Tooltip, etc.
- **Lucide React 0.541.0** - Beautiful icon library
- **Class Variance Authority** - Component variant management
- **Tailwind Merge** - Utility for merging Tailwind classes

### Code Editor Components
- **MDX Editor 3.42.0** - Rich markdown editor with live preview
- **CodeMirror 6.x** - Code editor with syntax highlighting
  - Support for: JavaScript, Python, CSS, HTML, JSON, Markdown, PHP, Rust, Java, C++, XML, Solidity

## 🔐 Authentication & Security
- **Clerk** - Complete authentication solution
  - User management, JWT tokens, social logins
  - React integration with hooks and components

## 🗄️ Database & Storage
- **PostgreSQL** - Primary database
- **UUID** - Unique identifier generation
- **Database Scripts**
  - `scripts/setup-database.sql` - Database schema
  - `server/scripts/setup_db.sh` - Database setup automation

## 📦 Key Dependencies

### Frontend Dependencies
```json
{
  "@hookform/resolvers": "Form validation",
  "react-hook-form": "Form management",
  "zod": "Schema validation",
  "cmdk": "Command palette component",
  "tailwindcss-animate": "Animation utilities"
}
```

### Backend Dependencies
```go
require (
    "github.com/clerk/clerk-sdk-go/v2" // Authentication
    "github.com/google/uuid"           // UUID generation
    "github.com/gorilla/mux"          // HTTP routing
    "github.com/joho/godotenv"        // Environment variables
    "github.com/lib/pq"               // PostgreSQL driver
)
```

## 🚀 Development Workflow

### Getting Started
1. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

2. **Backend Setup**
   ```bash
   cd server
   go mod download
   ./scripts/setup_db.sh
   go run ./cmd/api
   ```

### Environment Configuration
- **Client**: Vite environment variables
- **Server**: `.env` files with Go dotenv
- **Database**: PostgreSQL connection strings
- **Authentication**: Clerk API keys

### Development Scripts
- **Database**: `scripts/setup-database.sql`
- **Testing**: `server/scripts/test_auth.sh`
- **Seeding**: `server/cmd/seed/` - Database seeding utilities

## 🎛️ IDE & Editor Support

### Recommended Extensions
- **TypeScript** - Language support
- **Tailwind CSS IntelliSense** - CSS class autocomplete
- **Go** - Go language support
- **PostgreSQL** - Database management
- **Biome** - Code formatting and linting

### Configuration Files
- **`.cursorrules`** - Cursor AI editor rules
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`vite.config.ts`** - Vite build configuration
- **`biome.json`** - Biome linting/formatting rules

## 🔍 Debugging & Development

### Browser DevTools
- **TanStack Query Devtools** - Query state inspection
- **TanStack Router Devtools** - Route debugging
- **React DevTools** - Component inspection

### Backend Debugging
- **Go debugging** with delve or IDE debuggers
- **Database queries** with PostgreSQL logs
- **API testing** with tools like Postman or curl

## 📊 Performance & Monitoring

### Frontend Performance
- **Vite HMR** - Hot module replacement
- **Code splitting** - Automatic route-based splitting
- **Web Vitals** - Performance metrics collection

### Backend Performance
- **Go profiling** - Built-in performance profiling
- **Database indexing** - Optimized queries
- **Connection pooling** - Efficient database connections

---

**Note**: This development environment is optimized for modern web development with focus on type safety, performance, and developer experience. All tools are configured to work together seamlessly for efficient Snippy development.
