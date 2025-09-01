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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { SnippetFormData } from "@/types";
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
  Trash2,
} from "lucide-react";
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
import { sandpackPresets } from "@/lib/sandpackPresets";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

import { AuthWrapper } from "@/components/auth-wrapper";
import { ErrorState, LoadingState } from "@/components/Loaders";

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

interface ApiSnippet {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  is_favorite: boolean;
  collection_ids: string[];
  tag_ids: string[];
}

export const Route = createFileRoute("/edit-snippet/$id")({
  component: () => (
    <AuthWrapper>
      <RouteComponent />
    </AuthWrapper>
  ),
});

export function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<SnippetFormData>({
    resolver: zodResolver(snippetSchema),
    defaultValues: {
      title: "",
      collectionIds: [],
      tagIds: [],
      isPublic: false,
      isFavorite: false,
      content: "",
    },
  });

  // Load current snippet
  const {
    data: snippet,
    isLoading,
    isError,
    error,
  } = useQuery<ApiSnippet>({
    queryKey: ["snippets", "detail", id],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/snippets/${id}`, {
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
        return (data?.data ?? data) as ApiSnippet;
      } catch (error) {
        showNotification.error(
          "Failed to fetch snippet",
          error instanceof Error ? error.message : "An error occurred",
        );
        throw error;
      }
    },
  });

  // Tags
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
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

  // Update snippet
  const updateSnippetMutation = useMutation({
    mutationFn: async (payload: SnippetFormData) => {
      const res = await fetch(`${API_BASE_URL}/snippets/${id}`, {
        method: "PUT",
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
      queryClient.invalidateQueries({ queryKey: ["snippets", "detail", id] });
      showNotification.success("Snippet updated successfully");
      navigate({ to: `/snippet/${id}` });
    },
    onError: (error) => {
      showNotification.error(
        "Failed to update snippet",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
  });

  // Delete snippet
  const deleteSnippetMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/snippets/${id}`, {
          method: "DELETE",
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
        return res.json();
      } catch (_error: unknown) {
        // Extract meaningful error message
        let errorMessage = "Failed to delete snippet";
        if (error?.response?.status === 500) {
          errorMessage =
            "Server error: Unable to delete snippet. Please try again.";
        } else if (error?.response?.status === 404) {
          errorMessage = "Snippet not found or already deleted.";
        } else if (error?.response?.status === 403) {
          errorMessage = "You don't have permission to delete this snippet.";
        } else if (error?.response?.status === 401) {
          errorMessage = "Authentication required. Please log in again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      queryClient.invalidateQueries({ queryKey: ["snippets", "detail", id] });
      showNotification.success("Snippet deleted successfully");
      navigate({ to: "/" });
    },
    onError: (error: unknown) => {
      showNotification.error(
        "Failed to delete snippet",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
    retry: (failureCount, error: unknown) => {
      // Don't retry on client errors (4xx)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 2 times for server errors (5xx)
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Prefill form when snippet loads
  useEffect(() => {
    if (!snippet) return;

    const initialCollections = snippet.collection_ids || [];
    const initialTagIds = snippet.tag_ids || [];

    // Set form values individually to ensure proper updates
    form.setValue("title", snippet.title || "");
    form.setValue("collectionIds", initialCollections);
    form.setValue("tagIds", initialTagIds);
    form.setValue("isPublic", !!snippet.is_public);
    form.setValue("isFavorite", !!snippet.is_favorite);
    form.setValue("content", snippet.content || "");

    // Also reset the form to ensure all values are properly set
    form.reset({
      title: snippet.title || "",
      collectionIds: initialCollections,
      tagIds: initialTagIds,
      isPublic: !!snippet.is_public,
      isFavorite: !!snippet.is_favorite,
      content: snippet.content || "",
    });
  }, [snippet, form]);

  const availableTags = useMemo(
    () => tags.map((t) => ({ label: t.name, value: t.id })),
    [tags],
  );
  const collectionOptions = useMemo(
    () => collections.map((c) => ({ label: c.name, value: c.id })),
    [collections],
  );

  const [newTagInput, setNewTagInput] = useState("");
  const [newCollectionInput, setNewCollectionInput] = useState("");

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
    const existingTag = tags.find((tag) => tag.name.toLowerCase() === trimmed);
    if (existingTag) {
      handleAddTag(existingTag.id);
      setNewTagInput("");
      return;
    }

    // Create new tag
    const result = await createTagMutation.mutateAsync(trimmed);
    if (result?.data?.id) {
      handleAddTag(result.data.id);
    }
    setNewTagInput("");
  }, [newTagInput, tags, handleAddTag, createTagMutation]);

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
        form.setValue("collectionIds", [
          ...form.getValues("collectionIds"),
          existing.id,
        ]);
      setNewCollectionInput("");
      return;
    }
    await createCollectionMutation.mutateAsync(trimmed);
    await refetchCollections();
    const created = collections.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (created)
      form.setValue("collectionIds", [
        ...form.getValues("collectionIds"),
        created.id,
      ]);
    setNewCollectionInput("");
  }, [
    newCollectionInput,
    collections,
    createCollectionMutation,
    form,
    refetchCollections,
  ]);

  const handleDeleteSnippet = useCallback(async () => {
    const snippetTitle = snippet?.title || "this snippet";
    const confirmed = window.confirm(
      `Are you sure you want to delete "${snippetTitle}"?\n\nThis action cannot be undone and will permanently remove the snippet.`,
    );

    if (confirmed) {
      try {
        await deleteSnippetMutation.mutateAsync();
      } catch (_error: unknown) {
        // Error is already handled by the mutation, but we can add additional handling here if needed
      }
    }
  }, [deleteSnippetMutation, snippet?.title]);

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
      await updateSnippetMutation.mutateAsync(payload);
    },
    [updateSnippetMutation],
  );

  if (isLoading) return <LoadingState label="Loading snippet..." />;
  if (isError)
    return <ErrorState message={error?.message || "Failed to load snippet"} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-2 md:p-4">
      <div className="max-w-5xl mx-auto">
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
                            markdown={field.value || snippet?.content || ""}
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
                                defaultCodeBlockLanguage: "js",
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
                      disabled={updateSnippetMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateSnippetMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => navigate({ to: `/snippet/${id}` })}
                      className="w-full h-10 bg-background/80 hover:bg-background"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="lg"
                      onClick={handleDeleteSnippet}
                      disabled={
                        deleteSnippetMutation.isPending ||
                        updateSnippetMutation.isPending
                      }
                      className="w-full h-10"
                    >
                      {deleteSnippetMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Snippet
                        </>
                      )}
                    </Button>
                    {updateSnippetMutation.isError && (
                      <ErrorState
                        message={
                          updateSnippetMutation.error?.message ||
                          "An error occurred"
                        }
                      />
                    )}
                    {deleteSnippetMutation.isError && (
                      <ErrorState
                        message={
                          deleteSnippetMutation.error?.message ||
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
