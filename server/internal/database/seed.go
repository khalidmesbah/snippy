package database

import (
	"log"
	"time"

	"github.com/lib/pq"
)

// SeedDatabase seeds the database with initial test data
func SeedDatabase() error {
	log.Println("🌱 Starting database seeding...")

	// Clear existing data
	if err := clearData(); err != nil {
		return err
	}

	// Seed collections
	if err := seedCollections(); err != nil {
		return err
	}

	// Seed tags
	if err := seedTags(); err != nil {
		return err
	}

	// Seed snippets
	if err := seedSnippets(); err != nil {
		return err
	}

	// Seed position tables
	if err := seedCollectionPositions(); err != nil {
		return err
	}

	if err := seedCollectionSnippetPositions(); err != nil {
		return err
	}

	log.Println("✅ Database seeding completed successfully")
	return nil
}

// clearData removes all existing data from tables
func clearData() error {
	// Delete in order to respect foreign key constraints
	if _, err := GetDB().Exec("DELETE FROM collection_snippet_positions"); err != nil {
		return err
	}
	if _, err := GetDB().Exec("DELETE FROM collection_positions"); err != nil {
		return err
	}
	if _, err := GetDB().Exec("DELETE FROM snippets"); err != nil {
		return err
	}
	if _, err := GetDB().Exec("DELETE FROM collections"); err != nil {
		return err
	}
	if _, err := GetDB().Exec("DELETE FROM tags"); err != nil {
		return err
	}
	log.Println("   - Cleared existing data")
	return nil
}

// seedCollections inserts test collections
func seedCollections() error {
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
		{"550e8400-e29b-41d4-a716-446655440007", "user_123", "TypeScript Helpers", "#3178c6", parseTime("2024-02-25 09:45:00"), parseTime("2024-02-25 09:45:00")},
		{"550e8400-e29b-41d4-a716-446655440008", "user_456", "Node.js Utilities", "#339933", parseTime("2024-03-01 14:20:00"), parseTime("2024-03-01 14:20:00")},
		{"550e8400-e29b-41d4-a716-446655440009", "user_789", "Vue.js Components", "#42b883", parseTime("2024-03-05 11:30:00"), parseTime("2024-03-05 11:30:00")},
		{"550e8400-e29b-41d4-a716-446655440010", "user_101", "Git Workflows", "#f05032", parseTime("2024-03-10 16:15:00"), parseTime("2024-03-10 16:15:00")},
	}

	for _, c := range collections {
		_, err := GetDB().Exec(`
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

// seedTags inserts test tags
func seedTags() error {
	tags := []struct {
		id        string
		userID    string
		name      string
		color     string
		createdAt time.Time
		updatedAt time.Time
	}{
		{"750e8400-e29b-41d4-a716-446655440001", "user_123", "javascript", "#f7df1e", parseTime("2024-01-15 10:30:00"), parseTime("2024-01-15 10:30:00")},
		{"750e8400-e29b-41d4-a716-446655440002", "user_123", "utility", "#3b82f6", parseTime("2024-01-15 10:30:00"), parseTime("2024-01-15 10:30:00")},
		{"750e8400-e29b-41d4-a716-446655440003", "user_123", "performance", "#10b981", parseTime("2024-01-15 10:30:00"), parseTime("2024-01-15 10:30:00")},
		{"750e8400-e29b-41d4-a716-446655440004", "user_123", "array", "#ef4444", parseTime("2024-01-16 11:20:00"), parseTime("2024-01-16 11:20:00")},
		{"750e8400-e29b-41d4-a716-446655440005", "user_123", "css", "#8b5cf6", parseTime("2024-01-20 14:25:00"), parseTime("2024-01-20 14:25:00")},
		{"750e8400-e29b-41d4-a716-446655440006", "user_123", "animation", "#f59e0b", parseTime("2024-01-20 14:25:00"), parseTime("2024-01-20 14:25:00")},
		{"750e8400-e29b-41d4-a716-446655440007", "user_123", "fade", "#6b7280", parseTime("2024-01-20 14:25:00"), parseTime("2024-01-20 14:25:00")},
		{"750e8400-e29b-41d4-a716-446655440008", "user_456", "python", "#3776ab", parseTime("2024-02-05 16:50:00"), parseTime("2024-02-05 16:50:00")},
		{"750e8400-e29b-41d4-a716-446655440009", "user_456", "file", "#10b981", parseTime("2024-02-05 16:50:00"), parseTime("2024-02-05 16:50:00")},
		{"750e8400-e29b-41d4-a716-446655440010", "user_789", "react", "#61dafb", parseTime("2024-02-10 11:05:00"), parseTime("2024-02-10 11:05:00")},
	}

	for _, t := range tags {
		_, err := GetDB().Exec(`
			INSERT INTO tags (id, user_id, name, color, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6)`,
			t.id, t.userID, t.name, t.color, t.createdAt, t.updatedAt)

		if err != nil {
			return err
		}
		log.Printf("   ✓ Created tag: %s", t.name)
	}

	return nil
}

// seedSnippets inserts test code snippets
func seedSnippets() error {
	snippets := []struct {
		id            string
		userID        string
		collectionIDs []string
		title         string
		content       string
		tagIDs        []string
		isPublic      bool
		isFavorite    bool

		forkCount  int
		forkedFrom *string
		createdAt  time.Time
		updatedAt  time.Time
	}{
		// JavaScript Utils collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440001", "user_123", []string{"550e8400-e29b-41d4-a716-446655440001"},
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
			[]string{"750e8400-e29b-41d4-a716-446655440001", "750e8400-e29b-41d4-a716-446655440002", "750e8400-e29b-41d4-a716-446655440003"}, true, true, 1, nil,
			parseTime("2024-01-15 10:35:00"), parseTime("2024-01-15 10:35:00"),
		},
		{
			"660e8400-e29b-41d4-a716-446655440002", "user_123", []string{"550e8400-e29b-41d4-a716-446655440001"},
			"Array Shuffle",
			`function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}`,
			[]string{"750e8400-e29b-41d4-a716-446655440001", "750e8400-e29b-41d4-a716-446655440004", "750e8400-e29b-41d4-a716-446655440002"}, true, false, 1, nil,
			parseTime("2024-01-16 11:20:00"), parseTime("2024-01-16 11:20:00"),
		},
		// CSS Animations collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440003", "user_123", []string{"550e8400-e29b-41d4-a716-446655440002"},
			"Fade In Animation",
			`@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}`,
			[]string{"750e8400-e29b-41d4-a716-446655440005", "750e8400-e29b-41d4-a716-446655440006", "750e8400-e29b-41d4-a716-446655440007"}, true, true, 1, nil,
			parseTime("2024-01-20 14:25:00"), parseTime("2024-01-20 14:25:00"),
		},
		// Python Scripts collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440004", "user_456", []string{"550e8400-e29b-41d4-a716-446655440003"},
			"File Renamer",
			`import os
