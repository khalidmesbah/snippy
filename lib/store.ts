"use client"

import { create } from "zustand"
import { subscribeWithSelector, persist } from "zustand/middleware"

export interface Snippet {
  id: string
  user_id: string
  collection_id?: string
  title: string
  content: string
  language: string
  is_public: boolean
  is_favorite: boolean
  position: number
  fork_count: number
  forked_from?: string
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

interface StoreState {
  snippets: Snippet[]
  collections: Collection[]
  currentUserId: string | null
  loading: boolean

  // Actions
  setLoading: (loading: boolean) => void
  setCurrentUser: (userId: string | null) => void
  addSnippet: (snippet: Omit<Snippet, "id" | "user_id" | "created_at" | "updated_at">) => void
  updateSnippet: (id: string, updates: Partial<Snippet>) => void
  deleteSnippet: (id: string) => void
  forkSnippet: (snippet: Snippet) => void
  hasForkedSnippet: (snippetId: string, originalUserId: string) => boolean
  addCollection: (collection: Omit<Collection, "id" | "user_id" | "created_at" | "updated_at">) => void
  updateCollection: (id: string, updates: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  reorderSnippets: (collectionId: string | undefined, snippetIds: string[]) => void
  findSnippet: (id: string) => Snippet | null
  getUserSnippets: (userId?: string) => Snippet[]
  getPublicSnippets: () => Snippet[]
  getFavoriteSnippets: (userId?: string) => Snippet[]
  getSnippetsForCollection: (collectionId: string, userId?: string) => Snippet[]
  getSortedCollections: (userId?: string) => Collection[]
  getAllSnippets: () => Snippet[]
  initializeGuestData: () => void
  findSnippetByIdAndUser: (id: string, userId: string) => Snippet | null
}

const FAVORITES_COLLECTION_ID = "favorites"

// Generate UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const createFavoritesCollection = (userId: string): Collection => ({
  id: FAVORITES_COLLECTION_ID,
  user_id: userId,
  name: "Favorites",
  color: "#EF4444",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

// Guest mode collections (no snippets)
const guestCollections: Collection[] = [
  {
    id: "guest-js",
    user_id: "guest",
    name: "JavaScript",
    color: "#F7DF1E",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "guest-css",
    user_id: "guest",
    name: "CSS",
    color: "#1572B6",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "guest-python",
    user_id: "guest",
    name: "Python",
    color: "#3776AB",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

export const useStore = create<StoreState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      snippets: [], // Start with empty snippets array
      collections: [],
      currentUserId: null,
      loading: false,

      setLoading: (loading) => set({ loading }),

      setCurrentUser: (userId) => {
        set({ currentUserId: userId })

        // Create favorites collection for any user (including signed-in users)
        if (userId) {
          const { collections } = get()
          const userFavoritesCollection = collections.find(
            (c) => c.id === FAVORITES_COLLECTION_ID && c.user_id === userId,
          )

          if (!userFavoritesCollection) {
            const favoritesCollection = createFavoritesCollection(userId)
            set((state) => ({
              collections: [...state.collections, favoritesCollection],
            }))
          }
        }
      },

      getUserSnippets: (userId) => {
        const { snippets, currentUserId } = get()
        const targetUserId = userId || currentUserId || "guest"
        return snippets.filter((s) => s.user_id === targetUserId)
      },

      getFavoriteSnippets: (userId) => {
        const { snippets, currentUserId } = get()
        const targetUserId = userId || currentUserId || "guest"
        return snippets.filter((s) => s.user_id === targetUserId && s.is_favorite)
      },

      getSnippetsForCollection: (collectionId, userId) => {
        const { snippets, currentUserId } = get()
        const targetUserId = userId || currentUserId || "guest"

        if (collectionId === FAVORITES_COLLECTION_ID) {
          return snippets.filter((s) => s.user_id === targetUserId && s.is_favorite)
        }

        return snippets.filter((s) => s.user_id === targetUserId && s.collection_id === collectionId)
      },

      getSortedCollections: (userId) => {
        const { collections, currentUserId } = get()
        const targetUserId = userId || currentUserId || "guest"

        return collections
          .filter((c) => c.user_id === targetUserId)
          .sort((a, b) => {
            // Favorites collection always first
            if (a.id === FAVORITES_COLLECTION_ID) return -1
            if (b.id === FAVORITES_COLLECTION_ID) return 1
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          })
      },

      getPublicSnippets: () => {
        const { snippets } = get()
        // Return ALL public snippets from all users
        return snippets.filter((s) => s.is_public)
      },

      getAllSnippets: () => {
        const { snippets } = get()
        return snippets
      },

      hasForkedSnippet: (snippetId, originalUserId) => {
        const { snippets, currentUserId } = get()
        const userId = currentUserId || "guest"

        if (userId === originalUserId) {
          return true // Can't fork own snippets
        }

        // Check if user actually has a forked version of this snippet
        // Look for snippets that are forked from the original and belong to current user
        const forkedSnippet = snippets.find(
          (s) => s.user_id === userId && s.forked_from === snippetId && s.collection_id === undefined,
        )

        return !!forkedSnippet
      },

      findSnippet: (id) => {
        const { snippets } = get()
        return snippets.find((s) => s.id === id) || null
      },

      forkSnippet: (originalSnippet) => {
        const { currentUserId, hasForkedSnippet } = get()
        const userId = currentUserId || "guest"

        if (hasForkedSnippet(originalSnippet.id, originalSnippet.user_id)) {
          return
        }

        // Forked snippet goes to home page (no collection)
        const forkedSnippet: Snippet = {
          id: generateUUID(),
          user_id: userId,
          collection_id: undefined, // No collection - appears on home page
          title: `${originalSnippet.title} (Fork)`,
          content: originalSnippet.content,
          language: originalSnippet.language, // Preserve original language
          is_public: false, // Forked snippets are private by default
          is_favorite: false,
          position: 0,
          fork_count: 0,
          forked_from: originalSnippet.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        set((state) => ({
          snippets: [
            forkedSnippet,
            ...state.snippets.map((s) =>
              s.id === originalSnippet.id && s.user_id === originalSnippet.user_id
                ? { ...s, fork_count: s.fork_count + 1 }
                : s,
            ),
          ],
        }))
      },

      addSnippet: (snippetData) => {
        const { currentUserId } = get()
        const userId = currentUserId || "guest"

        const newSnippet: Snippet = {
          ...snippetData,
          id: generateUUID(),
          user_id: userId,
          fork_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        set((state) => ({
          snippets: [newSnippet, ...state.snippets],
        }))
      },

      updateSnippet: (id, updates) => {
        set((state) => ({
          snippets: state.snippets.map((snippet) =>
            snippet.id === id ? { ...snippet, ...updates, updated_at: new Date().toISOString() } : snippet,
          ),
        }))
      },

      deleteSnippet: (id) => {
        set((state) => {
          const snippetToDelete = state.snippets.find((s) => s.id === id)

          // If deleting a forked snippet, decrease the fork count of the original
          if (snippetToDelete?.forked_from) {
            return {
              snippets: state.snippets
                .filter((snippet) => snippet.id !== id)
                .map((snippet) =>
                  snippet.id === snippetToDelete.forked_from
                    ? { ...snippet, fork_count: Math.max(0, snippet.fork_count - 1) }
                    : snippet,
                ),
            }
          }

          return {
            snippets: state.snippets.filter((snippet) => snippet.id !== id),
          }
        })
      },

      addCollection: (collectionData) => {
        const { currentUserId } = get()
        const newCollection: Collection = {
          ...collectionData,
          id: generateUUID(),
          user_id: currentUserId || "guest",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        set((state) => ({
          collections: [...state.collections, newCollection],
        }))
      },

      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === id ? { ...collection, ...updates, updated_at: new Date().toISOString() } : collection,
          ),
        }))
      },

