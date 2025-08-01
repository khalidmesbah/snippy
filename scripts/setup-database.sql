-- Drop all existing tables
DROP TABLE IF EXISTS snippets CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create snippets table with language property
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  language VARCHAR(50) DEFAULT 'plaintext',
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  forked_from UUID REFERENCES snippets(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Collections table indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_name ON collections(name);
CREATE INDEX idx_collections_created_at ON collections(created_at);
CREATE INDEX idx_collections_user_created ON collections(user_id, created_at);

-- Snippets table indexes
CREATE INDEX idx_snippets_user_id ON snippets(user_id);
CREATE INDEX idx_snippets_collection_id ON snippets(collection_id);
CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_is_public ON snippets(is_public);
CREATE INDEX idx_snippets_is_favorite ON snippets(is_favorite);
CREATE INDEX idx_snippets_created_at ON snippets(created_at);
CREATE INDEX idx_snippets_updated_at ON snippets(updated_at);
CREATE INDEX idx_snippets_forked_from ON snippets(forked_from);
CREATE INDEX idx_snippets_fork_count ON snippets(fork_count);

-- Composite indexes for common queries
CREATE INDEX idx_snippets_user_public ON snippets(user_id, is_public);
CREATE INDEX idx_snippets_user_favorite ON snippets(user_id, is_favorite);
CREATE INDEX idx_snippets_user_collection ON snippets(user_id, collection_id);
CREATE INDEX idx_snippets_public_created ON snippets(is_public, created_at) WHERE is_public = true;
CREATE INDEX idx_snippets_user_created ON snippets(user_id, created_at);
CREATE INDEX idx_snippets_collection_position ON snippets(collection_id, position) WHERE collection_id IS NOT NULL;
CREATE INDEX idx_snippets_language_public ON snippets(language, is_public) WHERE is_public = true;

-- Full-text search indexes
CREATE INDEX idx_snippets_title_search ON snippets USING gin(to_tsvector('english', title));
CREATE INDEX idx_snippets_content_search ON snippets USING gin(to_tsvector('english', content));

-- Partial indexes for better performance on filtered queries
CREATE INDEX idx_snippets_public_only ON snippets(created_at, fork_count) WHERE is_public = true;
CREATE INDEX idx_snippets_favorites_only ON snippets(user_id, created_at) WHERE is_favorite = true;
