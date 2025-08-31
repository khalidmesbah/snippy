import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  User, 
  Mail, 
  Code2, 
  Globe, 
  Settings,
  Edit3,
  Save
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CompactSnippetCard } from "@/components/compact-snippet-card";
import { ProfileHello } from "@/components/profile-hello";
import { showNotification } from "@/lib/notifications";
import type { Snippet } from "@/types";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

// API functions
const fetchSnippets = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/snippets", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch snippets");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    showNotification.error("Failed to fetch snippets", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

const fetchPublicSnippets = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/snippets/my-public", {
      method: "GET",
      credentials: "include",
  });
    if (!response.ok) throw new Error("Failed to fetch public snippets");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    showNotification.error("Failed to fetch public snippets", error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
};

function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: true,
    showTotalSnippets: true,
    showPublicSnippets: true,
    showPublicSnippetsList: true,
  });

  // Fetch user's snippets
  const {
    data: userSnippets = [],
    isLoading: snippetsLoading,
    error: snippetsError,
  } = useQuery<Snippet[]>({
    queryKey: ["snippets"],
    queryFn: fetchSnippets,
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch public snippets
  const {
    data: publicSnippets = [],
    isLoading: publicSnippetsLoading,
    error: publicSnippetsError,
  } = useQuery<Snippet[]>({
    queryKey: ["public-snippets"],
    queryFn: fetchPublicSnippets,
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Handle loading and error states
  if (snippetsLoading || publicSnippetsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-2 md:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (snippetsError || publicSnippetsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-2 md:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Failed to load profile data</p>
            <p className="text-sm text-muted-foreground">
              {(snippetsError || publicSnippetsError)?.message || "Something went wrong"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-2 md:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    </div>;
  }

  // Show simple hello component for non-authenticated users on profile page
  if (!user) {
    return <ProfileHello />;
  }

  const totalSnippets = Array.isArray(userSnippets) ? userSnippets.length : 0;
  const publicSnippetsCount = Array.isArray(publicSnippets) ? publicSnippets.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-2 md:p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your profile and privacy settings</p>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image and Basic Info */}
            <div className="flex items-start gap-6">
              <div className="relative">
                <img
                  src={user.imageUrl || "/default-avatar.png"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                />
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {isEditing ? (
                      <Input
                        defaultValue={user.username || user.firstName || "Username"}
                        className="max-w-xs"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{user.username || user.firstName || "Username"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        defaultValue={user.primaryEmailAddress?.emailAddress || ""}
                        className="max-w-xs"
                        disabled
                      />
                    ) : (
                      <p className="text-base">{user.primaryEmailAddress?.emailAddress || "No email"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{totalSnippets}</p>
                <p className="text-sm text-muted-foreground">Total Snippets</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/10">
                  <Globe className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-2xl font-bold">{publicSnippetsCount}</p>
                <p className="text-sm text-muted-foreground">Public Snippets</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/10">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{Array.isArray(userSnippets) ? userSnippets.filter((s: any) => s.is_favorite).length : 0}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control what information is visible to other users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Show Email Address</Label>
                <p className="text-xs text-muted-foreground">Allow others to see your email</p>
              </div>
              <Switch
                checked={privacySettings.showEmail}
                onCheckedChange={(checked) => 
                  setPrivacySettings(prev => ({ ...prev, showEmail: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Show Total Snippets Count</Label>
                <p className="text-xs text-muted-foreground">Display your total snippets count</p>
              </div>
              <Switch
                checked={privacySettings.showTotalSnippets}
                onCheckedChange={(checked) => 
                  setPrivacySettings(prev => ({ ...prev, showTotalSnippets: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Show Public Snippets Count</Label>
                <p className="text-xs text-muted-foreground">Display your public snippets count</p>
              </div>
              <Switch
                checked={privacySettings.showPublicSnippets}
                onCheckedChange={(checked) => 
                  setPrivacySettings(prev => ({ ...prev, showPublicSnippets: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Show Public Snippets List</Label>
                <p className="text-xs text-muted-foreground">Allow others to browse your public snippets</p>
              </div>
              <Switch
                checked={privacySettings.showPublicSnippetsList}
                onCheckedChange={(checked) => 
                  setPrivacySettings(prev => ({ ...prev, showPublicSnippetsList: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Public Snippets */}
        {privacySettings.showPublicSnippetsList && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Public Snippets
              </CardTitle>
              <CardDescription>
                Your snippets that are visible to the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!Array.isArray(publicSnippets) || publicSnippets.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No public snippets yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Make some snippets public to share them with the community
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {Array.isArray(publicSnippets) && publicSnippets.map((snippet: any) => (
                    <CompactSnippetCard key={snippet.id} snippet={snippet} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
