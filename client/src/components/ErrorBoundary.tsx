import * as React from "react";
import { showNotification } from "@/lib/notifications";

type ErrorBoundaryProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: unknown;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    showNotification.error(
      "Application Error",
      error instanceof Error ? error.message : "An unexpected error occurred",
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="text-center max-w-md">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {(this.state.error as Error)?.message ||
                "An unexpected error occurred."}
            </p>
            <button
              type="button"
              className="px-3 py-2 border rounded-md text-sm"
              onClick={() =>
                typeof window !== "undefined"
                  ? window.location.reload()
                  : this.handleReset()
              }
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