import re

def rename_files(directory, pattern, replacement):
    """Rename files in directory based on pattern"""
    for filename in os.listdir(directory):
        if re.match(pattern, filename):
            new_name = re.sub(pattern, replacement, filename)
            os.rename(
                os.path.join(directory, filename),
                os.path.join(directory, new_name)
            )
            print(f"Renamed: {filename} -> {new_name}")`,
			[]string{"750e8400-e29b-41d4-a716-446655440008", "750e8400-e29b-41d4-a716-446655440009", "750e8400-e29b-41d4-a716-446655440002"}, true, false, 1, nil,
			parseTime("2024-02-05 16:50:00"), parseTime("2024-02-05 16:50:00"),
		},
		// React Hooks collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440005", "user_789", []string{"550e8400-e29b-41d4-a716-446655440004"},
			"Custom Hook: useLocalStorage",
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
			[]string{"750e8400-e29b-41d4-a716-446655440010", "750e8400-e29b-41d4-a716-446655440011", "750e8400-e29b-41d4-a716-446655440012"}, true, true, 1, nil,
			parseTime("2024-02-10 11:05:00"), parseTime("2024-02-10 11:05:00"),
		},
		// SQL Queries collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440006", "user_456", []string{"550e8400-e29b-41d4-a716-446655440005"},
			"Complex JOIN Query",
			`SELECT 
  u.name as user_name,
  c.name as collection_name,
  COUNT(s.id) as snippet_count
FROM users u
LEFT JOIN collections c ON u.id = c.user_id
LEFT JOIN snippets s ON c.id = ANY(s.collection_ids)
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name, c.id, c.name
ORDER BY snippet_count DESC;`,
			[]string{"750e8400-e29b-41d4-a716-446655440008"}, true, false, 2, nil,
			parseTime("2024-02-15 08:20:00"), parseTime("2024-02-15 08:20:00"),
		},
		// Docker Commands collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440007", "user_101", []string{"550e8400-e29b-41d4-a716-446655440006"},
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
    image: postgres:15
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,
			[]string{"750e8400-e29b-41d4-a716-446655440009"}, true, true, 3, nil,
			parseTime("2024-02-18 12:35:00"), parseTime("2024-02-18 12:35:00"),
		},
		// TypeScript Helpers collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440008", "user_123", []string{"550e8400-e29b-41d4-a716-446655440007"},
			"Type Guard Functions",
			`type User = {
  id: string;
  name: string;
  email: string;
};

