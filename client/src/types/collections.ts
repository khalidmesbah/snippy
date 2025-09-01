export interface Collection {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  snippet_count?: number; // For display purposes
}

export interface CollectionSnippetPosition {
  id: string;
  collection_id: string;
  snippet_id: string;
  user_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionPosition {
  id: string;
  collection_id: string;
  user_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface FavoritesCollection extends Omit<Collection, "id"> {
  id: "favorites";
  name: "Favorites";
  is_virtual: true;
}

// Request/Response types for API calls
export interface CreateCollectionRequest {
  name: string;
  color: string;
}

export interface UpdateCollectionRequest {
  name?: string;
  color?: string;
}

export interface UpdatePositionsRequest {
  positions: Array<{
    id: string;
    position: number;
  }>;
}

export interface CollectionWithSnippets extends Collection {
  snippets: Array<{
    id: string;
    title: string;
    content: string;
    position: number;
    is_favorite: boolean;
    created_at: string;
  }>;
}
