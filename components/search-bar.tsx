"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SortAsc, Shuffle } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
  onSort: (sort: string) => void
  onFilter?: (filter: string) => void
  onShuffle: () => void
  placeholder?: string
  showForkSort?: boolean
}

export function SearchBar({
  onSearch,
  onSort,
  onFilter,
  onShuffle,
  placeholder = "Search snippets...",
  showForkSort = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("")

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${placeholder} (Ctrl+K)`}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select onValueChange={onSort}>
            <SelectTrigger className="w-[140px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              {showForkSort && <SelectItem value="forks">Most Forked</SelectItem>}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onShuffle}>
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
