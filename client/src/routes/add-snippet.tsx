import { zodResolver } from "@hookform/resolvers/zod";
import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  HighlightToggle,
  headingsPlugin,
  InsertAdmonition,
  InsertCodeBlock,
  InsertImage,
  InsertSandpack,
  InsertTable,
  InsertThematicBreak,
  imagePlugin,
  ListsToggle,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  markdownShortcutPlugin,
  quotePlugin,
  type SandpackConfig,
  Separator,
  StrikeThroughSupSubToggles,
  sandpackPlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import "@mdxeditor/editor/style.css";
import { oneDark } from "@codemirror/theme-one-dark";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Code2,
  FolderOpen,
  FolderPlus,
  Globe,
  Heart,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Tag as TagIcon,
} from "lucide-react";
import { AuthWrapper } from "@/components/auth-wrapper";
import { ErrorState, LoadingState } from "@/components/Loaders";
import { MultiSelect } from "@/components/multi-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { codeBlockLanguages } from "@/lib/codeBlockLanguages";
import { showNotification } from "@/lib/notifications";
import type { Collection, SnippetFormData, Tag } from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const DEFAULT_MDX_CONTENT = `# Welcome

This is a **full demo** of MDXEditor with **all plugins and toolbar buttons** enabled.
`;

import { sandpackPresets } from "@/lib/sandpackPresets";

const SANDPACK_CONFIG: SandpackConfig = {
  defaultPreset: "react",
  presets: sandpackPresets,
};

const snippetSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  collectionIds: z.array(z.uuid()),
  tagIds: z.array(z.uuid()),
  isPublic: z.boolean(),
  isFavorite: z.boolean(),
  content: z.string().min(1, "Content is required"),
});

export const Route = createFileRoute("/add-snippet")({
  component: () => (
    <AuthWrapper>
      <RouteComponent />
    </AuthWrapper>
  ),
  validateSearch: (search: Record<string, unknown>) => ({
    collectionId: search.collectionId as string | undefined,
  }),
});

