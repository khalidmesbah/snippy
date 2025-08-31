import { useState, useEffect, useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2 } from "lucide-react";
import { updateCollection } from "@/lib/api/collections";
import { showNotification } from "@/lib/notifications";
import type { Collection } from "@/types/collections";

const DEFAULT_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#ec4899", // Pink
];

interface EditCollectionDialogProps {
  collection: Collection;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditCollectionDialog({ collection, onSuccess, trigger }: EditCollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(collection.name);
  const [color, setColor] = useState(collection.color);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const nameInputId = useId();

  // Update form when collection changes
  useEffect(() => {
    setName(collection.name);
    setColor(collection.color);
  }, [collection]);

  const updateCollectionMutation = useMutation({
    mutationFn: ({ collectionId, updates }: { collectionId: string; updates: { name: string; color: string } }) =>
      updateCollection(collectionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection", collection.id] });
      setOpen(false);
      setIsSubmitting(false);
      onSuccess?.();
    },
    onError: (error) => {
      setIsSubmitting(false);
      showNotification.error("Failed to update collection", error instanceof Error ? error.message : "An error occurred");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    updateCollectionMutation.mutate({
      collectionId: collection.id,
      updates: {
        name: name.trim(),
        color: color,
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form to original values
        setName(collection.name);
        setColor(collection.color);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit collection</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameInputId}>Collection Name</Label>
            <Input
              id={nameInputId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collection name"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label>Collection Color</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === colorOption
                      ? "border-gray-900 dark:border-white scale-110"
                      : "border-gray-300 dark:border-gray-600 hover:scale-105"
                  }`}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                  disabled={isSubmitting}
                  aria-label={`Select color ${colorOption}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  Update Collection
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
