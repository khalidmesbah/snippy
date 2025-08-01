"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { SnippetEditor } from "@/components/snippet-editor"
import { DraggableSnippetList } from "@/components/draggable-snippet-list"
import { useStore } from "@/lib/store"
import type { Snippet } from "@/lib/store"

export default function CollectionPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string

  const {
    getSnippetsForCollection,
    getSortedCollections,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    reorderSnippets,
    initializeGuestData,
  } = useStore()

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | undefined>()

  useEffect(() => {
    initializeGuestData()
  }, [initializeGuestData])

  const collections = getSortedCollections()
  const collection = collections.find((c) => c.id === collectionId)
  const collectionSnippets = getSnippetsForCollection(collectionId).sort((a, b) => a.position - b.position)

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Collection not found</h1>
          <Button onClick={() => router.push("/library")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

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

  const handleReorder = (snippetIds: string[]) => {
    reorderSnippets(collectionId, snippetIds)
  }

  const handleSave = (snippetData: Partial<Snippet>) => {
    if (editingSnippet) {
      updateSnippet(editingSnippet.id, snippetData)
    } else {
      addSnippet({
        ...snippetData,
        collection_id: collectionId,
        position: collectionSnippets.length,
      } as Omit<Snippet, "id" | "user_id" | "created_at" | "updated_at">)
    }
    setEditingSnippet(undefined)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/library")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: collection.color }}
          >
            <span className="text-white font-bold text-sm">{collection.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            <p className="text-muted-foreground">
              {collectionSnippets.length} snippet{collectionSnippets.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Snippet
          </Button>
        </div>
      </div>

      {collectionSnippets.length > 0 ? (
        <div className="max-w-2xl">
          <DraggableSnippetList
            snippets={collectionSnippets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onReorder={handleReorder}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: collection.color + "20" }}
          >
            <Plus className="h-8 w-8" style={{ color: collection.color }} />
          </div>
          <h3 className="text-lg font-semibold mb-2">No snippets yet</h3>
          <p className="text-muted-foreground mb-4">
            Start building your {collection.name} collection by adding your first snippet.
          </p>
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Snippet
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
        defaultCollectionId={collectionId}
      />
    </div>
  )
}
