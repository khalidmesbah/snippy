import { Link, useLocation } from "@tanstack/react-router";
import { Code2, Moon, Sun } from "lucide-react";

import ClerkHeader from "../integrations/clerk/header-user.tsx";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useMounted } from "@/hooks/use-mounted";

export default function Header() {
	const location = useLocation();
	const { theme, setTheme } = useTheme();
	const mounted = useMounted();

	const toggleTheme = () => {
		if (theme === "light") {
			setTheme("dark");
		} else if (theme === "dark") {
			setTheme("system");
		} else {
			setTheme("light");
		}
	};

	const isActiveRoute = (path: string) => {
		return location.pathname === path;
	};

	const navItems = [
		{ path: "/", label: "Home" },
		{ path: "/explore", label: "Explore" },
		{ path: "/library", label: "Library" },
		{ path: "/profile", label: "Profile" },
	];

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center justify-between px-6">
				{/* Logo and Brand */}
				<div className="flex items-center space-x-8">
					<Link
						to="/"
						className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
					>
						<div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
							<Code2 className="w-5 h-5 text-white" />
						</div>
						<span className="font-bold text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
							Snippy
						</span>
					</Link>

					{/* Navigation */}
					<nav className="hidden md:flex items-center space-x-1">
						{navItems.map((item) => (
							<Link
								key={item.path}
								to={item.path}
								className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
									isActiveRoute(item.path)
										? "text-foreground bg-accent shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{item.label}
								{isActiveRoute(item.path) && (
									<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" />
								)}
							</Link>
						))}
					</nav>
				</div>

				{/* Right side actions */}
				<div className="flex items-center space-x-4">
					{/* Theme Toggle */}
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleTheme}
						className="w-9 h-9 hover:bg-accent"
					>
						{!mounted ? (
							<Moon className="h-4 w-4 transition-all" />
						) : theme === "dark" ? (
							<Sun className="h-4 w-4 transition-all" />
						) : theme === "light" ? (
							<Moon className="h-4 w-4 transition-all" />
						) : (
							<div className="h-4 w-4 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
						)}
						<span className="sr-only">Toggle theme</span>
					</Button>

					{/* Clerk Header */}
					<ClerkHeader />
				</div>

				{/* Mobile Navigation */}
				<div className="md:hidden flex items-center space-x-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleTheme}
						className="w-9 h-9"
					>
						{!mounted ? (
							<Moon className="h-4 w-4" />
						) : theme === "dark" ? (
							<Sun className="h-4 w-4" />
						) : theme === "light" ? (
							<Moon className="h-4 w-4" />
						) : (
							<div className="h-4 w-4 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
						)}
					</Button>
					<ClerkHeader />
				</div>
			</div>

			{/* Mobile Navigation Menu */}
			<div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
				<nav className="container px-6 py-3">
					<div className="flex items-center justify-around">
						{navItems.map((item) => (
							<Link
								key={item.path}
								to={item.path}
								className={`relative px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
									isActiveRoute(item.path)
										? "text-foreground bg-accent"
										: "text-muted-foreground hover:text-foreground hover:bg-accent/50"
								}`}
							>
								{item.label}
								{isActiveRoute(item.path) && (
									<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" />
								)}
							</Link>
						))}
					</div>
				</nav>
			</div>
		</header>
	);
}
