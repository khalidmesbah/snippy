package database

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/lib/pq"
)

// SeedUserData seeds the database with test data for a specific user from .env file
func SeedUserData() error {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		return fmt.Errorf("failed to load .env file: %w", err)
	}

	// Initialize database connection
	if err := Connect(); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer Close()

	// Get user ID from environment variable
	userID := os.Getenv("USER_ID")
	if userID == "" {
		return fmt.Errorf("USER_ID environment variable is not set in .env file")
	}

	log.Printf("🌱 Starting to seed data for user: %s", userID)

	// Clear existing data for this user
	if err := clearUserData(userID); err != nil {
		return fmt.Errorf("failed to clear existing data: %w", err)
	}

	// Seed collections (12+ items)
	collectionIDs, err := seedUserCollections(userID)
	if err != nil {
		return fmt.Errorf("failed to seed collections: %w", err)
	}

	// Seed tags (15+ items)
	tagIDs, err := seedUserTags(userID)
	if err != nil {
		return fmt.Errorf("failed to seed tags: %w", err)
	}

	// Seed snippets (13+ items)
	snippetIDs, err := seedUserSnippets(userID, collectionIDs, tagIDs)
	if err != nil {
		return fmt.Errorf("failed to seed snippets: %w", err)
	}

	// Seed collection positions
	if err := seedUserCollectionPositions(userID, collectionIDs); err != nil {
		return fmt.Errorf("failed to seed collection positions: %w", err)
	}

	// Seed collection snippet positions
	if err := seedUserCollectionSnippetPositions(userID, collectionIDs, snippetIDs); err != nil {
		return fmt.Errorf("failed to seed collection snippet positions: %w", err)
	}

	log.Printf("✅ Successfully seeded data for user: %s", userID)
	return nil
}

func clearUserData(userID string) error {
	log.Printf("   - Clearing existing data for user: %s", userID)

	// Delete in order to respect foreign key constraints
	if _, err := GetDB().Exec("DELETE FROM collection_snippet_positions WHERE user_id = $1", userID); err != nil {
		return err
	}
	if _, err := GetDB().Exec("DELETE FROM collection_positions WHERE user_id = $1", userID); err != nil {
		return err
	}
	if _, err := GetDB().Exec("DELETE FROM snippets WHERE user_id = $1", userID); err != nil {
		return err
	}
	if _, err := GetDB().Exec("DELETE FROM collections WHERE user_id = $1", userID); err != nil {
		return err
	}
	if _, err := GetDB().Exec("DELETE FROM tags WHERE user_id = $1", userID); err != nil {
		return err
	}

	return nil
}

func seedUserCollections(userID string) ([]string, error) {
	log.Printf("   - Seeding collections for user: %s", userID)

	collections := []struct {
		name  string
		color string
	}{
		{"JavaScript Utils", "#3b82f6"},
		{"CSS Animations", "#ef4444"},
		{"React Components", "#10b981"},
		{"Python Scripts", "#8b5cf6"},
		{"SQL Queries", "#f59e0b"},
		{"Docker Commands", "#6b7280"},
		{"TypeScript Helpers", "#3178c6"},
		{"Node.js Utilities", "#339933"},
		{"Vue.js Components", "#42b883"},
		{"Git Workflows", "#f05032"},
		{"API Endpoints", "#ec4899"},
		{"Database Schemas", "#06b6d4"},
	}

	var collectionIDs []string

	for _, c := range collections {
		id := uuid.New().String()
		_, err := GetDB().Exec(`
			INSERT INTO collections (id, user_id, name, color, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6)`,
			id, userID, c.name, c.color, time.Now(), time.Now())

		if err != nil {
			return nil, err
		}
		collectionIDs = append(collectionIDs, id)
		log.Printf("     ✓ Created collection: %s", c.name)
	}

	return collectionIDs, nil
}

func seedUserTags(userID string) ([]string, error) {
	log.Printf("   - Seeding tags for user: %s", userID)

	tags := []struct {
		name  string
		color string
	}{
		{"javascript", "#f7df1e"},
		{"utility", "#3b82f6"},
		{"performance", "#10b981"},
		{"array", "#ef4444"},
		{"css", "#8b5cf6"},
		{"animation", "#f59e0b"},
		{"fade", "#6b7280"},
		{"python", "#3776ab"},
		{"file", "#10b981"},
		{"react", "#61dafb"},
		{"typescript", "#3178c6"},
		{"database", "#06b6d4"},
		{"api", "#ec4899"},
		{"docker", "#2496ed"},
		{"git", "#f05032"},
	}

	var tagIDs []string

	for _, t := range tags {
		id := uuid.New().String()
		_, err := GetDB().Exec(`
			INSERT INTO tags (id, user_id, name, color, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6)`,
			id, userID, t.name, t.color, time.Now(), time.Now())

		if err != nil {
			return nil, err
		}
		tagIDs = append(tagIDs, id)
		log.Printf("     ✓ Created tag: %s", t.name)
	}

	return tagIDs, nil
}

