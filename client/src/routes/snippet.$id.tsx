import { useUser } from "@clerk/clerk-react";
import {
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  imagePlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
} from "@mdxeditor/editor";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  GitFork,
  Globe,
  Heart,
  HeartOff,
  Loader2,
  Lock,
  Share,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import "@mdxeditor/editor/style.css";
import { oneDark } from "@codemirror/theme-one-dark";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthWrapper } from "@/components/auth-wrapper";
import { ErrorState, LoadingState } from "@/components/Loaders";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import { codeBlockLanguages } from "@/lib/codeBlockLanguages";
import { showNotification } from "@/lib/notifications";
import type { Snippet } from "@/types";

const _API_BASE_URL = "http://localhost:8080/api";

export const Route = createFileRoute("/snippet/$id")({
  loader: async () => {
    return {}; // use React Query in component
  },
  component: () => (
    <AuthWrapper>
      <SnippetDetail />
    </AuthWrapper>
  ),
});

function SnippetDetail() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const {
    data: snippet,
    isLoading,
    isError,
    error,
  } = useQuery<Snippet>({
    queryKey: ["snippets", "detail", id],
    queryFn: async () => {
      try {
        // First try to fetch as authenticated user (for own snippets)
        try {
          const res = await apiClient.get(`/snippets/${id}`);
          if (res.ok) {
            const data = await res.json();
            return data?.data;
          }
          // If we get a 404 or 500, it means the snippet doesn't exist or doesn't belong to the user
          showNotification.info(
            "Snippet access",
            "Trying public endpoint for snippet access",
          );
        } catch (_error) {
          showNotification.info(
            "Snippet access",
            "Authenticated access failed, trying public endpoint",
          );
        }

        // If authenticated fetch fails, try public endpoint
        const res = await apiClient.get(`/snippets/public/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Snippet not found or is private");
          }
          throw new Error(`Failed to fetch snippet: ${res.status}`);
        }
        const data = await res.json();
        return data?.data;
      } catch (error) {
        showNotification.error(
          "Failed to fetch snippet",
          error instanceof Error ? error.message : "An error occurred",
        );
        throw error;
      }
    },
    select: (s: Snippet) => ({ ...s, language: "plaintext" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Snippet>) => {
      const res = await apiClient.put(`/snippets/${id}`, payload);
      if (!res.ok) throw new Error("Failed to update snippet");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["snippets", "list"] });
      showNotification.success("Snippet updated successfully");
    },
    onError: (error) => {
      showNotification.error(
        "Failed to update snippet",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(`/snippets/${id}`);
      if (!res.ok) {
        showNotification.info(
          "Delete response",
          `Delete response status: ${res.status}`,
        );
        let msg = "Failed to delete snippet";
        try {
          const j = await res.json();
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      queryClient.invalidateQueries({ queryKey: ["snippets", "detail", id] });
      showNotification.success("Snippet deleted successfully");
    },
    onError: (error) => {
      showNotification.error(
        "Failed to delete snippet",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/snippets/${id}/fork`, {
        user_id: user?.id,
      });
      if (!res.ok) throw new Error("Failed to fork");
      const data = await res.json();
      return data.data?.id || "";
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ["snippets", "list"] });
      showNotification.success("Snippet forked successfully");
      navigate({ to: `/snippet/${newId}` });
    },
    onError: (error) => {
      showNotification.error(
        "Failed to fork snippet",
        error instanceof Error ? error.message : "An error occurred",
      );
    },
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userId = user?.id;
  const isOwner = !!snippet && snippet.user_id === userId;

  const handleCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      showNotification.error(
        "Copy failed",
        err instanceof Error ? err.message : "Failed to copy to clipboard",
      );
    }
  };

  const toggleFavorite = async () => {
    if (!snippet || !userId) return;
    await updateMutation.mutateAsync({ is_favorite: !snippet.is_favorite });
  };

  const togglePublic = async () => {
    if (!snippet || !userId || !isOwner) return;
    await updateMutation.mutateAsync({ is_public: !snippet.is_public });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync();
      setDeleteDialogOpen(false);
      navigate({ to: "/" });
    } finally {
      setDeleting(false);
    }
  };

  const handleFork = async () => {
    if (!snippet || !userId) return;
    await forkMutation.mutateAsync();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      showNotification.error(
        "Share failed",
        err instanceof Error ? err.message : "Failed to copy URL to clipboard",
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) return <LoadingState label="Loading snippet..." />;
  if (isError || !snippet)
    return (
      <ErrorState
        message={(error as Error)?.message || "Failed to load snippet"}
        onRetry={() =>
          queryClient.invalidateQueries({
            queryKey: ["snippets", "detail", id],
          })
        }
      />
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {snippet.is_public && (
            <Button variant="ghost" size="sm" onClick={handleShare}>
              {shareSuccess ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Share className="h-4 w-4" />
              )}
              {shareSuccess ? "Copied!" : "Share"}
            </Button>
          )}

          {!isOwner && snippet.is_public && (
            <Button variant="ghost" size="sm" onClick={handleFork}>
              <GitFork className="h-4 w-4" />
              Fork ({snippet.fork_count})
            </Button>
          )}

          {isOwner && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate({ to: "/edit-snippet/$id", params: { id } })
                }
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>

              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Snippet</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this snippet? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting || deleteMutation.isPending}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-2xl font-bold leading-tight">
              {snippet.title}
            </h1>
            <div className="flex flex-wrap gap-2 max-h-[100px] overflow-auto">
              {Array.isArray(snippet.tag_names) && snippet.tag_names.length > 0
                ? snippet.tag_names.map((tagName) => (
                    <Badge
                      key={tagName}
                      variant="secondary"
                      className="whitespace-nowrap"
                    >
                      {tagName}
                    </Badge>
                  ))
                : Array.isArray(snippet.tag_ids) && snippet.tag_ids.length > 0
                  ? snippet.tag_ids.map((tagId) => (
                      <Badge
                        key={tagId}
                        variant="secondary"
                        className="whitespace-nowrap"
                      >
                        {tagId}
                      </Badge>
                    ))
                  : null}
              {snippet.forked_from && (
                <Badge variant="outline" className="whitespace-nowrap">
                  <GitFork className="h-3 w-3 mr-1" />
                  Forked
                </Badge>
              )}
            </div>
          </div>

          <Separator className="my-2" />

          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 z-10"
              onClick={handleCopy}
            >
              {copySuccess ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <MDXEditor
              readOnly
              contentEditableClassName="prose dark:prose-invert"
              markdown={snippet.content || ""}
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                linkPlugin(),
                quotePlugin(),
                markdownShortcutPlugin(),
                thematicBreakPlugin(),
                imagePlugin(),
                tablePlugin(),
                codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
                codeMirrorPlugin({
                  codeBlockLanguages,
                  codeMirrorExtensions: [oneDark],
                }),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center gap-1">
            <span>By </span>
            <span className="font-bold capitalize">
              {user?.fullName || user?.username || "User anonymous"}
            </span>
          </div>
          <span>{formatDate(snippet.created_at)}</span>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePublic}
                className="h-8 px-2"
              >
                {snippet.is_public ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {snippet.is_public ? "Public" : "Private"}
              </Button>
            )}
            {!snippet.is_public && !isOwner && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFavorite}
            className="h-8 px-2"
          >
            {snippet.is_favorite ? (
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            ) : (
              <HeartOff className="h-4 w-4" />
            )}
          </Button>
          <span>Last updated {formatDate(snippet.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
