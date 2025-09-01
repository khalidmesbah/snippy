import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "@tanstack/react-router";
import { Folder, GripVertical, Heart } from "lucide-react";
import { isFavoritesCollection } from "@/lib/favorites-collection";
import type { Collection, FavoritesCollection } from "@/types/collections";

interface CollectionCardProps {
  collection: Collection | FavoritesCollection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const isFavorites = isFavoritesCollection(collection);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: collection.id,
    disabled: isFavorites, // Disable dragging for favorites
    animateLayoutChanges: (args) =>
      defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
  });

  return (
    <div
      ref={setNodeRef}
      className="group relative rounded-lg border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={
        {
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
          "--tw-ring-color": "var(--color-ring)",
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
        } as React.CSSProperties
      }
    >
      {/* Drag Handle - Only show for non-favorites collections */}
      {!isFavorites && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1 cursor-grab active:cursor-grabbing z-10"
          style={{
            color: "var(--color-muted-foreground)",
          }}
          title="Drag to reorder collection"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Collection Content */}
      <Link to={`/collection/${collection.id}`} className="block">
        {/* Horizontal Layout: Icon on left, text on right */}
        <div className="flex items-center gap-4 p-4">
          {/* Collection Icon */}
          <div className="flex-shrink-0">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: isFavorites ? "#ef4444" : collection.color,
              }}
            >
              {isFavorites ? (
                <Heart className="w-6 h-6 text-white" />
              ) : (
                <Folder className="w-6 h-6 text-white" />
              )}
            </div>
          </div>

          {/* Collection Text Content */}
          <div className="flex-1 min-w-0">
            {/* Collection Name */}
            <h3
              className="text-lg font-semibold mb-1 line-clamp-1"
              style={{ color: "var(--color-card-foreground)" }}
            >
              {collection.name}
            </h3>

            {/* Snippet Count */}
            <p
              className="text-sm"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {collection.snippet_count || 0} snippet
              {(collection.snippet_count || 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div
          className="absolute inset-0 rounded-lg transition-all duration-200 pointer-events-none opacity-0 group-hover:opacity-5"
          style={{
            backgroundColor: "var(--color-foreground)",
          }}
        />
      </Link>
    </div>
  );
}
