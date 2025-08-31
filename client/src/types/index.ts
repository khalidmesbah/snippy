export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  content: string;
  collection_ids: string[];
  tag_ids: string[];
  tag_names?: string[];
  is_public: boolean;
  is_favorite: boolean;

  fork_count: number;
  forked_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface CreateSnippetRequest {
  title: string;
  content: string;
  tag_ids: string[];
  is_public: boolean;
  is_favorite: boolean;
  collection_ids: string[];
}

export interface CreateTagRequest {
  name: string;
  color: string;
}

export interface CreateCollectionRequest {
  name: string;
  color: string;
}

// Form types
export interface SnippetFormData {
  title: string;
  collectionIds: string[];
  tagIds: string[];
  isPublic: boolean;
  isFavorite: boolean;
  content: string;
}
