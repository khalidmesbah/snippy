export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-red-500 mb-2">{message || "Something went wrong"}</p>
      {onRetry && (
        <button
          type="button"
          className="text-xs underline text-muted-foreground hover:text-foreground"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}
