"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart } from "lucide-react"
import { SnippetCard } from "@/components/snippet-card"
import { SnippetEditor } from "@/components/snippet-editor"
import { useStore } from "@/lib/store"
import type { Snippet } from "@/lib/store"

export default function FavoritesPage() {
  const router = useRouter()

  const { getSnippetsForCollection, getSortedCollections, updateSnippet, deleteSnippet, initializeGuestData } =
    useStore()

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | undefined>()

  useEffect(() => {
    initializeGuestData()
  }, [initializeGuestData])

  // Get favorite snippets
  const favoriteSnippets = getSnippetsForCollection("favorites").sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setIsEditorOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteSnippet(id)
  }

  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    updateSnippet(id, { is_favorite: isFavorite })
  }

  const handleSave = (snippetData: Partial<Snippet>) => {
    if (editingSnippet) {
      updateSnippet(editingSnippet.id, snippetData)
    }
    setEditingSnippet(undefined)
  }

  const collections = getSortedCollections()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/library")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <Heart className="h-5 w-5 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Favorites</h1>
            <p className="text-muted-foreground">
              {favoriteSnippets.length} favorite snippet{favoriteSnippets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favoriteSnippets.map((snippet) => (
          <SnippetCard
            key={snippet.id}
            snippet={snippet}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {favoriteSnippets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-4">
            Mark snippets as favorites by clicking the heart icon to see them here.
          </p>
          <Button onClick={() => router.push("/")}>Browse Snippets</Button>
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
