"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Globe, Lock, Folder, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Collection, Snippet } from "@/lib/store"

interface SnippetEditorProps {
  snippet?: Snippet
  collections: Collection[]
  isOpen: boolean
  onClose: () => void
  onSave: (snippet: Partial<Snippet>) => void
  defaultCollectionId?: string
}

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript", color: "#F7DF1E" },
  { value: "typescript", label: "TypeScript", color: "#3178C6" },
  { value: "python", label: "Python", color: "#3776AB" },
  { value: "java", label: "Java", color: "#ED8B00" },
  { value: "cpp", label: "C++", color: "#00599C" },
  { value: "c", label: "C", color: "#A8B9CC" },
  { value: "csharp", label: "C#", color: "#239120" },
  { value: "php", label: "PHP", color: "#777BB4" },
  { value: "ruby", label: "Ruby", color: "#CC342D" },
  { value: "go", label: "Go", color: "#00ADD8" },
  { value: "rust", label: "Rust", color: "#000000" },
  { value: "swift", label: "Swift", color: "#FA7343" },
  { value: "kotlin", label: "Kotlin", color: "#7F52FF" },
  { value: "html", label: "HTML", color: "#E34F26" },
  { value: "css", label: "CSS", color: "#1572B6" },
  { value: "scss", label: "SCSS", color: "#CF649A" },
  { value: "json", label: "JSON", color: "#000000" },
  { value: "yaml", label: "YAML", color: "#CB171E" },
  { value: "markdown", label: "Markdown", color: "#000000" },
  { value: "sql", label: "SQL", color: "#336791" },
  { value: "bash", label: "Bash", color: "#4EAA25" },
  { value: "text", label: "Plain Text", color: "#6B7280" },
]

export function SnippetEditor({
  snippet,
  collections,
  isOpen,
  onClose,
  onSave,
  defaultCollectionId,
}: SnippetEditorProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    language: "javascript",
    collection_id: undefined as string | undefined,
    is_public: false,
  })
  const [languageOpen, setLanguageOpen] = useState(false)

  useEffect(() => {
    if (snippet) {
      setFormData({
        title: snippet.title,
        content: snippet.content,
        language: snippet.language,
        collection_id: snippet.collection_id,
        is_public: snippet.is_public,
      })
    } else {
      setFormData({
        title: "",
        content: "",
        language: "javascript",
        collection_id: defaultCollectionId,
        is_public: false,
      })
    }
  }, [snippet, isOpen, defaultCollectionId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const selectedLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.value === formData.language)
  const selectedCollection = formData.collection_id ? collections.find((c) => c.id === formData.collection_id) : null

  // Filter out favorites collection and sort them properly
  const availableCollections = collections
    .filter((c) => c.id !== "favorites")
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {snippet ? "Edit Snippet" : "Create New Snippet"}
          </DialogTitle>
          <DialogDescription>
            {snippet
              ? "Update your code snippet with new content or settings."
              : "Create a new code snippet to add to your collection."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </div>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a descriptive title for your snippet"
                  className="text-base"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Language & Collection Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Programming Language</Label>
                  <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={languageOpen}
                        className={cn("w-full justify-between", !formData.language && "text-muted-foreground")}
                      >
                        {selectedLanguage ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedLanguage.color }} />
                            {selectedLanguage.label}
                          </div>
                        ) : (
                          "Select language..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search languages..." />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {SUPPORTED_LANGUAGES.map((language) => (
                              <CommandItem
                                key={language.value}
                                value={language.label}
                                onSelect={() => {
                                  setFormData((prev) => ({ ...prev, language: language.value }))
                                  setLanguageOpen(false)
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: language.color }} />
                                  {language.label}
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    formData.language === language.value ? "opacity-100" : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Label htmlFor="collection" className="text-sm font-medium">
                    Collection
                  </Label>
                  <Select
                    value={formData.collection_id || "no-collection"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        collection_id: value === "no-collection" ? undefined : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection">
                        {selectedCollection ? (
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" style={{ color: selectedCollection.color }} />
                            {selectedCollection.name}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-muted-foreground" />
                            No Collection
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-collection">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-muted-foreground" />
                          No Collection
                        </div>
                      </SelectItem>
                      {availableCollections.map((collection) => (
                        <SelectItem key={`collection-${collection.id}`} value={collection.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" style={{ color: collection.color }} />
                            {collection.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Content Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="content" className="text-sm font-medium">
                    Code Content
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </div>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Paste your code here..."
                  rows={16}
                  className="font-mono text-sm resize-none"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Snippet Settings</h3>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {formData.is_public ? (
                      <Globe className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="text-sm font-medium">
                        {formData.is_public ? "Public Snippet" : "Private Snippet"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formData.is_public ? "Visible to everyone in the explore page" : "Only visible to you"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_public: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[100px]">
              {snippet ? "Update Snippet" : "Create Snippet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
