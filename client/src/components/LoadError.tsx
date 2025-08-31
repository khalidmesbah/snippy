import * as React from "react";

export function LoadError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold mb-2">Failed to load data</h2>
        <p className="text-sm text-muted-foreground mb-4">{message || "Please try again."}</p>
        {onRetry && (
          <button className="px-3 py-2 border rounded-md text-sm" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}


