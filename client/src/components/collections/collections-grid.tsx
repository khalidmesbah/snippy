import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { RotateCcw } from "lucide-react";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { isFavoritesCollection } from "@/lib/favorites-collection";
import type { Collection, FavoritesCollection } from "@/types/collections";
import { CollectionCard } from "./collection-card";
import { CreateCollectionDialog } from "./create-collection-dialog";

interface CollectionsGridProps {
  collections: (Collection | FavoritesCollection)[];
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSavePositions?: (
    positions: Array<{ id: string; position: number }>,
  ) => void;
  isUpdatingPositions?: boolean;
  onPositionsSaved?: () => void;
  onPendingChanges?: (hasChanges: boolean) => void;
}

export const CollectionsGrid = forwardRef<
  { handleSavePositions: () => void },
  CollectionsGridProps
>(
  (
    {
      collections,
      isLoading,
      error,
      onRefresh,
      onSavePositions,
      isUpdatingPositions = false,
      onPositionsSaved,
      onPendingChanges,
    },
    ref,
  ) => {
    const [items, setItems] =
      useState<(Collection | FavoritesCollection)[]>(collections);
    const [_activeId, setActiveId] = useState<string | null>(null);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);
    const [originalOrder, setOriginalOrder] =
      useState<(Collection | FavoritesCollection)[]>(collections);

    // Update items when collections change
    React.useEffect(() => {
      setItems(collections);
      setOriginalOrder(collections);
      // Only reset pending changes if we have collections and this isn't the initial load
      if (collections.length > 0) {
        setHasPendingChanges(false);
      }
    }, [collections]);

    // Reset pending changes when positions are successfully saved
    React.useEffect(() => {
      if (!isUpdatingPositions && hasPendingChanges) {
        // Positions were saved successfully, reset pending changes
        setHasPendingChanges(false);
        onPositionsSaved?.();
      }
    }, [isUpdatingPositions, hasPendingChanges, onPositionsSaved]);

    // Notify parent component of pending changes
    React.useEffect(() => {
      onPendingChanges?.(hasPendingChanges);
    }, [hasPendingChanges, onPendingChanges]);

    // Expose handleSavePositions function to parent component
    useImperativeHandle(ref, () => ({
      handleSavePositions: () => {
        if (onSavePositions) {
          const positions = items.map(
            (item: Collection | FavoritesCollection, index: number) => ({
              id: item.id,
              position: index,
            }),
          );
          onSavePositions(positions);
        }
      },
    }));

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    const handleDragStart = (event: DragEndEvent) => {
      setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;

      // If dropped outside droppable area, remove the item (but not favorites)
      if (!over) {
        const activeItem = items.find((item) => item.id === active.id);
        if (activeItem && isFavoritesCollection(activeItem)) {
          // Don't allow removal of favorites collection
          return;
        }

        setItems((items) => {
          const newItems = items.filter((item) => item.id !== active.id);

          // Mark that we have pending changes
          setHasPendingChanges(true);

          // Don't call onPositionsUpdate here - wait for save button

          return newItems;
        });
        return;
      }

      // If dropped on a different item, reorder
      if (active.id !== over.id) {
        setItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);

          const newItems = arrayMove(items, oldIndex, newIndex);

          // Mark that we have pending changes
          setHasPendingChanges(true);

          // Don't call onPositionsUpdate here - wait for save button

          return newItems;
        });
      }
    };

    if (isLoading) {
      return <CollectionsGridSkeleton />;
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Error Loading Collections
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || "An unknown error occurred"}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      );
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
              aria-label="Empty collections icon"
              role="img"
            >
              <title>Empty collections icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            No Collections Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first collection to start organizing your code snippets.
          </p>
          <CreateCollectionDialog />
        </div>
      );
    }

    // Handle resetting to original order
    const handleResetPositions = () => {
      setItems(originalOrder);
      setHasPendingChanges(false);
    };

    // Include all items in sortable context, but favorites will be disabled from dragging
    const sortableItems = items;

    return (
      <div className="space-y-6">
        {/* Reset Button */}
        {hasPendingChanges && (
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              onClick={handleResetPositions}
              disabled={isUpdatingPositions}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Order
            </Button>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        >
          <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortableItems.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  },
);

function CollectionsGridSkeleton() {
  const skeletonItems = Array.from(
    { length: 8 },
    (_, index) => `skeleton-${index}`,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {skeletonItems.map((key) => (
        <div
          key={key}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
        >
          {/* Icon skeleton */}
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4" />

          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />

          {/* Count skeleton */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mt-2" />
        </div>
      ))}
    </div>
  );
}
