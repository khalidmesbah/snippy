-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
DROP TRIGGER IF EXISTS update_snippets_updated_at ON snippets;
DROP TRIGGER IF EXISTS update_collection_positions_updated_at ON collection_positions;
DROP TRIGGER IF EXISTS update_collection_snippet_positions_updated_at ON collection_snippet_positions;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();