export function RouteComponent() {
  const queryClient = useQueryClient();
  const search = useSearch({ from: "/add-snippet" });
  const collectionId = search.collectionId;

  const form = useForm<SnippetFormData>({
    resolver: zodResolver(snippetSchema),
    defaultValues: {
      title: "",
      collectionIds: [],
      tagIds: [],
      isPublic: false,
      isFavorite: false,
      content: DEFAULT_MDX_CONTENT,
    },
  });

  const [newTagInput, setNewTagInput] = useState("");
  const [newCollectionInput, setNewCollectionInput] = useState("");

  // Tags
  const {
    data: tags = [],
    isLoading: tagsLoading,
    isError: tagsError,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ["tags", "list"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tags`, {
          credentials: "include",
        });
        if (!res.ok) {
          let msg = `Request failed with ${res.status}`;
          try {
            const d = await res.json();
            msg = d?.error || d?.message || msg;
          } catch {}
          throw new Error(msg);
        }
        const data = await res.json().catch(() => ({}));
        return (data?.data ?? data) as Tag[];
      } catch (error) {
        showNotification.error(
          "Failed to fetch tags",
          error instanceof Error ? error.message : "An error occurred",
        );
        throw error;
      }
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${API_BASE_URL}/tags/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: "#3b82f6" }),
      });
      if (!res.ok) {
        let msg = `Request failed with ${res.status}`;
        try {
          const d = await res.json();
          msg = d?.error || d?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      showNotification.success("Tag created successfully");
    },
    onError: (error) => {
      showNotification.error(
        "Failed to create tag",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
  });

  // Collections
  const {
    data: collections = [],
    isLoading: collectionsLoading,
    isError: collectionsError,
    refetch: refetchCollections,
  } = useQuery({
    queryKey: ["collections", "list"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/collections`, {
          credentials: "include",
        });
        if (!res.ok) {
          let msg = `Request failed with ${res.status}`;
          try {
            const d = await res.json();
            msg = d?.error || d?.message || msg;
          } catch {}
          throw new Error(msg);
        }
        const data = await res.json().catch(() => ({}));
        return (data?.data ?? data) as Collection[];
      } catch (error) {
        showNotification.error(
          "Failed to fetch collections",
          error instanceof Error ? error.message : "An error occurred",
        );
        throw error;
      }
    },
  });

  // Set collection when collectionId is provided in search params
  useEffect(() => {
    if (collectionId && collections.length > 0) {
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        form.setValue("collectionIds", [collectionId]);
      }
    }
  }, [collectionId, collections, form]);

  const createCollectionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${API_BASE_URL}/collections/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: "#3b82f6" }),
      });
      if (!res.ok) {
        let msg = `Request failed with ${res.status}`;
        try {
          const d = await res.json();
          msg = d?.error || d?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showNotification.success("Collection created successfully");
    },
    onError: (error) => {
      showNotification.error(
        "Failed to create collection",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
  });

  // Create snippet
  const createSnippetMutation = useMutation({
    mutationFn: async (payload: SnippetFormData) => {
      const res = await fetch(`${API_BASE_URL}/snippets/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `Request failed with ${res.status}`;
        try {
          const d = await res.json();
          msg = d?.error || d?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      queryClient.invalidateQueries({ queryKey: ["public-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
      form.reset();
      showNotification.success("Snippet created successfully");

      // Navigate back to collection if we came from one
      if (collectionId) {
        window.location.href = `/collection/${collectionId}`;
      }
    },
    onError: (error) => {
      showNotification.error(
        "Failed to create snippet",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
  });

  // Options
  const availableTags = useMemo(
    () => tags.map((t) => ({ label: t.name, value: t.id })),
    [tags],
  );
  const tagNames = useMemo(() => tags.map((t) => t.name), [tags]);
  const collectionOptions = useMemo(
    () => collections.map((c) => ({ label: c.name, value: c.id })),
    [collections],
  );

  const handleAddTag = useCallback(
    (tagId: string) => {
      const currentTagIds = form.getValues("tagIds");
      if (tagId && !currentTagIds.includes(tagId)) {
        form.setValue("tagIds", [...currentTagIds, tagId]);
      }
    },
    [form],
  );

  const handleAddNewTag = useCallback(async () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (!trimmed) return;

    // Check if tag name already exists
    const existingTag = tagNames.find((tag) => tag.toLowerCase() === trimmed);
    if (existingTag) {
      // Find the tag object to get its ID
      const tagObj = tags.find((t) => t.name === existingTag);
      if (tagObj?.id) {
        handleAddTag(tagObj.id);
      }
      setNewTagInput("");
      return;
    }

    // Create new tag
    const result = await createTagMutation.mutateAsync(trimmed);
    if (result?.data?.id) {
      handleAddTag(result.data.id);
    }
    setNewTagInput("");
  }, [newTagInput, tagNames, tags, handleAddTag, createTagMutation]);

  const handleAddNewCollection = useCallback(async () => {
    const trimmed = newCollectionInput.trim();
    if (!trimmed) return;
    const exists = collections.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      const existing = collections.find(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (existing)
        form.setValue(
          "collectionIds",
          Array.from(
            new Set([...(form.getValues("collectionIds") || []), existing.id]),
          ),
        );
      setNewCollectionInput("");
      return;
    }
    await createCollectionMutation.mutateAsync(trimmed);
    await refetchCollections();
    const created = collections.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (created)
      form.setValue(
        "collectionIds",
        Array.from(
          new Set([...(form.getValues("collectionIds") || []), created.id]),
        ),
      );
    setNewCollectionInput("");
  }, [
    newCollectionInput,
    collections,
    createCollectionMutation,
    form,
    refetchCollections,
  ]);

  const onSubmit = useCallback(
    async (values: SnippetFormData) => {
      const payload = {
        title: values.title,
        content: values.content,
        tag_ids: values.tagIds,
        is_public: values.isPublic,
        is_favorite: values.isFavorite,
        collection_ids: values.collectionIds,
      };
      await createSnippetMutation.mutateAsync(payload);

      // Reset form after successful submission
      form.reset();
      setNewTagInput("");
      setNewCollectionInput("");
    },
    [createSnippetMutation, form],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-2 md:p-4">
      <div className="max-w-5xl mx-auto">
        {(tagsLoading || collectionsLoading) && (
          <LoadingState label="Loading form data..." />
        )}
        {(tagsError || collectionsError) && (
          <ErrorState
            message="Failed to load form options"
            onRetry={() => {
              refetchTags();
              refetchCollections();
            }}
          />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {/* Title Card */}
              <Card className="bg-card border-border/50">
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Code2 className="h-4 w-4" />
                          Snippet Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a descriptive title for your snippet..."
                            {...field}
                            className="h-10 border-0 bg-background/80 shadow-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Collections + Tags side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Collections Card */}
                <Card className="bg-card border-border/50">
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="collectionIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Collections
                          </FormLabel>
                          <div className="space-y-2">
                            {collectionsLoading ? (
                              <div className="flex items-center justify-center py-4 text-muted-foreground">
                                <div className="animate-spin mr-2">⏳</div>
                                Loading collections...
                              </div>
                            ) : (
                              <MultiSelect
                                options={collectionOptions}
                                value={field.value}
                                onValueChange={(vals) => field.onChange(vals)}
                                placeholder="Select collections..."
                                className="border-0 bg-background/80 shadow-sm"
                              />
                            )}

                            <div className="flex gap-2">
                              <Input
                                placeholder="Create a new collection..."
                                value={newCollectionInput}
                                onChange={(e) =>
                                  setNewCollectionInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddNewCollection();
                                  }
                                }}
                                className="h-10 border-0 bg-background/80 shadow-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddNewCollection}
                                disabled={
                                  !newCollectionInput.trim() ||
                                  createCollectionMutation.isPending
                                }
                                className="px-3 bg-primary/10 hover:bg-primary/20 border-primary/20"
                              >
                                {createCollectionMutation.isPending ? (
                                  <span className="animate-spin">⏳</span>
                                ) : (
                                  <FolderPlus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Tags Card */}
                <Card className="bg-card border-border/50">
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="tagIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2 mb-3">
                            <TagIcon className="h-4 w-4" />
                            Tags
                          </FormLabel>

                          <div className="space-y-2">
                            {tagsLoading ? (
                              <div className="flex items-center justify-center py-4 text-muted-foreground">
                                <div className="animate-spin mr-2">⏳</div>
                                Loading tags...
                              </div>
                            ) : (
                              <MultiSelect
                                onValueChange={field.onChange}
                                value={field.value}
                                options={availableTags}
                                placeholder="Select existing tags..."
                                className="border-0 bg-background/80 shadow-sm"
                              />
                            )}

                            <div className="flex gap-2">
                              <Input
                                placeholder="Create a new tag..."
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddNewTag();
                                  }
                                }}
                                className="h-10 border-0 bg-background/80 shadow-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddNewTag}
                                disabled={
                                  !newTagInput.trim() ||
                                  createTagMutation.isPending
                                }
                                className="px-3 bg-primary/10 hover:bg-primary/20 border-primary/20"
                              >
                                {createTagMutation.isPending ? (
                                  <span className="animate-spin">⏳</span>
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Content Card */}
              <Card className="shadow-xl border-0 bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Content Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <MDXEditor
                            autoFocus
                            contentEditableClassName="prose dark:prose-invert"
                            onChange={field.onChange}
                            markdown={field.value}
                            plugins={[
                              headingsPlugin(),
                              listsPlugin(),
                              linkPlugin(),
                              quotePlugin(),
                              markdownShortcutPlugin(),
                              thematicBreakPlugin(),
                              linkDialogPlugin(),
                              imagePlugin(),
                              tablePlugin(),
                              directivesPlugin({
                                directiveDescriptors: [
                                  AdmonitionDirectiveDescriptor,
                                ],
                              }),
                              codeBlockPlugin({
                                defaultCodeBlockLanguage: "text",
                              }),
                              sandpackPlugin({
                                sandpackConfig: SANDPACK_CONFIG,
                              }),
                              codeMirrorPlugin({
                                codeBlockLanguages,
                                codeMirrorExtensions: [oneDark],
                              }),
                              toolbarPlugin({
                                toolbarContents: () => (
                                  <>
                                    <UndoRedo />
                                    <Separator />
                                    <BoldItalicUnderlineToggles />
                                    <CodeToggle />
                                    <HighlightToggle />
                                    <Separator />
                                    <StrikeThroughSupSubToggles />
                                    <Separator />
                                    <ListsToggle />
                                    <Separator />
                                    <BlockTypeSelect />
                                    <Separator />
                                    <CreateLink />
                                    <InsertImage />
                                    <Separator />
                                    <InsertTable />
                                    <InsertThematicBreak />
                                    <Separator />
                                    <InsertCodeBlock />
                                    <InsertSandpack />
                                    <Separator />
                                    <InsertAdmonition />
                                  </>
                                ),
                              }),
                            ]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Bottom: Settings + Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Settings Card */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <FormLabel className="text-sm font-medium">
                                Public
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Make this snippet visible to everyone
                              </p>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(v) =>
                                form.setValue("isPublic", v)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isFavorite"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Heart
                              className={`h-4 w-4 ${field.value ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
                            />
                            <div>
                              <FormLabel className="text-sm font-medium">
                                Favorite
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Add to your favorites
                              </p>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(v) =>
                                form.setValue("isFavorite", v)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Actions Card */}
                <Card className="bg-card border-border/50">
                  <CardContent className="space-y-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                      disabled={createSnippetMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {createSnippetMutation.isPending
                        ? "Creating..."
                        : "Create Snippet"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        form.reset();
                        setNewTagInput("");
                        setNewCollectionInput("");
                      }}
                      className="w-full h-10 bg-background/80 hover:bg-background"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Form
                    </Button>
                    {createSnippetMutation.isError && (
                      <ErrorState
                        message={
                          createSnippetMutation.error?.message ||
                          "An error occurred"
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
