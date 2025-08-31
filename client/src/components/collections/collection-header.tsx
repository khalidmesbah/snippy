import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2, Plus } from "lucide-react";
import { EditCollectionDialog } from "./edit-collection-dialog";
import { DeleteCollectionDialog } from "./delete-collection-dialog";
import type { Collection } from "@/types/collections";

interface CollectionHeaderProps {
  collection: Collection;
  snippetCount: number;
  onAddSnippet?: () => void;
  onEditSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function CollectionHeader({ 
  collection, 
  snippetCount, 
  onAddSnippet,
  onEditSuccess,
  onDeleteSuccess 
}: CollectionHeaderProps) {
  const navigate = useNavigate();

  const handleBackToCollections = () => {
    navigate({ to: "/collections" });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToCollections}
          className="h-8 px-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Collections
        </Button>
        <span>/</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {collection.name}
        </span>
      </div>

      {/* Collection Info and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Collection Icon and Info */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: collection.color }}
            >
              <div className="w-6 h-6 rounded bg-white/20" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {collection.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {snippetCount} snippet{snippetCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onAddSnippet && (
            <Button onClick={onAddSnippet} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Snippet
            </Button>
          )}
          
          <EditCollectionDialog
            collection={collection}
            onSuccess={onEditSuccess}
            trigger={
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            }
          />
          
          <DeleteCollectionDialog
            collection={collection}
            onSuccess={onDeleteSuccess}
            trigger={
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
