"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { FolderPlus, MoreHorizontal, Edit, Trash2, Folder, Heart } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import type { Collection } from "@/lib/store"
import { useRouter } from "next/navigation"

export default function LibraryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    addCollection,
    updateCollection,
    deleteCollection,
    initializeGuestData,
    getSortedCollections,
    getSnippetsForCollection,
    currentUserId,
  } = useStore()

  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [collectionForm, setCollectionForm] = useState({
    name: "",
    color: "#3B82F6",
  })

  const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280", "#F97316"]

  useEffect(() => {
    if (!user) {
      initializeGuestData()
    }
  }, [user, initializeGuestData])

  const sortedCollections = getSortedCollections()

  const handleCreateCollection = () => {
    setEditingCollection(null)
    setCollectionForm({ name: "", color: "#3B82F6" })
    setIsCollectionDialogOpen(true)
  }

  const handleEditCollection = (collection: Collection) => {
    if (collection.id === "favorites") return // Prevent editing favorites collection

    setEditingCollection(collection)
    setCollectionForm({
      name: collection.name,
      color: collection.color,
    })
    setIsCollectionDialogOpen(true)
  }

  const handleSaveCollection = () => {
    if (editingCollection) {
      updateCollection(editingCollection.id, collectionForm)
    } else {
      const regularCollections = sortedCollections.filter((c) => c.id !== "favorites")
      const maxPosition = regularCollections.length > 0 ? Math.max(...regularCollections.map((c) => c.position)) : 0

      addCollection({
        ...collectionForm,
        position: maxPosition + 1,
      })
    }
    setIsCollectionDialogOpen(false)
  }

  const handleDeleteCollection = (id: string) => {
    if (id === "favorites") return // Prevent deleting favorites collection
    deleteCollection(id)
  }

  const handleCollectionClick = (collectionId: string) => {
    if (collectionId === "favorites") {
      router.push("/favorites")
    } else {
      router.push(`/collection/${collectionId}`)
    }
  }

  const getCollectionIcon = (collection: Collection) => {
    if (collection.id === "favorites") return Heart
    return Folder
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Library</h1>
            <p className="text-muted-foreground mt-1">Organize your snippets into collections</p>
          </div>
          <Button onClick={handleCreateCollection}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {sortedCollections.map((collection) => {
          const snippetCount = getSnippetsForCollection(collection.id).length
          const Icon = getCollectionIcon(collection)

          return (
            <Card
              key={`collection-${collection.id}`}
              className="cursor-pointer transition-all hover:shadow-md hover:scale-105 group relative"
              onClick={() => handleCollectionClick(collection.id)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-row items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: collection.color }}
                  >
                    <Icon
                      className={`h-6 w-6 ${collection.id === "favorites" ? "text-white fill-current" : "text-white"}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm truncate max-w-full">{collection.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {snippetCount} snippet{snippetCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {collection.id !== "favorites" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditCollection(collection)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCollection(collection.id)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Collection Dialog */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCollection ? "Edit Collection" : "Create New Collection"}</DialogTitle>
            <DialogDescription>
              {editingCollection
                ? "Update your collection details."
                : "Create a new collection to organize your snippets."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={collectionForm.name}
                onChange={(e) => setCollectionForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Collection name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={`color-${color}`}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      collectionForm.color === color ? "border-primary" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCollectionForm((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCollection} disabled={!collectionForm.name.trim()}>
              {editingCollection ? "Update" : "Create"} Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
