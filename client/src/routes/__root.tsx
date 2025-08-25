import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useRouter } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import {
	Outlet,
	HeadContent,
	Scripts,
	createRootRoute,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "../components/theme-provider";

import ClerkProvider from "../integrations/clerk/provider.tsx";

import appCss from "../styles.css?url";
import { Separator } from "@/components/ui/separator.tsx";

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
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: () => (
		<RootDocument>
			<Outlet />
			{/* <TanStackRouterDevtools /> */}
		</RootDocument>
	),
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	let currentRoute = router.state.location.pathname.slice(1);
	currentRoute = currentRoute.charAt(0).toUpperCase() + currentRoute.slice(1);

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					<ClerkProvider>
						<SidebarProvider>
							<AppSidebar />
							<SidebarInset>
								<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
									<div className="flex items-center gap-2 px-4">
										<SidebarTrigger className="-ml-1" />
										<Separator
											orientation="vertical"
											className="mr-2 data-[orientation=vertical]:h-4"
										/>
										<span className="text-foreground">{currentRoute}</span>
									</div>
								</header>
								<div className="bg-red-500 flex-1 p-2">{children}</div>
							</SidebarInset>
						</SidebarProvider>
					</ClerkProvider>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}
