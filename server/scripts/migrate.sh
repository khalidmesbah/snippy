#!/bin/bash

# Database Migration Script for Snippy
# This script uses golang-migrate to manage database migrations
#
# Database Schema Overview:
# - collections: User collections with name, color, and metadata
# - snippets: Code snippets with content, tags, and metadata
# - collection_snippet_positions: Position management for snippets within collections
# - collection_positions: Position management for collections within user's view
#
# Position Management Tables:
# - collection_snippet_positions: Stores snippet positions within each collection
#   - collection_id: References collections table
#   - snippet_id: References snippets table
#   - user_id: User who owns the position
#   - position: Integer position for sorting
#   - UNIQUE constraint on (collection_id, snippet_id)
#
# - collection_positions: Stores collection positions for each user
#   - collection_id: References collections table
#   - user_id: User who owns the position
#   - position: Integer position for sorting
#   - UNIQUE constraint on (collection_id, user_id)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    echo "Please set your Neon database URL:"
    echo "export DATABASE_URL='your_neon_database_url_here'"
    echo ""
    echo "Or use the helper script:"
    echo "./scripts/migrate-with-env.sh [command]"
    exit 1
fi

print_success "DATABASE_URL is set"
print_status "Connecting to: ${DATABASE_URL%:*}" # Hide password in output

# Test database connection
print_status "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    print_error "Cannot connect to database"
    echo "Please check your DATABASE_URL and ensure the database is accessible"
    exit 1
fi

print_success "Database connection successful"

# Get the migration command from arguments
COMMAND=${1:-"up"}

case $COMMAND in
    "up")
        print_status "Running migrations up..."
        migrate -path ./migrations -database "$DATABASE_URL" up
        print_success "Migrations completed successfully!"
        print_status "Current database schema includes:"
        print_status "  - collections table"
        print_status "  - snippets table"
        print_status "  - collection_snippet_positions table (for snippet ordering)"
        print_status "  - collection_positions table (for collection ordering)"
        ;;
    "down")
        print_status "Running migrations down..."
        migrate -path ./migrations -database "$DATABASE_URL" down
        print_success "Migrations rolled back successfully!"
        ;;
    "force")
        VERSION=${2:-""}
        if [ -z "$VERSION" ]; then
            print_error "Version number required for force command"
            echo "Usage: $0 force <version>"
            echo ""
            echo "Common versions:"
            echo "  0 - Reset to initial state"
            echo "  4 - Skip to before position tables"
            echo "  5 - Current version with position tables"
            exit 1
        fi
        print_status "Forcing migration to version $VERSION..."
        migrate -path ./migrations -database "$DATABASE_URL" force "$VERSION"
        print_success "Migration forced to version $VERSION!"
        ;;
    "version")
        print_status "Current migration version:"
        migrate -path ./migrations -database "$DATABASE_URL" version
        ;;
    "create")
        NAME=${2:-""}
        if [ -z "$NAME" ]; then
            print_error "Migration name required"
            echo "Usage: $0 create <migration_name>"
            echo ""
            echo "Example:"
            echo "  $0 create add_user_preferences"
            exit 1
        fi
        print_status "Creating new migration: $NAME"
        migrate create -ext sql -dir ./migrations -seq "$NAME"
        print_success "Migration files created!"
        print_status "Edit the generated .up.sql and .down.sql files"
        ;;
    "status")
        print_status "Migration status:"
        migrate -path ./migrations -database "$DATABASE_URL" version
        ;;
    "schema")
        print_status "Current database schema:"
        echo ""
        echo "Tables:"
        psql "$DATABASE_URL" -c "\dt" 2>/dev/null || echo "No tables found"
        echo ""
        echo "Position management tables:"
        psql "$DATABASE_URL" -c "\d collection_snippet_positions" 2>/dev/null || echo "Table not found"
        echo ""
        psql "$DATABASE_URL" -c "\d collection_positions" 2>/dev/null || echo "Table not found"
        ;;
    *)
        echo "Usage: $0 {up|down|force|version|create|status|schema}"
        echo ""
        echo "Commands:"
        echo "  up       - Run all pending migrations"
        echo "  down     - Rollback the last migration"
        echo "  force    - Force migration to a specific version"
        echo "  version  - Show current migration version"
        echo "  create   - Create a new migration file"
        echo "  status   - Show migration status"
        echo "  schema   - Show current database schema"
        echo ""
        echo "Helper Script:"
        echo "  ./scripts/migrate-with-env.sh [command] - Auto-sets DATABASE_URL"
        echo ""
        echo "Position Management:"
        echo "  The database includes position management tables for:"
        echo "  - Snippet ordering within collections"
        echo "  - Collection ordering for each user"
        exit 1
        ;;
esac
