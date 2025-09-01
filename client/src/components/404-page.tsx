import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Code, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                404
              </h1>
            </div>

            {/* Main Message */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Page Not Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Oops! The page you're looking for doesn't exist. It might have
                been moved, deleted, or you entered the wrong URL.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Link to="/">
                <Button className="w-full h-12 text-base" variant="default">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Home
                </Button>
              </Link>

              <Link to="/explore">
                <Button className="w-full h-12 text-base" variant="outline">
                  <Search className="mr-2 h-5 w-5" />
                  Explore Snippets
                </Button>
              </Link>
            </div>

            {/* Additional Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <Link to="/dashboard">
                <Button className="w-full" variant="ghost" size="sm">
                  <Code className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              <Link to="/collections">
                <Button className="w-full" variant="ghost" size="sm">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Collections
                </Button>
              </Link>

              <Button
                className="w-full"
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-sm text-slate-500 dark:text-slate-500">
              <p className="mb-2">Need help? Try these common pages:</p>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                <Link
                  to="/add-snippet"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Add Snippet
                </Link>
                <Link
                  to="/collections"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Collections
                </Link>
                <Link
                  to="/settings"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Settings
                </Link>
                <Link
                  to="/profile"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
