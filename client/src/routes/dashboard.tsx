// dashboard.tsx
import { useUser } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Star, GitFork, Clock, Heart, Globe, Eye, Folder, Tag } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthWrapper } from "@/components/auth-wrapper";
import { showNotification } from "@/lib/notifications";
import { CompactSnippetCard } from "@/components/compact-snippet-card";

export const Route = createFileRoute("/dashboard")({
  notFoundComponent: () => <div>Not Found component</div>,
  component: () => (
    <AuthWrapper>
      <Dashboard />
    </AuthWrapper>
  ),
});

// API functions
const fetchSnippets = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/snippets", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch snippets");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    showNotification.error("Failed to fetch snippets", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

const fetchCollections = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/collections", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch collections");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    showNotification.error("Failed to fetch collections", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

const fetchTags = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/tags", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch tags");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    showNotification.error("Failed to fetch tags", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};



function Dashboard() {
  const { user, isLoaded } = useUser();

  // TanStack Query hooks
  const {
    data: rawSnippets = [],
    isLoading: snippetsLoading,
    error: snippetsError,
  } = useQuery({
    queryKey: ["snippets"],
    queryFn: fetchSnippets,
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const {
    data: rawCollections = [],
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const {
    data: rawTags = [],
    isLoading: tagsLoading,
    error: tagsError,
  } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Compute dashboard data
  const dashboardData = useMemo(() => {
    const source = Array.isArray(rawSnippets) ? rawSnippets : [];
    const collections = Array.isArray(rawCollections) ? rawCollections : [];
    const tags = Array.isArray(rawTags) ? rawTags : [];
    
    // Helper function to enrich snippets with tag names and collection info
    const enrichSnippet = (snippet: any) => {
      const tagNames = snippet.tag_ids 
        ? tags.filter((tag: any) => snippet.tag_ids.includes(tag.id)).map((tag: any) => tag.name)
        : [];
      
      const collectionId = collections.find((col: any) => 
        col.snippet_ids && col.snippet_ids.includes(snippet.id)
      )?.id || null;
      
      return {
        ...snippet,
        tag_names: tagNames,
        collection_id: collectionId,
      };
    };
    
    return {
      recentSnippets: [...source]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(enrichSnippet),
      favoriteSnippets: source
        .filter((s: any) => s.is_favorite)
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 8)
        .map(enrichSnippet),
      forkedSnippets: source
        .filter((s: any) => s.forked_from !== null)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(enrichSnippet),
      popularSnippets: source
        .filter((s: any) => s.fork_count > 0)
        .sort((a: any, b: any) => b.fork_count - a.fork_count)
        .slice(0, 5)
        .map(enrichSnippet),
      topPublicSnippets: source
        .filter((s: any) => s.is_public)
        .sort((a: any, b: any) => b.fork_count - a.fork_count)
        .slice(0, 5)
        .map(enrichSnippet),
    };
  }, [rawSnippets, rawCollections, rawTags]);

  const stats = useMemo(
    () => {
      const source = Array.isArray(rawSnippets) ? rawSnippets : [];
      const collections = Array.isArray(rawCollections) ? rawCollections : [];
      const tags = Array.isArray(rawTags) ? rawTags : [];
      return {
        totalCount: source.length,
        publicCount: source.filter((s: any) => s.is_public).length,
        favoriteCount: source.filter((s: any) => s.is_favorite).length,
        forkedCount: source.filter((s: any) => s.forked_from !== null).length,
        totalForks: source.reduce((sum: number, s: any) => sum + (s.fork_count || 0), 0),
        collectionsCount: collections.length,
        tagsCount: tags.length,
      };
    },
    [rawSnippets, rawCollections, rawTags],
  );

  // Loading state
  if (!isLoaded || snippetsLoading || collectionsLoading || tagsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (snippetsError || collectionsError || tagsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading data</p>
          <p className="text-sm text-muted-foreground">
            {(snippetsError || collectionsError || tagsError)?.message || "Something went wrong"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">
            Please sign in to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            {stats.totalCount} snippets • {stats.publicCount} public •{" "}
            {stats.favoriteCount} favorites • {stats.totalForks} total forks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">View All Snippets</Link>
          </Button>
          <Button asChild>
            <Link to="/add-snippet">
              <Plus className="w-4 h-4 mr-2" />
              Add Snippet
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Snippets
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publicCount} public
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collectionsCount}</div>
            <p className="text-xs text-muted-foreground">organizing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tagsCount}</div>
            <p className="text-xs text-muted-foreground">categorizing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forked</CardTitle>
            <GitFork className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.forkedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forks</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalForks}</div>
            <p className="text-xs text-muted-foreground">of your snippets</p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Snippets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <CardTitle className="text-lg">Recently Added</CardTitle>
            </div>
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardData.recentSnippets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No snippets yet</p>
            ) : (
              dashboardData.recentSnippets.map((snippet) => (
                <CompactSnippetCard key={snippet.id} snippet={snippet} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Favorite Snippets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <CardTitle className="text-lg">Favorites</CardTitle>
            </div>
            <Badge variant="secondary">
              {dashboardData.favoriteSnippets.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardData.favoriteSnippets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No favorite snippets yet
              </p>
            ) : (
              dashboardData.favoriteSnippets.map((snippet) => (
                <CompactSnippetCard key={snippet.id} snippet={snippet} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Recently Forked */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <GitFork className="h-4 w-4" />
              <CardTitle className="text-lg">Recently Forked</CardTitle>
            </div>
            <Badge variant="secondary">
              {dashboardData.forkedSnippets.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardData.forkedSnippets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No forked snippets yet
              </p>
            ) : (
              dashboardData.forkedSnippets.map((snippet) => (
                <CompactSnippetCard key={snippet.id} snippet={snippet} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Most Popular */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <CardTitle className="text-lg">Popular Snippets</CardTitle>
            </div>
            <Badge variant="secondary">
              {dashboardData.popularSnippets.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardData.popularSnippets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No popular snippets yet
              </p>
            ) : (
              dashboardData.popularSnippets.map((snippet) => (
                <CompactSnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  showStats
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Public Snippets */}
      {dashboardData.topPublicSnippets.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <CardTitle className="text-lg">
                Your Most Forked Public Snippets
              </CardTitle>
            </div>
            <Badge variant="secondary">
              {dashboardData.topPublicSnippets.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboardData.topPublicSnippets.map((snippet) => (
                <CompactSnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  showStats
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
