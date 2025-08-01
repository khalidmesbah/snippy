"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/search-bar"
import { SnippetCard } from "@/components/snippet-card"
import { SnippetEditor } from "@/components/snippet-editor"
import { useAuth } from "@/components/auth-provider"
import { useStore } from "@/lib/store"
import type { Snippet } from "@/lib/store"

export default function HomePage() {
  const { user } = useAuth()
  const {
    getUserSnippets,
    getSortedCollections,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    initializeGuestData,
    currentUserId,
    loading,
    setLoading,
  } = useStore()

  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | undefined>()

  useEffect(() => {
    setLoading(true)
    if (!user) {
      initializeGuestData()
    }
    setLoading(false)
  }, [user, initializeGuestData, setLoading])

  useEffect(() => {
    // Get ALL user snippets (regardless of collection) - this includes forked snippets
    const allUserSnippets = getUserSnippets()
    console.log("All user snippets:", allUserSnippets.length)
    console.log("Forked snippets:", allUserSnippets.filter((s) => s.forked_from).length)

    allUserSnippets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setFilteredSnippets(allUserSnippets)
  }, [getUserSnippets, currentUserId])

  const handleSearch = (query: string) => {
    const allUserSnippets = getUserSnippets()

    if (!query.trim()) {
      setFilteredSnippets(allUserSnippets)
      return
    }

    const filtered = allUserSnippets.filter(
      (snippet) =>
        snippet.title.toLowerCase().includes(query.toLowerCase()) ||
        snippet.content.toLowerCase().includes(query.toLowerCase()),
    )
    setFilteredSnippets(filtered)
  }

  const handleSort = (sort: string) => {
    const sorted = [...filteredSnippets].sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
    setFilteredSnippets(sorted)
  }

  const handleShuffle = () => {
    const shuffled = [...filteredSnippets].sort(() => Math.random() - 0.5)
    setFilteredSnippets(shuffled)
  }

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setIsEditorOpen(true)
  }

  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    setFilteredSnippets((prev) =>
      prev.map((snippet) => (snippet.id === id ? { ...snippet, is_favorite: isFavorite } : snippet)),
    )
    updateSnippet(id, { is_favorite: isFavorite })
  }

  const handleSave = (snippetData: Partial<Snippet>) => {
    if (editingSnippet) {
      updateSnippet(editingSnippet.id, snippetData)
      setFilteredSnippets((prev) =>
        prev.map((snippet) =>
          snippet.id === editingSnippet.id
            ? { ...snippet, ...snippetData, updated_at: new Date().toISOString() }
            : snippet,
        ),
      )
    } else {
      addSnippet({
        ...snippetData,
        position: 0,
      } as Omit<Snippet, "id" | "user_id" | "created_at" | "updated_at">)

      const allUserSnippets = getUserSnippets()
      allUserSnippets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setFilteredSnippets(allUserSnippets)
    }
    setEditingSnippet(undefined)
  }

  const handleDelete = (id: string) => {
    setFilteredSnippets((prev) => prev.filter((snippet) => snippet.id !== id))
    deleteSnippet(id)
  }

  const userSnippets = getUserSnippets()
  const publicSnippetCount = userSnippets.filter((s) => s.is_public).length
  const favoriteSnippetCount = userSnippets.filter((s) => s.is_favorite).length
  const forkedSnippetCount = userSnippets.filter((s) => s.forked_from).length
  const collections = getSortedCollections()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading your snippets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              My <span className="text-primary">Snippets</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {user
                ? `All your snippets • ${userSnippets.length} total (${publicSnippetCount} public, ${favoriteSnippetCount} favorites, ${forkedSnippetCount} forked)`
                : `All your snippets • ${userSnippets.length} snippets in guest mode (${forkedSnippetCount} forked)`}
            </p>
          </div>
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Snippet
          </Button>
        </div>

        <SearchBar
          onSearch={handleSearch}
          onSort={handleSort}
          onShuffle={handleShuffle}
          placeholder="Search all your snippets..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSnippets.map((snippet) => (
          <SnippetCard
            key={`snippet-${snippet.id}`}
            snippet={snippet}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {filteredSnippets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No snippets found</h3>
          <p className="text-muted-foreground mb-4">
            {userSnippets.length === 0
              ? "Create your first snippet to get started!"
              : "No snippets match your search criteria."}
          </p>
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {userSnippets.length === 0 ? "Create your first snippet" : "Create new snippet"}
          </Button>
        </div>
      )}

      <SnippetEditor
        snippet={editingSnippet}
        collections={collections}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingSnippet(undefined)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
