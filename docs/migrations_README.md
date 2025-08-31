# Database Migrations

This directory contains database migrations for the Snippy application using the `golang-migrate` tool.

## Migration Files

- `000001_create_initial_schema.up.sql` - Creates the initial database schema
- `000001_create_initial_schema.down.sql` - Reverts the initial schema
- `000002_seed_initial_data.up.sql` - Seeds the database with initial test data
- `000002_seed_initial_data.down.sql` - Removes the seeded data

## Running Migrations

### Using the Migration Script

```bash
# Run all pending migrations
./scripts/migrate.sh up

# Check current migration version
./scripts/migrate.sh version

# Force migration to a specific version
./scripts/migrate.sh force 2

# Create a new migration
./scripts/migrate.sh create add_new_table
```

### Using Make Commands

```bash
# Run migrations up
make migrate-up

# Check migration version
make migrate-version

# Force migration to specific version
make migrate-force version=2

# Setup database with migrations and seed data
make setup-db
```



## Environment Variables

Make sure to set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"
```

## Creating New Migrations

To create a new migration:

```bash
# Using the script
./scripts/migrate.sh create add_new_feature

# Using make
make migrate-create name=add_new_feature

# Using migrate directly
migrate create -ext sql -dir migrations -seq add_new_feature
```

This will create two files:
- `XXXXXX_add_new_feature.up.sql` - Migration to apply
- `XXXXXX_add_new_feature.down.sql` - Migration to revert

## Migration Best Practices

1. **Always create both up and down migrations**
2. **Use descriptive names** for migrations
3. **Test migrations** in a development environment first
4. **Use transactions** for complex migrations
5. **Include indexes** for performance
6. **Add constraints** for data integrity
7. **Document complex migrations** with comments

## Database Schema

The current schema includes:

### Snippets Table
- `id` (UUID, Primary Key)
- `user_id` (TEXT, NOT NULL)
- `title` (TEXT, NOT NULL)
- `content` (TEXT, NOT NULL)
- `collection_ids` (UUID[], Default: '{}')
- `tag_ids` (UUID[], Default: '{}')
- `is_public` (BOOLEAN, Default: false)
- `is_favorite` (BOOLEAN, Default: false)

- `fork_count` (INT, Default: 0)
- `forked_from` (UUID, Default: NULL)
- `created_at` (TIMESTAMP, Default: now())
- `updated_at` (TIMESTAMP, Default: now())

### Collections Table
- `id` (UUID, Primary Key, Default: gen_random_uuid())
- `user_id` (TEXT, NOT NULL)
- `name` (TEXT, NOT NULL)
- `color` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP, Default: now())
- `updated_at` (TIMESTAMP, Default: now())
- Unique constraint on (user_id, name)

### Tags Table
- `id` (UUID, Primary Key, Default: gen_random_uuid())
- `user_id` (TEXT, NOT NULL)
- `name` (TEXT, NOT NULL)
- `color` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP, Default: now())
- `updated_at` (TIMESTAMP, Default: now())
- Unique constraint on (user_id, name)

## Troubleshooting

### Migration Errors

If you encounter migration errors:

1. Check the database connection
2. Verify the `DATABASE_URL` is correct
3. Check for syntax errors in migration files
4. Ensure the database is accessible

### Dirty State

If the database is in a dirty state:

```bash
# Check the current state
./scripts/migrate.sh version

# Force to a specific version
./scripts/migrate.sh force 1
```

### Rollback

To rollback migrations:

```bash
# Rollback the last migration
migrate -path migrations -database "$DATABASE_URL" down 1

# Rollback all migrations
migrate -path migrations -database "$DATABASE_URL" down
```
