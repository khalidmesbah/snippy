import { Code2, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AnonymousView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-2 md:p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to Snippy</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Discover and share code snippets with the developer community
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                window.location.href = "/sign-in";
              }}
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/sign-up";
              }}
            >
              Create Account
            </Button>
          </div>
        </div>

        {/* Demo Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Featured Public Snippets
            </CardTitle>
            <CardDescription>
              Explore some of the best public snippets from our community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Sign in to view featured snippets
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Join thousands of developers sharing their code
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center p-6">
              <Code2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Code Snippets</h3>
              <p className="text-sm text-muted-foreground">
                Save and organize your favorite code snippets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center p-6">
              <Globe className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Share & Discover</h3>
              <p className="text-sm text-muted-foreground">
                Share your code with the community and discover new solutions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center p-6">
              <Settings className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Organize</h3>
              <p className="text-sm text-muted-foreground">
                Organize snippets with collections and tags
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
