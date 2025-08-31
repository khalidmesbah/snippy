import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AuthWrapper } from "@/components/auth-wrapper";
import { SnippetsGrid } from "@/components/snippets/snippets-grid";
import { CollectionHeader } from "@/components/collections/collection-header";
import { getCollectionWithSnippets, updateCollectionSnippetPositions } from "@/lib/api/collections";
import type { PositionUpdate } from "@/lib/api/collections";
import { showNotification } from "@/lib/notifications";

export const Route = createFileRoute("/collection/$id")({
  component: () => (
    <AuthWrapper>
      <CollectionDetailPage />
    </AuthWrapper>
  ),
});

function CollectionDetailPage() {
  const { user, isLoaded } = useUser();
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Fetch collection with snippets
  const {
    data: collectionData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => getCollectionWithSnippets(id),
    enabled: isLoaded && !!user && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Update snippet positions mutation
  const updatePositionsMutation = useMutation({
    mutationFn: (positions: PositionUpdate[]) => updateCollectionSnippetPositions(id, positions),
    onSuccess: () => {
      // Invalidate and refetch collection data
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      setHasPendingChanges(false);
      showNotification.success("Snippet positions saved successfully");
    },
    onError: (error) => {
      showNotification.error("Failed to update snippet positions", error instanceof Error ? error.message : "An error occurred");
    },
  });

  const collection = collectionData?.data?.collection;
  const snippets = collectionData?.data?.snippets || [];

  const handlePositionsUpdate = (positions: PositionUpdate[]) => {
    // This is now just for UI updates, not for saving to the server
    // The actual saving happens when the save button is clicked
  };

  const handleSavePositions = (positions: PositionUpdate[]) => {
    updatePositionsMutation.mutate(positions);
  };

  const handlePositionsSaved = () => {
    setHasPendingChanges(false);
  };

  const handlePendingChanges = (hasChanges: boolean) => {
    setHasPendingChanges(hasChanges);
  };

  const handleEditSuccess = () => {
    // Refetch collection data to get updated name and color
    refetch();
    // Also invalidate collections list to update the collections page
    queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const handleDeleteSuccess = () => {
    // Navigate back to collections page after deletion
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    navigate({ to: "/collections" });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </div>
    );
  }

  // Loading state for collection data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Collection Header Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Snippets Grid Skeleton */}
          <div className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
                <div key={key} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Error Loading Collection
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || "An unknown error occurred"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Collection Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The collection you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Collection Header */}
      <CollectionHeader
        collection={collection}
        snippetCount={snippets.length}
        onAddSnippet={() => navigate({ to: "/add-snippet", search: { collectionId: id } })}
        onEditSuccess={handleEditSuccess}
        onDeleteSuccess={handleDeleteSuccess}
      />

      {/* Snippets Grid */}
      <div className="mt-8">
        <SnippetsGrid
          snippets={snippets}
          collectionId={id}
          isLoading={isLoading}
          onRefresh={refetch}
          onPositionsUpdate={handlePositionsUpdate}
          onSavePositions={handleSavePositions}
          isUpdatingPositions={updatePositionsMutation.isPending}
          onPositionsSaved={handlePositionsSaved}
          onPendingChanges={handlePendingChanges}
        />
      </div>
    </div>
  );
}