type Admin = User & {
  role: 'admin';
  permissions: string[];
};

function isAdmin(user: User | Admin): user is Admin {
  return 'role' in user && user.role === 'admin';
}

function isUser(user: User | Admin): user is User {
  return !isAdmin(user);
}`,
			[]string{"750e8400-e29b-41d4-a716-446655440001", "750e8400-e29b-41d4-a716-446655440002"}, true, false, 1, nil,
			parseTime("2024-02-25 09:50:00"), parseTime("2024-02-25 09:50:00"),
		},
		// Node.js Utilities collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440009", "user_456", []string{"550e8400-e29b-41d4-a716-446655440008"},
			"Async File Processor",
			`const fs = require('fs').promises;
const path = require('path');

async function processFiles(directory, processor) {
  const files = await fs.readdir(directory);
  const results = [];
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = await fs.stat(filePath);
    
    if (stats.isFile()) {
      const content = await fs.readFile(filePath, 'utf8');
      const result = await processor(content, file);
      results.push(result);
    }
  }
  
  return results;
}`,
			[]string{"750e8400-e29b-41d4-a716-446655440009", "750e8400-e29b-41d4-a716-446655440010"}, true, true, 1, nil,
			parseTime("2024-03-01 14:25:00"), parseTime("2024-03-01 14:25:00"),
		},
		// Vue.js Components collection snippets
		{
			"660e8400-e29b-41d4-a716-446655440010", "user_789", []string{"550e8400-e29b-41d4-a716-446655440009"},
			"Reusable Modal Component",
			`<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  title: String
});

const emit = defineEmits(['close']);

const closeModal = () => {
  emit('close');
};
</script>`,
			[]string{"750e8400-e29b-41d4-a716-446655440010"}, true, false, 2, nil,
			parseTime("2024-03-05 11:35:00"), parseTime("2024-03-05 11:35:00"),
		},
	}

	for _, s := range snippets {
		_, err := GetDB().Exec(`
					INSERT INTO snippets (id, user_id, title, content, collection_ids, tag_ids, is_public, is_favorite, fork_count, forked_from, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			s.id, s.userID, s.title, s.content, pq.Array(s.collectionIDs), pq.Array(s.tagIDs), s.isPublic, s.isFavorite, s.forkCount, s.forkedFrom, s.createdAt, s.updatedAt)

		if err != nil {
			return err
		}
		log.Printf("   ✓ Created snippet: %s", s.title)
	}

	return nil
}

// Helper function to parse time strings
func parseTime(timeStr string) time.Time {
	t, err := time.Parse("2006-01-02 15:04:05", timeStr)
	if err != nil {
		log.Printf("Warning: failed to parse time '%s': %v", timeStr, err)
		return time.Now()
	}
	return t
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}

