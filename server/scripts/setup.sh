#!/bin/bash

# Database Setup Script for Snippy
# This script sets up the database by running schema migrations only

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Snippy Database Setup${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    echo "Please set your Neon database URL:"
    echo "export DATABASE_URL='your_neon_database_url_here'"
    exit 1
fi

print_header
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

# Run migrations
print_status "Running database migrations..."
if migrate -path migrations -database "$DATABASE_URL" up; then
    print_success "Migrations completed successfully!"
else
    print_error "Failed to run migrations"
    exit 1
fi

print_success "Database setup completed successfully!"
echo ""
print_status "Next steps:"
echo "  - To seed development data: make seed"
echo "  - To run the API server: make run"
