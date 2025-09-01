import { createFileRoute } from "@tanstack/react-router";
import { Bell, Palette, Settings, Shield, User } from "lucide-react";
import React, { useId } from "react";
import { AuthWrapper } from "@/components/auth-wrapper";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useThemeSwitcher } from "@/hooks/use-theme-switcher";
import { showNotification } from "@/lib/notifications";

export const Route = createFileRoute("/settings")({
  component: () => (
    <AuthWrapper>
      <RouteComponent />
    </AuthWrapper>
  ),
});

function RouteComponent() {
  const { theme, isLight } = useThemeSwitcher();
  const [emailNotifications, setEmailNotifications] = React.useState(false);
  const [pushNotifications, setPushNotifications] = React.useState(false);
  const [publicProfile, setPublicProfile] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);

  // Generate unique IDs for form elements
  const emailNotificationsId = useId();
  const pushNotificationsId = useId();
  const publicProfileId = useId();
  const analyticsId = useId();
  const fileInputId = useId();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how Snippy looks and feels on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-toggle">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Current theme:{" "}
                <span className="font-medium capitalize">{theme}</span>
              </span>
              <span>•</span>
              <span>
                Active:{" "}
                <span className="font-medium">
                  {isLight ? "Light" : "Dark"}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={emailNotificationsId}>
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your snippets
                </p>
              </div>
              <Switch
                id={emailNotificationsId}
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  setEmailNotifications(checked);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={pushNotificationsId}>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new features and updates
                </p>
              </div>
              <Switch
                id={pushNotificationsId}
                checked={pushNotifications}
                onCheckedChange={(checked) => {
                  setPushNotifications(checked);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Control your privacy and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={publicProfileId}>Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your public snippets
                </p>
              </div>
              <Switch
                id={publicProfileId}
                checked={publicProfile}
                onCheckedChange={(checked) => {
                  setPublicProfile(checked);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={analyticsId}>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve Snippy with anonymous usage data
                </p>
              </div>
              <Switch
                id={analyticsId}
                checked={analytics}
                onCheckedChange={(checked) => {
                  setAnalytics(checked);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Account Type</Label>
                <p className="text-sm text-muted-foreground">Free Plan</p>
              </div>
              <Button variant="outline" size="sm">
                Upgrade
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Export</Label>
                <p className="text-sm text-muted-foreground">
                  Download all your snippets and data
                </p>
              </div>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Import</Label>
                <p className="text-sm text-muted-foreground">
                  Import snippets from a backup file
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  id={fileInputId}
                  accept=".json,.zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Handle file import logic here
                      showNotification.info(
                        "File import",
                        `Importing file: ${file.name}`,
                      );
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(fileInputId)?.click()}
                >
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
