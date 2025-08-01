"use client"

import { useState, useEffect } from "react"
import { SearchBar } from "@/components/search-bar"
import { Button } from "@/components/ui/button"
import { Eye, Users, Plus, Code, GitFork } from "lucide-react"
import { SnippetCard } from "@/components/snippet-card"
import { useStore } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import type { Snippet } from "@/lib/store"

export default function ExplorePage() {
  const { user } = useAuth()
  const { snippets, getPublicSnippets, forkSnippet, hasForkedSnippet, currentUserId, initializeGuestData } = useStore()
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([])

  useEffect(() => {
    if (!user) {
      initializeGuestData()
    }
  }, [user, initializeGuestData])

  // Update filtered snippets whenever the snippets array changes
  useEffect(() => {
    const publicSnippets = getPublicSnippets()
    console.log("Public snippets found:", publicSnippets.length)
    console.log("All snippets:", snippets.length)
    console.log("Public snippets data:", publicSnippets)

    publicSnippets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setFilteredSnippets(publicSnippets)
  }, [snippets, getPublicSnippets])

  const handleSearch = (query: string) => {
    const publicSnippets = getPublicSnippets()

    if (!query.trim()) {
      setFilteredSnippets(publicSnippets)
      return
    }

    const filtered = publicSnippets.filter(
      (snippet) =>
        snippet.title.toLowerCase().includes(query.toLowerCase()) ||
        snippet.content.toLowerCase().includes(query.toLowerCase()) ||
        snippet.user_id.toLowerCase().includes(query.toLowerCase()),
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
        case "forks":
          return b.fork_count - a.fork_count
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

  const handleFork = (snippet: Snippet) => {
    forkSnippet(snippet)
  }

  const getUniqueAuthors = () => {
    const authors = new Set(filteredSnippets.map((s) => s.user_id))
    return authors.size
  }

  const getUserName = (userId: string) => {
    if (userId === "guest") return "Guest"

    // Try to get display name from localStorage (like in profile page)
    try {
      const profileKey = `snippy-profile-${userId}`
      const savedProfile = localStorage.getItem(profileKey)
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        if (profile.name) {
          return profile.name
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }

    return `User ${userId.slice(0, 8)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Explore Community Snippets</h1>
          <p className="text-muted-foreground mt-1">Discover and fork useful code snippets from other developers</p>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{filteredSnippets.length} public snippets</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{getUniqueAuthors()} contributors</span>
          </div>
        </div>

        <SearchBar
          onSearch={handleSearch}
          onSort={handleSort}
          onShuffle={handleShuffle}
          placeholder="Search community snippets..."
          showForkSort={true}
        />
      </div>

      {filteredSnippets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSnippets.map((snippet) => {
            const isOwner = snippet.user_id === currentUserId || (snippet.user_id === "guest" && currentUserId === null)
            const canFork = !isOwner
            const isForked = hasForkedSnippet(snippet.id, snippet.user_id)

            return (
              <div key={snippet.id} className="relative">
                <SnippetCard snippet={snippet} showActions={false} />

                {/* Snippet metadata */}
                <div className="mt-2 px-3 py-2 bg-muted/30 rounded-b-lg text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span>by {getUserName(snippet.user_id)}</span>
                      <span className="capitalize">{snippet.language}</span>
                      {snippet.fork_count > 0 && (
                        <div className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          <span>{snippet.fork_count}</span>
                        </div>
                      )}
                    </div>

                    {canFork && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFork(snippet)}
                        disabled={isForked}
                        className="h-6 px-2 text-xs"
                      >
                        {isForked ? "Forked" : "Fork"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
            <Code className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No Community Snippets Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The community is just getting started! Be the first to share your code snippets and help other developers.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create snippets and make them <strong>public</strong> to share with the community
            </p>
            <Button onClick={() => (window.location.href = "/")} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Snippet
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
