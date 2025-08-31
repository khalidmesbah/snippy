# Server Essentials

## Collections Feature Architecture

The Collections Feature implements a comprehensive system for organizing code snippets into user-defined collections with drag-and-drop ordering capabilities.

### Key Components

1. **Database Schema**: Position management tables for ordering
2. **API Endpoints**: CRUD operations with position management
3. **Frontend Components**: React components with dnd-kit integration
4. **Virtual Favorites Collection**: Dynamic collection for favorited snippets

## Endpoints

### Snippets

- GET /api/snippets: get all snippets by a user
- GET /api/snippets/public : get all public snippets
- GET /api/snippets/public/user : get all public snippets by a user
- GET /api/snippets/{id} : get snippet by id
- POST /api/snippets/create : create snippet
- POST /api/snippets/fork : fork snippet
- PUT /api/snippets/{id} : update snippet
- DELETE /api/snippets/{id} : delete snippet

### Collections

- GET /api/collections : get all collections by a user (ordered by position)
- POST /api/collections/create : create collection
- GET /api/collections/{id} : get specific collection
- PUT /api/collections/{id} : update collection
- DELETE /api/collections/{id} : delete collection
- GET /api/collections/{id}/snippets : get snippets in collection (ordered by position)

### Position Management

- PUT /api/collections/positions : update collection positions for user
- PUT /api/collections/{id}/snippets/positions : update snippet positions in collection

### Tags

- GET /api/tags : get all tags by a user
- POST /api/tags/create : create tag
- PUT /api/tags/{id} : update tag
- DELETE /api/tags/{id} : delete tag

## Database schema

### Snippets

```sql
CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  collection_ids UUID[] DEFAULT '{}',
  tag_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  fork_count INT DEFAULT 0,
  forked_from UUID DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Collections

```sql
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, name)
);
```

### Position Management Tables

#### Collection Snippet Positions
```sql
CREATE TABLE IF NOT EXISTS collection_snippet_positions (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  snippet_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(collection_id, snippet_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);
```

#### Collection Positions
```sql
CREATE TABLE IF NOT EXISTS collection_positions (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(collection_id, user_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);
```

### Tags

```sql
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, name)
);
```

## Frontend Architecture

### Key Components

1. **Routes**:
   - `/collections` - Collections grid page
   - `/collections/$id` - Collection detail page with snippets

2. **Components**:
   - `CollectionCard` - Individual collection display with drag handle
   - `CollectionsGrid` - Sortable grid with dnd-kit integration
   - `SnippetCard` - Individual snippet display with drag handle
   - `SnippetsGrid` - Sortable grid with multi-select and bulk operations
   - `CollectionHeader` - Collection info and action buttons
   - `SearchFilter` - Search and filter functionality

3. **Dialogs**:
   - `CreateCollectionDialog` - Create new collections
   - `EditCollectionDialog` - Edit collection properties
   - `DeleteCollectionDialog` - Delete with confirmation

### Virtual Favorites Collection

The frontend implements a virtual "Favorites" collection that:

- Is dynamically generated from `snippets.is_favorite = true`
- Always appears first in the collections list
- Has special styling (heart icon, red theme)
- Cannot be edited or deleted
- Is excluded from position management updates
- Shows count of favorited snippets

### Drag and Drop Implementation

- Uses `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Optimistic UI updates with rollback on error
- Position updates sent to API in bulk
- Virtual favorites collection excluded from sorting

### State Management

- TanStack Query for server state
- React state for UI interactions
- Optimistic updates for better UX
- Error handling with rollback

### Keyboard Navigation

- Arrow keys for navigation
- Enter to open items
- Escape to cancel actions
- Ctrl/Cmd + A for select all
- Ctrl/Cmd + M for toggle select mode
- F for toggle favorite
- Delete for bulk delete

## Implementation Notes

### Position Management

- Positions are zero-indexed integers
- Lower numbers appear first in UI
- Bulk updates for better performance
- Optimistic updates with error rollback
- Virtual favorites collection excluded

### Error Handling

- API errors trigger UI rollback
- Loading states for all async operations
- User-friendly error messages
- Graceful degradation

### Performance Considerations

- Debounced search (300ms)
- Optimistic updates
- Bulk position updates
- Efficient re-rendering with React.memo
- Lazy loading for large lists

### Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support

## Troubleshooting

### Common Issues

1. **Migration Errors**: Use `./scripts/migrate-with-env.sh` for automatic DATABASE_URL
2. **Position Sync Issues**: Check for virtual favorites collection exclusion
3. **Drag and Drop Not Working**: Verify dnd-kit installation and configuration
4. **TypeScript Errors**: Ensure all types are properly imported and defined

### Database Issues

- Run `./scripts/migrate-with-env.sh schema` to check table structure
- Verify position tables exist and have correct constraints
- Check for foreign key relationships

### Frontend Issues

- Verify all required dependencies are installed
- Check browser console for JavaScript errors
- Ensure API endpoints are accessible
- Verify authentication is working