func seedUserSnippets(userID string, collectionIDs, tagIDs []string) ([]string, error) {
	log.Printf("   - Seeding snippets for user: %s", userID)

	snippets := []struct {
		title   string
		content string
	}{
		{
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
		},
		{
			"Array Shuffle",
			`function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}`,
		},
		{
			"Fade In Animation",
			`@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}`,
		},
		{
			"React Custom Hook",
			`import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = value => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}`,
		},
		{
			"Python File Reader",
			`def read_file_chunks(file_path, chunk_size=1024):
    """Read a file in chunks to handle large files efficiently."""
    with open(file_path, 'r') as file:
        while True:
            chunk = file.read(chunk_size)
            if not chunk:
                break
            yield chunk`,
		},
		{
			"SQL User Query",
			`SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at >= $1
GROUP BY u.id, u.name, u.email
ORDER BY post_count DESC;`,
		},
		{
			"Docker Compose Setup",
			`version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,
		},
		{
			"TypeScript Interface",
			`interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
}

type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateUserRequest = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;`,
		},
		{
			"Node.js Express Middleware",
			`const express = require('express');
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;`,
		},
		{
			"Vue.js Component",
			`<template>
  <div class="todo-list">
    <h2>{{ title }}</h2>
    <div class="todo-input">
      <input 
        v-model="newTodo" 
        @keyup.enter="addTodo"
        placeholder="Add a new todo..."
      />
      <button @click="addTodo">Add</button>
    </div>
    <ul class="todos">
      <li 
        v-for="todo in todos" 
        :key="todo.id"
        :class="{ completed: todo.completed }"
        @click="toggleTodo(todo.id)"
      >
        {{ todo.text }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'TodoList',
  data() {
    return {
      title: 'My Todo List',
      newTodo: '',
      todos: []
    }
  },
  methods: {
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo,
          completed: false
        });
        this.newTodo = '';
      }
    },
    toggleTodo(id) {
      const todo = this.todos.find(t => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    }
  }
}
</script>`,
		},
		{
			"Git Workflow Script",
			`#!/bin/bash
# Git workflow script for feature development

BRANCH_NAME="feature/$(date +%Y%m%d)-$1"

echo "Creating new feature branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

echo "Branch created successfully!"
echo "Next steps:"
echo "1. Make your changes"
echo "2. git add ."
echo "3. git commit -m 'feat: your commit message'"
echo "4. git push origin $BRANCH_NAME"
echo "5. Create a pull request"`,
		},
		{
			"API Response Handler",
			`const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'HTTP error! status: ' + response.status);
  }
  
  const data = await response.json();
  return data;
};

const apiClient = {
  async get(url) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleApiResponse(response);
  },
  
  async post(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  }
};`,
		},
		{
			"Database Migration",
			`-- Migration: Add user preferences table
-- Up migration

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  theme VARCHAR(10) DEFAULT 'light',
  language VARCHAR(5) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Down migration (for rollback)
-- DROP TABLE IF EXISTS user_preferences CASCADE;`,
		},
	}

	var snippetIDs []string

	for _, s := range snippets {
		id := uuid.New().String()

		// Randomly assign to 1-2 collections
		numCollections := rand.Intn(2) + 1
		selectedCollections := make([]string, 0, numCollections)
		for j := 0; j < numCollections; j++ {
			selectedCollections = append(selectedCollections, collectionIDs[rand.Intn(len(collectionIDs))])
		}

		// Randomly assign 2-4 tags
		numTags := rand.Intn(3) + 2
		selectedTags := make([]string, 0, numTags)
		for j := 0; j < numTags; j++ {
			selectedTags = append(selectedTags, tagIDs[rand.Intn(len(tagIDs))])
		}

		// Random public/favorite status
		isPublic := rand.Float32() < 0.3   // 30% chance of being public
		isFavorite := rand.Float32() < 0.2 // 20% chance of being favorite

		_, err := GetDB().Exec(`
			INSERT INTO snippets (id, user_id, title, content, collection_ids, tag_ids, is_public, is_favorite, fork_count, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			id, userID, s.title, s.content, pq.Array(selectedCollections), pq.Array(selectedTags),
			isPublic, isFavorite, rand.Intn(5), time.Now(), time.Now())

		if err != nil {
			return nil, err
		}
		snippetIDs = append(snippetIDs, id)
		log.Printf("     ✓ Created snippet: %s", s.title)
	}

	return snippetIDs, nil
}

func seedUserCollectionPositions(userID string, collectionIDs []string) error {
	log.Printf("   - Seeding collection positions for user: %s", userID)

	for i, collectionID := range collectionIDs {
		_, err := GetDB().Exec(`
			INSERT INTO collection_positions (id, collection_id, user_id, position, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6)`,
			uuid.New().String(), collectionID, userID, i, time.Now(), time.Now())

		if err != nil {
			return err
		}
	}

	log.Printf("     ✓ Created %d collection positions", len(collectionIDs))
	return nil
}

func seedUserCollectionSnippetPositions(userID string, collectionIDs, snippetIDs []string) error {
	log.Printf("   - Seeding collection snippet positions for user: %s", userID)

	// For each snippet, create position entries for its collections
	for snippetIndex, snippetID := range snippetIDs {
		// Get the collections this snippet belongs to
		var collectionIDsForSnippet []string
		err := GetDB().QueryRow(`
			SELECT collection_ids FROM snippets WHERE id = $1`, snippetID).Scan(pq.Array(&collectionIDsForSnippet))
		if err != nil {
			return err
		}

		// Create position entries for each collection
		for collectionIndex, collectionID := range collectionIDsForSnippet {
			_, err := GetDB().Exec(`
				INSERT INTO collection_snippet_positions (id, collection_id, snippet_id, user_id, position, created_at, updated_at) 
				VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				uuid.New().String(), collectionID, snippetID, userID,
				snippetIndex*len(collectionIDs)+collectionIndex, time.Now(), time.Now())

			if err != nil {
				return err
			}
		}
	}

	log.Printf("     ✓ Created collection snippet positions")
	return nil
}
