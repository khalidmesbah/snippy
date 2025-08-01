"use client"

import { useState, useCallback } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { SnippetCard } from "@/components/snippet-card"
import type { Snippet } from "@/lib/store"

interface DraggableSnippetListProps {
  snippets: Snippet[]
  onEdit: (snippet: Snippet) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
  onReorder: (snippetIds: string[]) => void
}

// Memoized snippet item to prevent unnecessary re-renders
const MemoizedSnippetItem = ({
  snippet,
  onEdit,
  onDelete,
  onToggleFavorite,
  index,
}: {
  snippet: Snippet
  onEdit: (snippet: Snippet) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
  index: number
}) => {
  const handleEdit = useCallback(() => onEdit(snippet), [onEdit, snippet])
  const handleDelete = useCallback(() => onDelete(snippet.id), [onDelete, snippet.id])
  const handleToggleFavorite = useCallback(
    (isFavorite: boolean) => onToggleFavorite(snippet.id, isFavorite),
    [onToggleFavorite, snippet.id],
  )

  return (
    <Draggable key={snippet.id} draggableId={snippet.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? "shadow-lg z-50" : ""}
          style={{
            ...provided.draggableProps.style,
            cursor: snapshot.isDragging ? "grabbing" : "grab",
          }}
        >
          <SnippetCard
            snippet={snippet}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      )}
    </Draggable>
  )
}

export function DraggableSnippetList({
  snippets,
  onEdit,
  onDelete,
  onToggleFavorite,
  onReorder,
}: DraggableSnippetListProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    // Disable text selection during drag
    document.body.style.userSelect = "none"
  }, [])

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      setIsDragging(false)

      // Re-enable text selection
      document.body.style.userSelect = ""

      if (!result.destination) {
        return
      }

      const sourceIndex = result.source.index
      const destinationIndex = result.destination.index

      if (sourceIndex === destinationIndex) {
        return
      }

      // Create new order array
      const items = Array.from(snippets)
      const [reorderedItem] = items.splice(sourceIndex, 1)
      items.splice(destinationIndex, 0, reorderedItem)

      // Call the reorder function with the new order
      onReorder(items.map((item) => item.id))
    },
    [snippets, onReorder],
  )

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <Droppable droppableId="snippets">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-3 ${snapshot.isDraggingOver ? "bg-muted/5 rounded-lg p-1" : ""}`}
          >
            {snippets.map((snippet, index) => (
              <MemoizedSnippetItem
                key={snippet.id}
                snippet={snippet}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
