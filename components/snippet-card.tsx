"use client"
import { Card, CardContent } from "@/components/ui/card"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Heart } from "lucide-react"
import type { Snippet } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface SnippetCardProps {
  snippet: Snippet
  onEdit?: (snippet: Snippet) => void
  onDelete?: (id: string) => void
  onToggleFavorite?: (id: string, isFavorite: boolean) => void
  showActions?: boolean
}

export function SnippetCard({ snippet, onEdit, onDelete, onToggleFavorite, showActions = true }: SnippetCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/snippet/${snippet.id}`)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(snippet.id, !snippet.is_favorite)
    }
  }

  return (
    <Card className="group cursor-pointer relative" onClick={handleCardClick}>
      <CardContent className="p-4">
        <div className="pr-8">
          <h3 className="font-semibold text-base leading-tight">{snippet.title}</h3>
        </div>

        {showActions && (
          <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                onClick={handleToggleFavorite}
              >
                <Heart className={cn("h-4 w-4", snippet.is_favorite && "fill-current text-red-500")} />
              </Button>
            )}

            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(snippet)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(snippet.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
