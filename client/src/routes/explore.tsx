// explore.tsx
import { useUser } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Filter, X, Search, Globe } from "lucide-react";
import { useMemo, useState } from "react";
import { CompactSnippetCard } from "@/components/compact-snippet-card";
import { MultiSelect } from "@/components/multi-select";
import { Button } from "@/components/ui/button";
import { AuthWrapper } from "@/components/auth-wrapper";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { showNotification } from "@/lib/notifications";
import type { Snippet, Collection, Tag } from "@/types";

export const Route = createFileRoute("/explore")({
  notFoundComponent: () => <div>Not Found component</div>,
  component: () => (
    <AuthWrapper>
      <ExplorePage />
    </AuthWrapper>
  ),
});

// API functions
const fetchPublicSnippets = async (): Promise<Snippet[]> => {
  try {
    const response = await fetch("http://localhost:8080/api/snippets/public", {
      method: "GET",
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch snippets: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter for public snippets on the frontend
    const snippets = data.data || [];
    const publicSnippets = snippets.filter((snippet: Snippet) => snippet.is_public === true);
    
    return publicSnippets;
  } catch (error) {
    showNotification.error("Failed to fetch public snippets", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

const fetchCollections = async (): Promise<Collection[]> => {
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

const fetchTags = async (): Promise<Tag[]> => {
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

function ExplorePage() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tags: [],
    collections: [],
    forked: false,
    public: false,
    favorite: false,
  });

  const { user, isLoaded } = useUser();

  // TanStack Query hooks
  const {
    data: rawSnippets = [],
    isLoading: snippetsLoading,
    error: snippetsError,
  } = useQuery<Snippet[]>({
    queryKey: ["snippets", "public"],
    queryFn: fetchPublicSnippets,
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const {
    data: collections = [],
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    enabled: isLoaded && !!user,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  const {
    data: tags = [],
    isLoading: tagsLoading,
    error: tagsError,
  } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: fetchTags,
    enabled: isLoaded && !!user,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });

  const isLoading = snippetsLoading || collectionsLoading || tagsLoading;
  const error = snippetsError || collectionsError || tagsError;

  // Transform collections and tags for MultiSelect
  const collectionOptions = useMemo(() => {
    const list = Array.isArray(collections) ? collections : [];
    return list.map((collection) => ({
      label: collection.name,
      value: collection.id,
    }));
  }, [collections]);

  const tagOptions = useMemo(() => {
    const list = Array.isArray(tags) ? tags : [];
    return list.map((tag) => ({
      label: tag.name,
      value: tag.id,
    }));
  }, [tags]);

  // Apply filters and sorting
  const filteredSnippets = useMemo(() => {
    const source = Array.isArray(rawSnippets) ? rawSnippets : [];
    let filtered = [...source];

    // Apply search filter
    if (search) {
      filtered = filtered.filter((s) =>
        (s.title + s.content).toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Apply collection filter
    if (filters.collections.length > 0) {
      filtered = filtered.filter(
        (s) => s.collection_ids && s.collection_ids.some(id => filters.collections.includes(id)),
      );
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((s) => {
        if (!s.tag_ids || s.tag_ids.length === 0) return false;
        return s.tag_ids.some((tagId) => filters.tags.includes(tagId));
      });
    }

    // Apply boolean filters
    if (filters.forked)
      filtered = filtered.filter((s) => s.forked_from !== null);
    if (filters.public) filtered = filtered.filter((s) => s.is_public === true);
    if (filters.favorite)
      filtered = filtered.filter((s) => s.is_favorite === true);

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === "asc") return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    return filtered;
  }, [rawSnippets, search, sortField, sortOrder, filters]);

  const stats = useMemo(() => {
    const source = Array.isArray(rawSnippets) ? rawSnippets : [];
    return {
      totalCount: source.length,
      filteredCount: filteredSnippets.length,
      publicCount: source.filter((s) => s.is_public).length,
      favoriteCount: source.filter((s) => s.is_favorite).length,
    };
  }, [rawSnippets, filteredSnippets]);

  const clearAllFilters = () => {
    setFilters({
      tags: [],
      collections: [],
      forked: false,
      public: false,
      favorite: false,
    });
    setSearch("");
  };

  const toggleFilter = (filterType) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const hasActiveFilters = useMemo(() => {
    return (
      search ||
      filters.tags.length > 0 ||
      filters.collections.length > 0 ||
      filters.forked ||
      filters.public ||
      filters.favorite
    );
  }, [search, filters]);

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading public snippets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading data</p>
          <p className="text-sm text-muted-foreground">
            {error.message || "Something went wrong"}
          </p>
          <div className="text-xs text-muted-foreground mb-4">
            Make sure your backend server is running on http://localhost:8080
          </div>
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
          <h1 className="text-2xl font-bold mb-2">Explore Public Snippets</h1>
          <p className="text-muted-foreground mb-4">
            Please sign in to explore public code snippets from the community
          </p>
          <Button asChild>
            <Link to="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Explore Public Snippets
          </h1>
          <p className="text-muted-foreground text-sm">
            {stats.totalCount} total public snippets • Showing {stats.filteredCount}
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <Search className="w-4 h-4 mr-2" />
              My Snippets
            </Link>
          </Button>
          <Button asChild>
            <Link to="/add-snippet">
              <Plus className="w-4 h-4 mr-2" />
              Add Snippet
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-4 mb-6">
        {/* Search Bar and Filter Toggle */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search public snippets by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${hasActiveFilters ? "border-primary" : ""}`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1 text-xs">
                {[
                  filters.tags.length,
                  filters.collections.length,
                  filters.forked ? 1 : 0,
                  filters.public ? 1 : 0,
                  filters.favorite ? 1 : 0,
                  search ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Tags Filter */}
              <div className="flex flex-col gap-2">
                <label htmlFor="tags-filter" className="text-sm font-medium text-muted-foreground">
                  Tags
                </label>
                <MultiSelect
                  id="tags-filter"
                  options={tagOptions}
                  value={filters.tags}
                  onValueChange={(tags) =>
                    setFilters((prev) => ({ ...prev, tags }))
                  }
                  placeholder="Select tags..."
                  maxCount={2}
                />
              </div>

              {/* Collections Filter */}
              <div className="flex flex-col gap-2">
                <label htmlFor="collections-filter" className="text-sm font-medium text-muted-foreground">
                  Collections
                </label>
                <MultiSelect
                  id="collections-filter"
                  options={collectionOptions}
                  value={filters.collections}
                  onValueChange={(collections) =>
                    setFilters((prev) => ({ ...prev, collections }))
                  }
                  placeholder="Select collections..."
                  maxCount={2}
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Quick Filters
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.favorite ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter("favorite")}
                  >
                    Favorites
                  </Button>
                  <Button
                    variant={filters.public ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter("public")}
                  >
                    Public
                  </Button>
                  <Button
                    variant={filters.forked ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter("forked")}
                  >
                    Forked
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Sort Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="sort-field" className="text-sm font-medium text-muted-foreground">
                  Sort by:
                </label>
                <select
                  id="sort-field"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="border rounded px-3 py-1 bg-background text-foreground text-sm"
                >
                  <option value="created_at">Created Date</option>
                  <option value="updated_at">Updated Date</option>
                  <option value="title">Title</option>
                </select>
              </div>

              <ToggleGroup
                type="single"
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v || "desc")}
                className="items-center"
              >
                <ToggleGroupItem value="desc" size="sm">
                  Newest First
                </ToggleGroupItem>
                <ToggleGroupItem value="asc" size="sm">
                  Oldest First
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredSnippets.length} of {stats.totalCount} public snippets
          {hasActiveFilters && " (filtered)"}
        </p>

        {hasActiveFilters && (
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{stats.publicCount} public</span>
            <span>•</span>
            <span>{stats.favoriteCount} favorites</span>
          </div>
        )}
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSnippets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            {hasActiveFilters ? (
              <div>
                <p className="text-muted-foreground mb-2">
                  No public snippets match your current filters
                </p>
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : stats.totalCount === 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-2">No public snippets yet</h3>
                <p className="text-muted-foreground mb-4">
                  There are no public code snippets available at the moment
                </p>
                <Button asChild>
                  <Link to="/add-snippet">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Snippet
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No public snippets found</p>
            )}
          </div>
        ) : (
          filteredSnippets.map((snippet) => (
                            <CompactSnippetCard key={snippet.id} snippet={snippet} />
          ))
        )}
      </div>

      {/* Load More / Pagination could go here */}
      {filteredSnippets.length > 0 &&
        filteredSnippets.length < stats.totalCount && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Showing {filteredSnippets.length} of {stats.totalCount} public snippets
            </p>
          </div>
        )}
    </div>
  );
}
