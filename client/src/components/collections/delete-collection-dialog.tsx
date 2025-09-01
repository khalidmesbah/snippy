import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteCollection } from "@/lib/api/collections";
import { showNotification } from "@/lib/notifications";
import type { Collection } from "@/types/collections";

interface DeleteCollectionDialogProps {
  collection: Collection;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DeleteCollectionDialog({
  collection,
  onSuccess,
  trigger,
}: DeleteCollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const deleteCollectionMutation = useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setOpen(false);
      setIsSubmitting(false);
      onSuccess?.();
    },
    onError: (error) => {
      setIsSubmitting(false);
      showNotification.error(
        "Failed to delete collection",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
  });

  const handleDelete = async () => {
    setIsSubmitting(true);
    deleteCollectionMutation.mutate(collection.id);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete collection</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Delete Collection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div
              className="w-8 h-8 rounded"
              style={{ backgroundColor: collection.color }}
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {collection.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {collection.snippet_count || 0} snippet
                {(collection.snippet_count || 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-900 dark:text-white">
              Are you sure you want to delete this collection?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone. The collection and all its snippets
              will be permanently deleted.
            </p>
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
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Collection
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
