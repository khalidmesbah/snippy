CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  collection_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  position INT DEFAULT 0,
  fork_count INT DEFAULT 0,
  forked_from UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
