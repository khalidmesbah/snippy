#!/bin/bash

# Seed User Data from .env Script
# This script seeds the database with test data for a user specified in .env file

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found"
    echo "Please create a .env file with the following content:"
    echo "DATABASE_URL=your_database_url_here"
    echo "USER_ID=user_30awHESGBrmH8MvigWQEtnHBxUi"
    exit 1
fi

# Check if DATABASE_URL is set in .env
if ! grep -q "DATABASE_URL=" .env; then
    print_error "DATABASE_URL not found in .env file"
    echo "Please add DATABASE_URL=your_database_url_here to your .env file"
    exit 1
fi

# Check if USER_ID is set in .env
if ! grep -q "USER_ID=" .env; then
    print_error "USER_ID not found in .env file"
    echo "Please add USER_ID=user_30awHESGBrmH8MvigWQEtnHBxUi to your .env file"
    exit 1
fi

# Load .env file to get USER_ID
USER_ID=$(grep "USER_ID=" .env | cut -d '=' -f2)
DATABASE_URL=$(grep "DATABASE_URL=" .env | cut -d '=' -f2)

print_status "Seeding data for user: $USER_ID"
print_status "Database URL: ${DATABASE_URL%:*}" # Hide password in output

# Build the seed command
print_status "Building seed-user command..."
cd "$(dirname "$0")/.."
go build -o bin/seed-user cmd/seed-user/main.go

# Run the seed command
print_status "Running seed-user command..."
./bin/seed-user

print_success "Successfully seeded data for user: $USER_ID"
print_status "The following data was created:"
echo "  - 12 collections with different colors"
echo "  - 15 tags with different colors"
echo "  - 13 code snippets with realistic content"
echo "  - Collection positions for drag-and-drop ordering"
echo "  - Collection-snippet positions for organizing snippets"
echo ""
print_status "You can now test the application with this user's data!"
