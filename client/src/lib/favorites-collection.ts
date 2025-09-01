import type { Collection, FavoritesCollection } from "@/types/collections";

/**
 * Generate a virtual favorites collection
 */
export function createFavoritesCollection(): FavoritesCollection {
  return {
    id: "favorites",
    user_id: "", // Will be set by the caller
    name: "Favorites",
    color: "#ef4444", // Red color for favorites
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    snippet_count: 0, // Will be calculated
    is_virtual: true,
  };
}

/**
 * Check if a collection is the favorites collection
 */
export function isFavoritesCollection(
  collection: Collection | FavoritesCollection,
): boolean {
  return collection.id === "favorites";
}

/**
 * Get the count of favorited snippets from a list of snippets
 */
export function getFavoritedSnippetsCount(
  snippets: Array<{ is_favorite: boolean }>,
): number {
  return snippets.filter((snippet) => snippet.is_favorite).length;
}

/**
 * Filter snippets to only show favorited ones
 */
export function getFavoritedSnippets<T extends { is_favorite: boolean }>(
  snippets: T[],
): T[] {
  return snippets.filter((snippet) => snippet.is_favorite);
}

/**
 * Add favorites collection to a list of collections
 */
export function addFavoritesCollectionToCollections(
  collections: Collection[],
  favoritedSnippetsCount: number,
  userId: string,
): (Collection | FavoritesCollection)[] {
  const favoritesCollection = createFavoritesCollection();
  favoritesCollection.user_id = userId;
  favoritesCollection.snippet_count = favoritedSnippetsCount;

  return [favoritesCollection, ...collections];
}

/**
 * Sort collections with favorites always first, then by position or creation date
 */
export function sortCollectionsWithFavorites(
  collections: (Collection | FavoritesCollection)[],
  positions?: Array<{ id: string; position: number }>,
): (Collection | FavoritesCollection)[] {
  // Separate favorites from regular collections
  const favorites = collections.find((c) => isFavoritesCollection(c));
  const regularCollections = collections.filter(
    (c) => !isFavoritesCollection(c),
  );

  // Sort regular collections by position or creation date
  const sortedRegularCollections = [...regularCollections];

  if (positions && positions.length > 0) {
    // Sort by positions
    sortedRegularCollections.sort((a, b) => {
      const posA = positions.find((p) => p.id === a.id)?.position ?? 0;
      const posB = positions.find((p) => p.id === b.id)?.position ?? 0;
      return posA - posB;
    });
  } else {
    // Sort by creation date (newest first)
    sortedRegularCollections.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  // Return favorites first, then sorted regular collections
  return favorites
    ? [favorites, ...sortedRegularCollections]
    : sortedRegularCollections;
}
