// seed.go
package main

import (
	"database/sql"
	"github.com/lib/pq"   // PostgreSQL driver
	_ "github.com/lib/pq" // PostgreSQL database driver (imported for side effects)
	"log"
	"time"
)

// clearData removes all existing data from tables
func clearData(db *sql.DB) error {
	// Delete in order to respect foreign key constraints
	if _, err := db.Exec("DELETE FROM snippets"); err != nil {
		return err
	}
	if _, err := db.Exec("DELETE FROM collections"); err != nil {
		return err
	}
	log.Println("   - Cleared existing data")
	return nil
}

// seedCollections inserts test collections
func seedCollections(db *sql.DB) error {
	collections := []struct {
		id        string
		userID    string
		name      string
		color     string
		createdAt time.Time
		updatedAt time.Time
	}{
		{"550e8400-e29b-41d4-a716-446655440001", "user_123", "JavaScript Utils", "#3b82f6", parseTime("2024-01-15 10:30:00"), parseTime("2024-01-15 10:30:00")},
		{"550e8400-e29b-41d4-a716-446655440002", "user_123", "CSS Animations", "#ef4444", parseTime("2024-01-20 14:20:00"), parseTime("2024-02-01 09:15:00")},
		{"550e8400-e29b-41d4-a716-446655440003", "user_456", "Python Scripts", "#10b981", parseTime("2024-02-05 16:45:00"), parseTime("2024-02-05 16:45:00")},
		{"550e8400-e29b-41d4-a716-446655440004", "user_789", "React Hooks", "#8b5cf6", parseTime("2024-02-10 11:00:00"), parseTime("2024-02-12 13:30:00")},
		{"550e8400-e29b-41d4-a716-446655440005", "user_456", "SQL Queries", "#f59e0b", parseTime("2024-02-15 08:15:00"), parseTime("2024-02-20 17:00:00")},
		{"550e8400-e29b-41d4-a716-446655440006", "user_101", "Docker Commands", "#6b7280", parseTime("2024-02-18 12:30:00"), parseTime("2024-02-18 12:30:00")},
	}

	for _, c := range collections {
		_, err := db.Exec(`
			INSERT INTO collections (id, user_id, name, color, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6)`,
			c.id, c.userID, c.name, c.color, c.createdAt, c.updatedAt)

		if err != nil {
			return err
		}
		log.Printf("   ✓ Created collection: %s", c.name)
	}

	return nil
}