// seedCollectionPositions inserts position data for collections
func seedCollectionPositions() error {
	positions := []struct {
		collectionID string
		userID       string
		position     int
		createdAt    time.Time
		updatedAt    time.Time
	}{
		// User 123 collections in order
		{"550e8400-e29b-41d4-a716-446655440001", "user_123", 0, parseTime("2024-01-15 10:30:00"), parseTime("2024-01-15 10:30:00")}, // JavaScript Utils
		{"550e8400-e29b-41d4-a716-446655440002", "user_123", 1, parseTime("2024-01-20 14:20:00"), parseTime("2024-02-01 09:15:00")}, // CSS Animations
		{"550e8400-e29b-41d4-a716-446655440007", "user_123", 2, parseTime("2024-02-25 09:45:00"), parseTime("2024-02-25 09:45:00")}, // TypeScript Helpers

		// User 456 collections in order
		{"550e8400-e29b-41d4-a716-446655440003", "user_456", 0, parseTime("2024-02-05 16:45:00"), parseTime("2024-02-05 16:45:00")}, // Python Scripts
		{"550e8400-e29b-41d4-a716-446655440005", "user_456", 1, parseTime("2024-02-15 08:15:00"), parseTime("2024-02-20 17:00:00")}, // SQL Queries
		{"550e8400-e29b-41d4-a716-446655440008", "user_456", 2, parseTime("2024-03-01 14:20:00"), parseTime("2024-03-01 14:20:00")}, // Node.js Utilities

		// User 789 collections in order
		{"550e8400-e29b-41d4-a716-446655440004", "user_789", 0, parseTime("2024-02-10 11:00:00"), parseTime("2024-02-12 13:30:00")}, // React Hooks
		{"550e8400-e29b-41d4-a716-446655440009", "user_789", 1, parseTime("2024-03-05 11:30:00"), parseTime("2024-03-05 11:30:00")}, // Vue.js Components

		// User 101 collections in order
		{"550e8400-e29b-41d4-a716-446655440006", "user_101", 0, parseTime("2024-02-18 12:30:00"), parseTime("2024-02-18 12:30:00")}, // Docker Commands
		{"550e8400-e29b-41d4-a716-446655440010", "user_101", 1, parseTime("2024-03-10 16:15:00"), parseTime("2024-03-10 16:15:00")}, // Git Workflows
	}

	for _, p := range positions {
		_, err := GetDB().Exec(`
			INSERT INTO collection_positions (collection_id, user_id, position, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5)`,
			p.collectionID, p.userID, p.position, p.createdAt, p.updatedAt)

		if err != nil {
			return err
		}
		log.Printf("   ✓ Created collection position: %s for user %s at position %d", p.collectionID, p.userID, p.position)
	}

	return nil
}

// seedCollectionSnippetPositions inserts position data for snippets within collections
func seedCollectionSnippetPositions() error {
	positions := []struct {
		collectionID string
		snippetID    string
		userID       string
		position     int
		createdAt    time.Time
		updatedAt    time.Time
	}{
		// JavaScript Utils collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440001", "user_123", 0, parseTime("2024-01-15 10:35:00"), parseTime("2024-01-15 10:35:00")}, // Debounce Function
		{"550e8400-e29b-41d4-a716-446655440001", "660e8400-e29b-41d4-a716-446655440002", "user_123", 1, parseTime("2024-01-16 11:20:00"), parseTime("2024-01-16 11:20:00")}, // Array Shuffle

		// CSS Animations collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440002", "660e8400-e29b-41d4-a716-446655440003", "user_123", 0, parseTime("2024-01-20 14:25:00"), parseTime("2024-01-20 14:25:00")}, // Fade In Animation

		// Python Scripts collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440003", "660e8400-e29b-41d4-a716-446655440004", "user_456", 0, parseTime("2024-02-05 16:50:00"), parseTime("2024-02-05 16:50:00")}, // File Renamer

		// React Hooks collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440004", "660e8400-e29b-41d4-a716-446655440005", "user_789", 0, parseTime("2024-02-10 11:05:00"), parseTime("2024-02-10 11:05:00")}, // Custom Hook: useLocalStorage

		// SQL Queries collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440005", "660e8400-e29b-41d4-a716-446655440006", "user_456", 0, parseTime("2024-02-15 08:20:00"), parseTime("2024-02-15 08:20:00")}, // Complex JOIN Query

		// Docker Commands collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440006", "660e8400-e29b-41d4-a716-446655440007", "user_101", 0, parseTime("2024-02-18 12:35:00"), parseTime("2024-02-18 12:35:00")}, // Docker Compose Setup

		// TypeScript Helpers collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440007", "660e8400-e29b-41d4-a716-446655440008", "user_123", 0, parseTime("2024-02-25 09:50:00"), parseTime("2024-02-25 09:50:00")}, // Type Guard Functions

		// Node.js Utilities collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440008", "660e8400-e29b-41d4-a716-446655440009", "user_456", 0, parseTime("2024-03-01 14:25:00"), parseTime("2024-03-01 14:25:00")}, // Async File Processor

		// Vue.js Components collection snippets in order
		{"550e8400-e29b-41d4-a716-446655440009", "660e8400-e29b-41d4-a716-446655440010", "user_789", 0, parseTime("2024-03-05 11:35:00"), parseTime("2024-03-05 11:35:00")}, // Reusable Modal Component
	}

	for _, p := range positions {
		_, err := GetDB().Exec(`
			INSERT INTO collection_snippet_positions (collection_id, snippet_id, user_id, position, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6)`,
			p.collectionID, p.snippetID, p.userID, p.position, p.createdAt, p.updatedAt)

		if err != nil {
			return err
		}
		log.Printf("   ✓ Created snippet position: %s in collection %s for user %s at position %d", p.snippetID, p.collectionID, p.userID, p.position)
	}

	return nil
}
