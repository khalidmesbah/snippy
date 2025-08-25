# Load environment variables from .env
include .env
export

MIGRATIONS_DIR=./db/migrations

## Run all migrations
migrate-up:
	migrate -path $(MIGRATIONS_DIR) -database "$(TEST_DATABASE_URL)" up

## Rollback the last migration
migrate-down:
	migrate -path $(MIGRATIONS_DIR) -database "$(TEST_DATABASE_URL)" down 1

## Rollback all migrations
migrate-reset:
	migrate -path $(MIGRATIONS_DIR) -database "$(TEST_DATABASE_URL)" down

## Create a new migration file (usage: make migrate-create name=add_users_table)
migrate-create:
	migrate create -ext sql -dir $(MIGRATIONS_DIR) $(name)
