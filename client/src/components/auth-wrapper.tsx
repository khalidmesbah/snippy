import { useUser } from "@clerk/clerk-react";
import { AnonymousView } from "./anonymous-view";

interface AuthWrapperProps {
  children: React.ReactNode;
  isProtected?: boolean;
}

export function AuthWrapper({ children, isProtected = true }: AuthWrapperProps) {
  const { user, isLoaded } = useUser();

  // If still loading, show nothing (parent component should handle loading)
  if (!isLoaded) {
    return null;
  }

  // If route is not protected, always show children
  if (!isProtected) {
    return <>{children}</>;
  }

  // If route is protected and user is not authenticated, show AnonymousView
  if (!user) {
    return <AnonymousView />;
  }

  // If route is protected and user is authenticated, show children
  return <>{children}</>;
}
