import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import {
  Check,
  FilePlus2,
  FileText,
  FolderOpen,
  Globe,
  Home,
  Search,
  Star,
} from "lucide-react";
import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator.tsx";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { showNotification } from "@/lib/notifications";
import ClerkProvider from "../integrations/clerk/provider.tsx";
import appCss from "../styles.css?url";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

import { NotFoundPage } from "@/components/404-page";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TokenInitializer } from "@/components/token-initializer";
import type { Collection, Snippet } from "@/types";

// NavItem component definition
const NavItem = (props: {
  to:
    | "/"
    | "/settings"
    | "/profile"
    | "/collections"
    | "/explore"
    | "/dashboard"
    | "/add-snippet"
    | "/snippet/$id"
    | "."
    | "..";
  icon: React.ReactNode;
  label: string;
  onSelect?: () => void;
  router: ReturnType<typeof useRouter>;
  pathname: string;
  setCommandOpen: (open: boolean) => void;
}) => (
  <CommandItem
    onSelect={() => {
      if (props.onSelect) props.onSelect();
      props.router.navigate({ to: props.to });
      props.setCommandOpen(false);
    }}
    className="!hover:bg-red-500 hover:color-red-500"
  >
    {props.icon}
    {props.label}
    {props.pathname === props.to && <Check className="ml-auto" />}
  </CommandItem>
);

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Snippy - Code Snippets Manager",
      },
      {
        name: "theme-color",
        content: "#7C3AED",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/icon-square.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon-square.svg" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "mask-icon", href: "/icon-square.svg", color: "#7C3AED" },
    ],
  }),

  component: () => (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RootDocument>
          <Outlet />
          {/* <TanStackRouterDevtools /> */}
        </RootDocument>
      </ErrorBoundary>
    </QueryClientProvider>
  ),

  notFoundComponent: () => <NotFoundPage />,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function getPageTitle(path: string) {
    const seg = path.split("/")[1] || "";
    if (!seg) return "Home";
    const map: Record<string, string> = {
      "add-snippet": "Add Snippet",
      snippet: "Snippet",
      library: "Library",
      explore: "Explore",
      dashboard: "Dashboard",
      settings: "Settings",
      profile: "Profile",
    };
    if (map[seg]) return map[seg];
    return seg
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }
  const currentPageTitle = getPageTitle(pathname);
  const [commandOpen, setCommandOpen] = React.useState(false);
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch data for command search (cached via React Query)
  const { data: snippetsData, error: _snippetsError } = useQuery({
    queryKey: ["snippets", "list"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/snippets`, {
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
        return (data?.data ?? data) as Snippet[];
      } catch (error) {
        showNotification.error(
          "Failed to fetch snippets",
          error instanceof Error ? error.message : "An error occurred",
        );
        throw error;
      }
    },
  });

  const { data: collectionsData, error: _collectionsError } = useQuery({
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

  // Ensure snippets and collections are always arrays, even if API calls fail
  const snippets = Array.isArray(snippetsData) ? snippetsData : [];
  const collections = Array.isArray(collectionsData) ? collectionsData : [];

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider>
          <TokenInitializer />
          <ThemeProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background border-b">
                  <div className="flex items-center gap-2 px-4 w-full">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <span className="text-foreground font-medium">
                      {currentPageTitle}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <ThemeToggle />
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setCommandOpen(true)}
                      >
                        <Search className="size-4" />
                        <span className="hidden sm:inline">Search</span>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          <span className="text-xs">⌘</span>K
                        </kbd>
                      </Button>
                    </div>
                  </div>
                </header>
                <div className="flex-1 p-2">{children}</div>
              </SidebarInset>
            </SidebarProvider>
            {/* React Query DevTools - only shows in development */}
            <ReactQueryDevtools initialIsOpen={false} />
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Search snippets, pages, collections..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <NavItem
                to="/"
                icon={<Home />}
                label="Home"
                router={router}
                pathname={pathname}
                setCommandOpen={setCommandOpen}
              />
              <NavItem
                to="/add-snippet"
                icon={<FilePlus2 />}
                label="Add Snippet"
                router={router}
                pathname={pathname}
                setCommandOpen={setCommandOpen}
              />
              <NavItem
                to="/collections"
                icon={<FileText />}
                label="Collections"
                router={router}
                pathname={pathname}
                setCommandOpen={setCommandOpen}
              />
              <NavItem
                to="/explore"
                icon={<FolderOpen />}
                label="Explore"
                router={router}
                pathname={pathname}
                setCommandOpen={setCommandOpen}
              />
              <NavItem
                to="/dashboard"
                icon={<Search />}
                label="Dashboard"
                router={router}
                pathname={pathname}
                setCommandOpen={setCommandOpen}
              />
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Snippets">
              {snippets.length === 0 ? (
                <CommandItem disabled>No snippets found</CommandItem>
              ) : (
                snippets.slice(0, 20).map((s: Snippet) => (
                  <CommandItem
                    key={s.id}
                    keywords={[
                      s.title,
                      s.content?.slice(0, 120) ?? "",
                      ...(s.is_public ? ["public"] : []),
                      ...(s.is_favorite ? ["favorite", "starred"] : []),
                    ]}
                    onSelect={() => {
                      setCommandOpen(false);
                      setTimeout(() => {
                        router.navigate({
                          to: "/snippet/$id",
                          params: { id: String(s.id) },
                        });
                      }, 0);
                    }}
                  >
                    {s.is_favorite ? (
                      <Star className="text-yellow-500" />
                    ) : s.is_public ? (
                      <Globe />
                    ) : (
                      <FileText />
                    )}
                    {s.title || `Snippet ${s.id}`}
                    {s.is_favorite && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        favorite
                      </span>
                    )}
                    {s.is_public && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        public
                      </span>
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
            <CommandGroup heading="Collections">
              {collections.length === 0 ? (
                <CommandItem disabled>No collections found</CommandItem>
              ) : (
                collections.slice(0, 20).map((c: Collection) => (
                  <CommandItem
                    key={c.id}
                    keywords={[c.name]}
                    onSelect={() => {
                      setCommandOpen(false);
                      setTimeout(() => {
                        router.navigate({ to: "/collections" });
                      }, 0);
                    }}
                  >
                    <FolderOpen />
                    {c.name}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => {
                  setCommandOpen(false);
                }}
              >
                <Search />
                Search in page
                <CommandShortcut>Ctrl/Cmd+K</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
        <Scripts />
      </body>
    </html>
  );
}
