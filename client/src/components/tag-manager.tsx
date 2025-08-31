import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { showNotification } from "@/lib/notifications";
import type { Tag, CreateTagRequest, UpdateTagRequest } from "@/types";

export function TagManager() {
  const { user } = useUser();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create tag state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit tag state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete tag state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch tags on component mount
  useEffect(() => {
    if (user) {
      fetchTags();
    }
  }, [user]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/tags", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setTags(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch tags");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch tags";
      setError(errorMsg);
      showNotification.error("Failed to fetch tags", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch("http://localhost:8080/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newTagName.trim() } as CreateTagRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create tag");
      }

      const data = await response.json();
      if (data.success) {
        setTags([...tags, data.data]);
        setNewTagName("");
        setCreateDialogOpen(false);
        showNotification.success("Tag created successfully");
      } else {
        throw new Error(data.message || "Failed to create tag");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create tag";
      setError(errorMsg);
      showNotification.error("Failed to create tag", errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleEditTag = async () => {
    if (!editingTag || !editTagName.trim()) return;

    try {
      setUpdating(true);
      const response = await fetch(
        `http://localhost:8080/api/tags/${editingTag.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: editTagName.trim(),
          } as UpdateTagRequest),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update tag");
      }

      const data = await response.json();
      if (data.success) {
        setTags(
          tags.map((tag) =>
            tag.id === editingTag.id
              ? { ...tag, name: editTagName.trim() }
              : tag,
          ),
        );
        setEditDialogOpen(false);
        setEditingTag(null);
        setEditTagName("");
        showNotification.success("Tag updated successfully");
      } else {
        throw new Error(data.message || "Failed to update tag");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update tag";
      setError(errorMsg);
      showNotification.error("Failed to update tag", errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `http://localhost:8080/api/tags/${deletingTag.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete tag");
      }

      const data = await response.json();
      if (data.success) {
        setTags(tags.filter((tag) => tag.id !== deletingTag.id));
        setDeleteDialogOpen(false);
        setDeletingTag(null);
        showNotification.success("Tag deleted successfully");
      } else {
        throw new Error(data.message || "Failed to delete tag");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete tag";
      setError(errorMsg);
      showNotification.error("Failed to delete tag", errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setDeletingTag(tag);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading tags...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center p-4 space-y-2">
        <div className="text-red-600">Error: {error}</div>
        <Button onClick={fetchTags} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Manage Tags</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>
                Create a new tag to organize your snippets. Tag names are
                case-insensitive.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || creating}
              >
                {creating ? "Creating..." : "Create Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tags created yet. Create your first tag to get started!
        </div>
      ) : (
        <div className="grid gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{tag.name}</Badge>
                <span className="text-sm text-gray-500">
                  Created {new Date(tag.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(tag)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog
                  open={deleteDialogOpen && deletingTag?.id === tag.id}
                  onOpenChange={(open) => !open && setDeleteDialogOpen(false)}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDeleteDialog(tag)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the tag "{tag.name}"?
                        This action will remove the tag from all snippets and
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTag}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleting}
                      >
                        {deleting ? "Deleting..." : "Delete Tag"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Tag Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the name of your tag. Tag names are case-insensitive.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-tag-name">Tag Name</Label>
              <Input
                id="edit-tag-name"
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                placeholder="Enter tag name..."
                onKeyDown={(e) => e.key === "Enter" && handleEditTag()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingTag(null);
                setEditTagName("");
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditTag}
              disabled={!editTagName.trim() || updating}
            >
              {updating ? "Updating..." : "Update Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
