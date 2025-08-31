import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Star, StarOff, Move, Save } from "lucide-react";
import { CompactSnippetCard } from "@/components/compact-snippet-card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { showNotification } from "@/lib/notifications";

interface Snippet {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tag_names?: string[];
  is_favorite?: boolean;
  is_public?: boolean;
  forked_from?: string | null;
  collection_id?: string | null;
  fork_count?: number;
}

interface SnippetsGridProps {
  snippets: Snippet[];
  collectionId: string;
  isLoading: boolean;
  onRefresh: () => void;
  onPositionsUpdate?: (positions: Array<{id: string, position: number}>) => void;
  onSavePositions?: (positions: Array<{id: string, position: number}>) => void;
  isUpdatingPositions?: boolean;
  onPositionsSaved?: () => void;
  onPendingChanges?: (hasChanges: boolean) => void;
}

// Draggable wrapper for CompactSnippetCard
function DraggableSnippetCard({ snippet }: { snippet: Snippet }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: snippet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="absolute top-2 right-2 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors z-10"
        title="Drag to reorder snippet"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {/* Compact Snippet Card */}
      <CompactSnippetCard snippet={snippet} />
    </div>
  );
}

export function SnippetsGrid({ 
  snippets, 
  collectionId, 
  isLoading, 
  onRefresh,
  onPositionsUpdate,
  onSavePositions,
  isUpdatingPositions = false,
  onPositionsSaved,
  onPendingChanges
}: SnippetsGridProps) {
  const [items, setItems] = useState<Snippet[]>(snippets);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Mark that we have pending changes
        setHasPendingChanges(true);
        onPendingChanges?.(true);
        
        // Call the callback to update positions in the parent (UI only)
        if (onPositionsUpdate) {
          const positions = newItems.map((item, index) => ({
            id: item.id,
            position: index,
          }));
          onPositionsUpdate(positions);
        }

        return newItems;
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = () => {
    // TODO: Implement bulk delete
    showNotification.info("Bulk delete", `Deleting ${selectedItems.size} selected snippets`);
    setSelectedItems(new Set());
    setIsSelectMode(false);
  };

  const handleBulkFavorite = () => {
    // TODO: Implement bulk favorite
    showNotification.info("Bulk favorite", `Adding ${selectedItems.size} snippets to favorites`);
    setSelectedItems(new Set());
    setIsSelectMode(false);
  };

  const handleBulkUnfavorite = () => {
    // TODO: Implement bulk unfavorite
    showNotification.info("Bulk unfavorite", `Removing ${selectedItems.size} snippets from favorites`);
    setSelectedItems(new Set());
    setIsSelectMode(false);
  };

  const handleBulkMove = () => {
    // TODO: Implement bulk move to another collection
    showNotification.info("Bulk move", `Moving ${selectedItems.size} snippets to another collection`);
    setSelectedItems(new Set());
    setIsSelectMode(false);
  };

  const handleSavePositions = () => {
    if (onSavePositions) {
      const positions = items.map((item, index) => ({
        id: item.id,
        position: index,
      }));
      onSavePositions(positions);
      setHasPendingChanges(false);
      onPendingChanges?.(false);
    }
  };

  if (isLoading) {
    return <SnippetsGridSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Empty snippets icon"
            role="img"
          >
            <title>Empty snippets icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          No Snippets Yet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add your first snippet to this collection to get started.
        </p>
        <button
          type="button"
          onClick={() => {
            // TODO: Implement add snippet
            showNotification.info("Add snippet", "Add snippet functionality coming soon");
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Snippet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {isSelectMode && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.size === items.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedItems.size} of {items.length} selected
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMove}
                className="flex items-center gap-2"
              >
                <Move className="h-4 w-4" />
                Move
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkFavorite}
                className="flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                Favorite
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnfavorite}
                className="flex items-center gap-2"
              >
                <StarOff className="h-4 w-4" />
                Unfavorite
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedItems(new Set());
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Snippets ({items.length})
        </h3>
        
        <div className="flex items-center gap-2">
          {!isSelectMode && hasPendingChanges && onSavePositions && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSavePositions}
              disabled={isUpdatingPositions}
              className="flex items-center gap-2"
            >
              {isUpdatingPositions ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
          
          {!isSelectMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectMode(true)}
            >
              Select Multiple
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Snippets Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((snippet) => (
              <div key={snippet.id} className="relative">
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedItems.has(snippet.id)}
                      onCheckedChange={() => handleSelectItem(snippet.id)}
                    />
                  </div>
                )}
                <DraggableSnippetCard snippet={snippet} />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SnippetsGridSkeleton() {
  const skeletonItems = Array.from({ length: 8 }, (_, index) => `skeleton-${index}`);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {skeletonItems.map((key) => (
        <div
          key={key}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
        >
          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
          
          {/* Tags skeleton */}
          <div className="flex gap-1 mt-3">
            <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