// seedSnippets inserts test code snippets
func seedSnippets(db *sql.DB) error {
	snippets := []struct {
		id           string
		userID       string
		collectionID *string
		title        string
		content      string
		tags         []string
		isPublic     bool
		isFavorite   bool
		position     int
		forkCount    int
		forkedFrom   *string
		createdAt    time.Time
		updatedAt    time.Time
	}{
		// JavaScript Utils collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440001", "user_123", stringPtr("550e8400-e29b-41d4-a716-446655440001"),
			"Debounce Function",
			`function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`,
			[]string{"javascript", "utility", "performance"}, true, true, 1, 15, nil,
			parseTime("2024-01-15 10:35:00"), parseTime("2024-01-15 10:35:00"),
		},
		{
			"660e8400-e29b-41d4-a716-446655440002", "user_123", stringPtr("550e8400-e29b-41d4-a716-446655440001"),
			"Array Shuffle",
			`function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}`,
			[]string{"javascript", "array", "random"}, true, false, 2, 8, nil,
			parseTime("2024-01-16 09:20:00"), parseTime("2024-01-16 09:20:00"),
		},
		{
			"660e8400-e29b-41d4-a716-446655440003", "user_123", stringPtr("550e8400-e29b-41d4-a716-446655440001"),
			"Deep Clone Object",
			`function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === "object") {
    const copy = {};
    Object.keys(obj).forEach(key => copy[key] = deepClone(obj[key]));
    return copy;
  }
}`,
			[]string{"javascript", "object", "utility"}, false, true, 3, 3, nil,
			parseTime("2024-01-18 15:45:00"), parseTime("2024-01-18 15:45:00"),
		},

		// CSS Animations collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440004", "user_123", stringPtr("550e8400-e29b-41d4-a716-446655440002"),
			"Fade In Animation",
			`@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}`,
			[]string{"css", "animation", "fade"}, true, true, 1, 12, nil,
			parseTime("2024-01-20 14:25:00"), parseTime("2024-01-20 14:25:00"),
		},
		{
			"660e8400-e29b-41d4-a716-446655440005", "user_123", stringPtr("550e8400-e29b-41d4-a716-446655440002"),
			"Bounce Loading",
			`@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
}

.bounce-loader {
  animation: bounce 2s infinite;
}`,
			[]string{"css", "animation", "loading"}, true, false, 2, 22, nil,
			parseTime("2024-01-22 11:10:00"), parseTime("2024-02-01 09:15:00"),
		},

		// Python Scripts collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440006", "user_456", stringPtr("550e8400-e29b-41d4-a716-446655440003"),
			"File Reader Helper",
			`import os
from typing import Generator

def read_file_chunks(file_path: str, chunk_size: int = 1024) -> Generator[str, None, None]:
    """Read file in chunks to handle large files efficiently."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} not found")
    
    with open(file_path, 'r', encoding='utf-8') as file:
        while True:
            chunk = file.read(chunk_size)
            if not chunk:
                break
            yield chunk`,
			[]string{"python", "file-handling", "generator"}, true, true, 1, 5, nil,
			parseTime("2024-02-05 16:50:00"), parseTime("2024-02-05 16:50:00"),
		},
		{
			"660e8400-e29b-41d4-a716-446655440007", "user_456", stringPtr("550e8400-e29b-41d4-a716-446655440003"),
			"JSON Config Loader",
			`import json
import os
from typing import Dict, Any

class ConfigLoader:
    def __init__(self, config_path: str):
        self.config_path = config_path
        self._config = None
    
    def load(self) -> Dict[str, Any]:
        if self._config is None:
            with open(self.config_path, 'r') as f:
                self._config = json.load(f)
        return self._config
    
    def get(self, key: str, default=None):
        config = self.load()
        return config.get(key, default)`,
			[]string{"python", "config", "json"}, false, false, 2, 2, nil,
			parseTime("2024-02-06 10:30:00"), parseTime("2024-02-06 10:30:00"),
		},

		// React Hooks collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440008", "user_789", stringPtr("550e8400-e29b-41d4-a716-446655440004"),
			"useLocalStorage Hook",
			`import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}`,
			[]string{"react", "hooks", "localStorage"}, true, true, 1, 28, nil,
			parseTime("2024-02-10 11:05:00"), parseTime("2024-02-10 11:05:00"),
		},
		{
			"660e8400-e29b-41d4-a716-446655440009", "user_789", stringPtr("550e8400-e29b-41d4-a716-446655440004"),
			"useFetch Hook",
			`import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
					throw new Error('HTTP error! status: ' + response.status);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}`,
			[]string{"react", "hooks", "fetch", "api"}, true, false, 2, 18, nil,
			parseTime("2024-02-11 14:20:00"), parseTime("2024-02-11 14:20:00"),
		},

		// Forked snippet example (no collection)
		{
			"660e8400-e29b-41d4-a716-446655440010", "user_999", nil,
			"Enhanced Debounce",
			`function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}`,
			[]string{"javascript", "utility", "performance", "enhanced"}, true, false, 0, 7,
			stringPtr("660e8400-e29b-41d4-a716-446655440001"),
			parseTime("2024-02-12 09:30:00"), parseTime("2024-02-12 09:30:00"),
		},

		// SQL Queries collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440011", "user_456", stringPtr("550e8400-e29b-41d4-a716-446655440005"),
			"Find Duplicate Records",
			`SELECT column1, column2, COUNT(*)
FROM your_table
GROUP BY column1, column2
HAVING COUNT(*) > 1;

-- Alternative with window functions
SELECT *
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY column1, column2 ORDER BY id) as rn
  FROM your_table
) t
WHERE t.rn > 1;`,
			[]string{"sql", "duplicates", "analysis"}, true, true, 1, 9, nil,
			parseTime("2024-02-15 08:20:00"), parseTime("2024-02-15 08:20:00"),
		},
		{
			"660e8400-e29b-41d4-a716-446655440012", "user_456", stringPtr("550e8400-e29b-41d4-a716-446655440005"),
			"Recursive CTE Example",
			`WITH RECURSIVE employee_hierarchy AS (
  -- Base case: top-level managers
  SELECT id, name, manager_id, 1 as level
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  -- Recursive case: employees with managers
  SELECT e.id, e.name, e.manager_id, eh.level + 1
  FROM employees e
  INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy
ORDER BY level, name;`,
			[]string{"sql", "cte", "recursive", "hierarchy"}, false, true, 2, 4, nil,
			parseTime("2024-02-16 13:45:00"), parseTime("2024-02-20 17:00:00"),
		},

		// Docker Commands collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440013", "user_101", stringPtr("550e8400-e29b-41d4-a716-446655440006"),
			"Docker Cleanup Commands",
			`# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove everything (containers, networks, images, cache)
docker system prune -a --volumes

# Remove containers older than 24 hours
docker container prune --filter "until=24h"

# Show disk usage
docker system df`,
			[]string{"docker", "cleanup", "maintenance"}, true, false, 1, 11, nil,
			parseTime("2024-02-18 12:35:00"), parseTime("2024-02-18 12:35:00"),
		},
		{
			"660e8400-e29b-41d4-a716-446655440014", "user_101", stringPtr("550e8400-e29b-41d4-a716-446655440006"),
			"Docker Compose Dev Setup",
			`version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:`,
			[]string{"docker", "docker-compose", "development"}, false, true, 2, 6, nil,
			parseTime("2024-02-19 16:20:00"), parseTime("2024-02-19 16:20:00"),
		},
	}

	for _, s := range snippets {
		_, err := db.Exec(`
			INSERT INTO snippets (id, user_id, collection_id, title, content, tags, is_public, is_favorite, position, fork_count, forked_from, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
			s.id, s.userID, s.collectionID, s.title, s.content, pq.Array(s.tags),
			s.isPublic, s.isFavorite, s.position, s.forkCount, s.forkedFrom, s.createdAt, s.updatedAt)

		if err != nil {
			return err
		}
		log.Printf("   ✓ Created snippet: %s", s.title)
	}

	return nil
}
