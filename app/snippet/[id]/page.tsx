"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Edit, GitFork, Heart, Share, Trash2, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SnippetEditor } from "@/components/snippet-editor"
import { CodeBlock } from "@/components/code-block"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Snippet } from "@/lib/store"

export default function SnippetPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const snippetId = params.id as string

  const {
    findSnippet,
    findSnippetByIdAndUser,
    updateSnippet,
    deleteSnippet,
    forkSnippet,
    getSortedCollections,
    currentUserId,
    initializeGuestData,
    getUserSnippets,
    hasForkedSnippet,
  } = useStore()

  const [snippet, setSnippet] = useState<Snippet | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    initializeGuestData()

    let foundSnippet: Snippet | null = null

    // Try to find by ID
    foundSnippet = findSnippet(snippetId)

    // If not found, try to find by ID and specific user ID (for shared links)
    if (!foundSnippet) {
      const sharedUserId = searchParams.get("user")
      if (sharedUserId) {
        foundSnippet = findSnippetByIdAndUser(snippetId, sharedUserId)
      }
    }

    // If still not found, search all public snippets
    if (!foundSnippet) {
      const allSnippets = getUserSnippets()
      foundSnippet = allSnippets.find((s: Snippet) => s.id === snippetId && s.is_public) || null
    }

    setSnippet(foundSnippet)
  }, [snippetId, findSnippet, findSnippetByIdAndUser, initializeGuestData, searchParams, getUserSnippets])

  if (!snippet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Snippet not found</h1>
          <p className="text-muted-foreground">This snippet may be private or no longer exists.</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const collections = getSortedCollections()
  const collection = snippet.collection_id ? collections.find((c) => c.id === snippet.collection_id) : null
  const isOwner = snippet.user_id === currentUserId || (snippet.user_id === "guest" && currentUserId === null)
  const canFork = !isOwner && snippet.is_public
  const isForked = hasForkedSnippet(snippet.id, snippet.user_id)

  const shareSnippet = async () => {
    try {
      const shareUrl = snippet.is_public ? `${window.location.origin}/snippet/${snippet.id}` : window.location.href

      if (navigator.share) {
        await navigator.share({
          title: snippet.title,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch (error) {
      console.error("Failed to share:", error)
    }
  }

  const handleFork = () => {
    forkSnippet(snippet)
    setSnippet((prev) => (prev ? { ...prev, fork_count: prev.fork_count + 1 } : null))
  }

  const toggleFavorite = () => {
    const newFavoriteState = !snippet.is_favorite
    updateSnippet(snippet.id, { is_favorite: newFavoriteState })
    setSnippet({ ...snippet, is_favorite: newFavoriteState })
  }

  const handleDelete = () => {
    deleteSnippet(snippet.id)
    router.push("/")
  }

  const handleSave = (updates: Partial<Snippet>) => {
    updateSnippet(snippet.id, updates)
    setSnippet({ ...snippet, ...updates })
  }

  const getUserName = (userId: string) => {
    if (userId === "guest") return "Guest"
    return `User ${userId.slice(0, 8)}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {snippet.is_public && (
              <Button variant="outline" size="sm" onClick={shareSnippet}>
                <Share className="w-4 h-4 mr-2" />
                {shared ? "Copied!" : "Share"}
              </Button>
            )}

            {canFork && (
              <Button variant="outline" size="sm" onClick={handleFork} disabled={isForked}>
                {isForked ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Forked
                  </>
                ) : (
                  <>
                    <GitFork className="w-4 h-4 mr-2" />
                    Fork
                  </>
                )}
              </Button>
            )}

            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Code Block with Syntax Highlighting */}
        <CodeBlock code={snippet.content} language={snippet.language} title={snippet.title} />

        <div className="my-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span>by {getUserName(snippet.user_id)}</span>
            <span>{new Date(snippet.created_at).toLocaleDateString()}</span>
            {collection && (
              <Badge variant="outline" className="gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: collection.color }} />
                {collection.name}
              </Badge>
            )}
            {!collection && snippet.collection_id === undefined && <Badge variant="outline">No Collection</Badge>}
            {snippet.fork_count > 0 && (
              <div className="flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                <span>{snippet.fork_count} forks</span>
              </div>
            )}
            {snippet.is_public && <Badge variant="secondary">Public</Badge>}
            {snippet.forked_from && <Badge variant="outline">Forked</Badge>}
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                className={cn(snippet.is_favorite ? "text-red-500" : "text-muted-foreground", "ml-auto")}
              >
                <Heart className={cn("w-4 h-4 mr-2", snippet.is_favorite && "fill-current")} />
                {snippet.is_favorite ? "Favorited" : "Favorite"}
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        {snippet.updated_at !== snippet.created_at && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Last updated {new Date(snippet.updated_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isOwner && (
        <SnippetEditor
          snippet={snippet}
          collections={collections}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
