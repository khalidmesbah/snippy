import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { AuthWrapper } from "@/components/auth-wrapper";
import { CollectionsGrid } from "@/components/collections/collections-grid";
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { getCollections, updateCollectionPositions } from "@/lib/api/collections";
import type { PositionUpdate } from "@/lib/api/collections";
import { LoadingState, ErrorState } from "@/components/Loaders";
import { showNotification } from "@/lib/notifications";

export const Route = createFileRoute("/collections")({
  component: () => (
    <AuthWrapper>
      <CollectionsPage />
    </AuthWrapper>
  ),
});

function CollectionsPage() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const [hasMounted, setHasMounted] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const collectionsGridRef = useRef<{ handleSavePositions: () => void }>(null);

  // Fetch collections with TanStack Query
  const {
    data: collectionsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["collections"],
    queryFn: getCollections,
    enabled: hasMounted && isLoaded && !!user,
    staleTime: 0, // Always refetch when navigating
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    gcTime: 0, // Don't cache the data
  });

  // Update positions mutation
  const updatePositionsMutation = useMutation({
    mutationFn: updateCollectionPositions,
    onSuccess: () => {
      // Invalidate and refetch collections to get updated data
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (error) => {
      showNotification.error("Failed to update collection positions", error instanceof Error ? error.message : "An error occurred");
    },
  });

  // Check if we're updating positions
  const isUpdatingPositions = updatePositionsMutation.isPending;

  // Handle saving position changes
  const handleSavePositions = (positions: PositionUpdate[]) => {
    updatePositionsMutation.mutate(positions);
  };

  // Handle when positions are successfully saved
  const handlePositionsSaved = () => {
    setHasPendingChanges(false);
  };

  // Handle when there are pending changes
  const handlePendingChanges = (hasChanges: boolean) => {
    setHasPendingChanges(hasChanges);
  };

  const collections = collectionsData?.data || [];
  
  // Mark component as mounted
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Ensure collections are fetched when component mounts
  useEffect(() => {
    if (hasMounted && isLoaded && user) {
      // Force a refetch to ensure data is loaded
      setTimeout(() => {
        refetch();
      }, 100);
    }
  }, [hasMounted, isLoaded, user, refetch]);

  const handlePositionsUpdate = (positions: PositionUpdate[]) => {
    // This is now just for UI updates, not for saving to the server
    // The actual saving happens when the save button is clicked
  };

  const handleEditSuccess = () => {
    // Collections will be automatically refetched by the mutation
  };

  const handleDeleteSuccess = () => {
    // Collections will be automatically refetched by the mutation
  };

  if (!isLoaded) {
    return <LoadingState label="Loading user..." />;
  }

  if (isLoaded && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to view your collections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Collections
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Organize your code snippets into collections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              collectionsGridRef.current?.handleSavePositions();
            }}
            disabled={isUpdatingPositions}
            className="flex items-center gap-2"
          >
            {isUpdatingPositions ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isUpdatingPositions ? "Saving..." : "Save Changes"}
          </Button>
          <CreateCollectionDialog />
        </div>
      </div>

      {/* Initial Loading State */}
      {isLoading && !collectionsData && (
        <div className="py-12">
          <LoadingState label="Loading collections..." />
        </div>
      )}

      {/* Loading State with Header (when refreshing) */}
      {isLoading && collectionsData && (
        <div className="py-8">
          <div className="text-center">
            <LoadingState label="Refreshing collections..." />
          </div>
        </div>
      )}

      {/* Loading State when component is mounted but no data yet */}
      {hasMounted && isLoaded && user && !collectionsData && !isLoading && (
        <div className="py-12">
          <LoadingState label="Preparing collections..." />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="py-12">
          <ErrorState 
            message={error.message || "An unknown error occurred"}
            onRetry={() => refetch()}
          />
        </div>
      )}

      {/* Collections Grid */}
      {!isLoading && !error && collectionsData && (
        <CollectionsGrid
          ref={collectionsGridRef}
          collections={collections}
          isLoading={isLoading}
          error={error}
          onRefresh={refetch}
          onPositionsUpdate={handlePositionsUpdate}
          onEditSuccess={handleEditSuccess}
          onDeleteSuccess={handleDeleteSuccess}
          onSavePositions={handleSavePositions}
          isUpdatingPositions={isUpdatingPositions}
          onPositionsSaved={handlePositionsSaved}
          onPendingChanges={handlePendingChanges}
        />
      )}
    </div>
  );
}