      deleteCollection: (id) => {
        if (id === FAVORITES_COLLECTION_ID) return // Prevent deleting favorites collection

        set((state) => ({
          collections: state.collections.filter((collection) => collection.id !== id),
          snippets: state.snippets.map((snippet) =>
            snippet.collection_id === id ? { ...snippet, collection_id: undefined } : snippet,
          ),
        }))
      },

      reorderSnippets: (collectionId, snippetIds) => {
        set((state) => ({
          snippets: state.snippets.map((snippet) => {
            if (snippet.collection_id === collectionId) {
              const newPosition = snippetIds.indexOf(snippet.id)
              return newPosition !== -1 ? { ...snippet, position: newPosition } : snippet
            }
            return snippet
          }),
        }))
      },

      initializeGuestData: () => {
        const { snippets, collections, currentUserId } = get()

        // Only initialize for guest mode and only add collections (no snippets)
        if (currentUserId === null && collections.length === 0) {
          const guestFavoritesCollection = createFavoritesCollection("guest")

          set({
            collections: [guestFavoritesCollection, ...guestCollections],
            snippets: [], // Keep snippets empty
          })
        }
      },

      findSnippetByIdAndUser: (id: string, userId: string) => {
        const { snippets } = get()
        return snippets.find((s) => s.id === id && s.user_id === userId) || null
      },
    })),
    {
      name: "snippy-store",
      partialize: (state) => ({
        snippets: state.snippets,
        collections: state.collections,
      }),
    },
  ),
)
