# Project Roadmap

## Current Status

Snippy is a functional code snippet management platform with core features implemented:
- ✅ User authentication (Clerk)
- ✅ Snippet CRUD operations
- ✅ Collections system with drag-and-drop ordering
- ✅ Public snippet sharing and forking
- ✅ Search functionality
- ✅ Responsive UI with shadcn/ui components

## Upcoming Features

### High Priority

#### 1. User Profiles System
**Goal**: Allow users to create public profiles and share their work

**Tasks**:
- [ ] Create profile schema and database table
- [ ] Implement `GET /api/profile/{username}` endpoint
- [ ] Ensure unique usernames across platform
- [ ] Build profile page UI component
- [ ] Add privacy controls for profile visibility
- [ ] Allow users to customize what profile information is public
- [ ] Enable anonymous users to view public profiles

**Database Schema**:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  is_public BOOLEAN DEFAULT false,
  show_snippets BOOLEAN DEFAULT true,
  show_collections BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2. Testing Infrastructure
**Goal**: Implement comprehensive testing across the application

**Frontend Testing**:
- [ ] Unit tests for utility functions
- [ ] Component testing with React Testing Library
- [ ] Integration tests for API calls
- [ ] E2E tests for critical user flows

**Backend Testing**:
- [ ] Unit tests for handlers and business logic
- [ ] Integration tests for database operations
- [ ] API endpoint testing
- [ ] Authentication flow testing

#### 3. Enhanced Tag Management
**Goal**: Improve tag system with better UX

**Tasks**:
- [ ] Remove tags array from snippets table (use separate tags table)
- [ ] Create dedicated tag management UI
- [ ] Implement tag creation, editing, and deletion
- [ ] Add tag color customization
- [ ] Implement tag-based filtering and search
- [ ] Add tag usage statistics

### Medium Priority

#### 4. State Management Improvements
**Goal**: Implement Zustand for better client-side state management

**Tasks**:
- [ ] Replace local state with Zustand stores
- [ ] Implement persistent state for user preferences
- [ ] Add optimistic updates for better UX
- [ ] Centralize API state management

#### 5. Enhanced Notifications
**Goal**: Implement comprehensive notification system using Sonner

**Tasks**:
- [ ] Replace existing toast system with Sonner
- [ ] Add success, error, and info notifications
- [ ] Implement notification persistence
- [ ] Add notification preferences

#### 6. Advanced Snippet Features
**Goal**: Enhance snippet functionality

**Tasks**:
- [ ] Implement snippet versioning
- [ ] Add snippet templates
- [ ] Enable snippet collaboration
- [ ] Add snippet analytics (views, forks)
- [ ] Implement snippet bookmarking by other users

### Low Priority

#### 7. Performance Optimizations
**Goal**: Improve application performance

**Tasks**:
- [ ] Implement virtual scrolling for large lists
- [ ] Add image optimization and lazy loading
- [ ] Implement service worker for offline functionality
- [ ] Add database query optimization
- [ ] Implement caching strategies

#### 8. Advanced Search
**Goal**: Enhance search capabilities

**Tasks**:
- [ ] Implement full-text search with PostgreSQL
- [ ] Add search filters (language, date, author)
- [ ] Implement search suggestions
- [ ] Add search history
- [ ] Enable saved searches

#### 9. Social Features
**Goal**: Add community and social aspects

**Tasks**:
- [ ] Implement user following system
- [ ] Add snippet comments and discussions
- [ ] Create community snippet collections
- [ ] Add snippet rating system
- [ ] Implement trending snippets

## Technical Debt

### Code Quality
- [ ] Add comprehensive ESLint rules
- [ ] Implement consistent error handling patterns
- [ ] Add API rate limiting
- [ ] Implement proper logging system
- [ ] Add security headers and CSRF protection

### Documentation
- [ ] Add inline code documentation
- [ ] Create component documentation with Storybook
- [ ] Add API documentation with OpenAPI/Swagger
- [ ] Create deployment guides
- [ ] Add troubleshooting guides

### Infrastructure
- [ ] Set up CI/CD pipeline
- [ ] Add automated testing in CI
- [ ] Implement database backup strategy
- [ ] Add monitoring and alerting
- [ ] Set up staging environment

## Future Considerations

### Integrations
- [ ] GitHub integration for snippet sync
- [ ] VS Code extension
- [ ] CLI tool for snippet management
- [ ] API webhooks for external integrations

### Advanced Features
- [ ] AI-powered snippet suggestions
- [ ] Code execution sandbox
- [ ] Snippet dependency management
- [ ] Multi-language snippet support
- [ ] Advanced collaboration tools

## Development Guidelines

### Always Use
- **shadcn/ui** components for consistent UI
- **Tailwind CSS** for styling
- **TypeScript** for type safety
- **Biome** for code formatting and linting

### Keep Updated
- API documentation when schemas change
- Database migrations for all schema changes
- Tests for new features and bug fixes
- This roadmap as priorities shift
