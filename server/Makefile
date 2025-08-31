# Load environment variables from .env
include .env
export

# Directories
MIGRATIONS_DIR=./migrations
SCRIPTS_DIR=./scripts

## Build the application
build:
	go build -o bin/api ./cmd/api

## Build and run the API server
run:
	go run ./cmd/api/main.go

## Database Management

### Setup database (migrations only)
setup-db:
	@echo "Setting up database (migrations only)..."
	@./scripts/setup.sh

### Run all pending migrations
migrate-up:
	@./scripts/migrate.sh up

### Rollback the last migration
migrate-down:
	@./scripts/migrate.sh down

### Check current migration version
migrate-version:
	@./scripts/migrate.sh version

### Force migration to specific version (usage: make migrate-force version=2)
migrate-force:
	@./scripts/migrate.sh force $(version)

### Create new migration (usage: make migrate-create name=add_new_table)
migrate-create:
	@./scripts/migrate.sh create $(name)

### Show migration status
migrate-status:
	@./scripts/migrate.sh status

### Reset database (drop all tables)
migrate-reset:
	@echo "⚠️  WARNING: This will DROP ALL TABLES and data from the database!"
	@echo "Database URL: ${DATABASE_URL}"
	@read -p "Are you sure you want to continue? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "Dropping all tables from database..."
	@psql "${DATABASE_URL}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@echo "✅ Database reset complete! All tables have been dropped."
	@echo "💡 Run 'make migrate-up' to recreate the schema."

### Seed database data for specific user from .env file
seed-user:
	@echo "🌱 Seeding data for user from .env file..."
	@./scripts/seed-user-env.sh

### Build seed command
build-seed:
	@echo "🔨 Building seed command..."
	@go build -o bin/seed-user ./cmd/seed-user/main.go
	@echo "✅ Seed command built successfully"

### Setup database with migrations and seed data
setup-db-with-seed: migrate-up seed-user
	@echo "✅ Database setup complete with seed data"

## Development

### Test the application
test:
	go test ./...

### Test with coverage
test-coverage:
	go test -cover ./...

### Format code
format:
	go fmt ./...

### Lint code
lint:
	golangci-lint run

### Clean build artifacts
clean:
	rm -rf bin/
	go clean

### Install dependencies
deps:
	go mod tidy
	go mod download

## Help
help:
	@echo "Available commands:"
	@echo ""
	@echo "Database Management:"
	@echo "  setup-db       - Setup database (migrations only)"
	@echo "  migrate-up     - Run all pending migrations"
	@echo "  migrate-down   - Rollback the last migration"
	@echo "  migrate-version- Check current migration version"
	@echo "  migrate-force  - Force migration to specific version (usage: make migrate-force version=2)"
	@echo "  migrate-create - Create new migration (usage: make migrate-create name=add_new_table)"
	@echo "  migrate-status - Show migration status"
	@echo "  migrate-reset  - Reset database (drop all tables)"
	@echo "  seed-user      - Seed database for specific user from .env file"
	@echo "  build-seed     - Build seed command"
	@echo "  setup-db-with-seed - Setup database with migrations and seed data"
	@echo ""
	@echo "Development:"
	@echo "  build         - Build the application"
	@echo "  run           - Run the API server"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  format        - Format Go code"
	@echo "  lint          - Lint Go code"
	@echo "  clean         - Clean build artifacts"
	@echo "  deps          - Install dependencies"
	@echo ""
	@echo "Help:"
	@echo "  help          - Show this help"
