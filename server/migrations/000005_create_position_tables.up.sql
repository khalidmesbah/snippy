-- Create collection positions table
CREATE TABLE IF NOT EXISTS collection_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(collection_id, user_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- Create collection snippet positions table
CREATE TABLE IF NOT EXISTS collection_snippet_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL,
  snippet_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(collection_id, snippet_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);

-- Create indexes for position tables
CREATE INDEX IF NOT EXISTS idx_collection_positions_collection_id ON collection_positions(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_positions_user_id ON collection_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_positions_position ON collection_positions(position);

CREATE INDEX IF NOT EXISTS idx_collection_snippet_positions_collection_id ON collection_snippet_positions(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_snippet_positions_snippet_id ON collection_snippet_positions(snippet_id);
CREATE INDEX IF NOT EXISTS idx_collection_snippet_positions_user_id ON collection_snippet_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_snippet_positions_position ON collection_snippet_positions(position);
