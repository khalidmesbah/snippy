"use client"

import { useAuth } from "@/components/auth-provider"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogIn, Edit, Save, X, Code, Heart, GitFork, Calendar, AlertCircle, Folder } from "lucide-react"
import { useStore } from "@/lib/store"

interface UserStats {
  total_snippets: number
  public_snippets: number
  private_snippets: number
  favorite_snippets: number
  total_forks: number
  collections_count: number
}

interface ActivityItem {
  type: "created" | "updated" | "favorited" | "unfavorited"
  title: string
  date: string
  snippet_id: string
}

interface UserProfile {
  name: string
  bio: string
}

export default function ProfilePage() {
  const { user, isConfigured } = useAuth()
  const { getUserSnippets, getSortedCollections, currentUserId, loading } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    total_snippets: 0,
    public_snippets: 0,
    private_snippets: 0,
    favorite_snippets: 0,
    total_forks: 0,
    collections_count: 0,
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    bio: "",
  })
  const [editForm, setEditForm] = useState<UserProfile>({
    name: "",
    bio: "",
  })

  // Load user profile from localStorage
  useEffect(() => {
    if (currentUserId) {
      const profileKey = `snippy-profile-${currentUserId}`
      const savedProfile = localStorage.getItem(profileKey)

      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setUserProfile(profile)
          setEditForm(profile)
        } catch (error) {
          console.error("Error loading profile:", error)
        }
      } else if (user) {
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || ""
        const initialProfile = {
          name: displayName,
          bio: "Full-stack developer passionate about clean code and sharing knowledge.",
        }
        setUserProfile(initialProfile)
        setEditForm(initialProfile)
      }
    }
  }, [currentUserId, user])

  // Calculate stats from user data (including forked snippets)
  useEffect(() => {
    const userSnippets = getUserSnippets() // This includes both created and forked snippets
    const collections = getSortedCollections()

    const publicSnippets = userSnippets.filter((s) => s.is_public)
    const privateSnippets = userSnippets.filter((s) => !s.is_public)
    const favoriteSnippets = userSnippets.filter((s) => s.is_favorite)
    const totalForks = userSnippets.reduce((sum, s) => sum + s.fork_count, 0)

    setStats({
      total_snippets: userSnippets.length, // All snippets owned by user (created + forked)
      public_snippets: publicSnippets.length,
      private_snippets: privateSnippets.length,
      favorite_snippets: favoriteSnippets.length,
      total_forks: totalForks,
      collections_count: collections.filter((c) => c.id !== "favorites").length, // Exclude favorites collection
    })

    // Generate recent activity from snippets
    const activity: ActivityItem[] = []

    const recentSnippets = [...userSnippets]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)

    recentSnippets.forEach((snippet) => {
      activity.push({
        type: "created",
        title: snippet.title,
        date: formatRelativeTime(snippet.created_at),
        snippet_id: snippet.id,
      })
    })

    const recentUpdates = [...userSnippets]
      .filter((s) => s.updated_at !== s.created_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 2)

    recentUpdates.forEach((snippet) => {
      activity.push({
        type: "updated",
        title: snippet.title,
        date: formatRelativeTime(snippet.updated_at),
        snippet_id: snippet.id,
      })
    })

    activity.sort((a, b) => {
      const dateA = parseRelativeTime(a.date)
      const dateB = parseRelativeTime(b.date)
      return dateB.getTime() - dateA.getTime()
    })

    setRecentActivity(activity.slice(0, 4))
  }, [getUserSnippets, getSortedCollections])

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  }

  const parseRelativeTime = (relativeTime: string): Date => {
    const now = new Date()
    if (relativeTime === "Just now") return now
    if (relativeTime.includes("minutes ago")) {
      const minutes = Number.parseInt(relativeTime.split(" ")[0])
      return new Date(now.getTime() - minutes * 60 * 1000)
    }
    if (relativeTime.includes("hours ago")) {
      const hours = Number.parseInt(relativeTime.split(" ")[0])
      return new Date(now.getTime() - hours * 60 * 60 * 1000)
    }
    if (relativeTime.includes("days ago")) {
      const days = Number.parseInt(relativeTime.split(" ")[0])
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    }
    if (relativeTime.includes("weeks ago")) {
      const weeks = Number.parseInt(relativeTime.split(" ")[0])
      return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)
    }
    return now
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle>Authentication Setup Required</CardTitle>
              <CardDescription>To use profile features, please configure your Supabase project.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create a Supabase project at supabase.com</li>
                    <li>Get your project URL and anon key</li>
                    <li>Add them to your .env.local file</li>
                    <li>Restart the application</li>
                  </ol>
                </div>
                <p className="text-center">
                  The app currently runs in <strong>Guest Mode</strong> - all other features work normally!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <LogIn className="h-6 w-6" />
              </div>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view and manage your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Click the "Sign In" button in the top navigation to get started.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      if (currentUserId) {
        const profileKey = `snippy-profile-${currentUserId}`
        localStorage.setItem(profileKey, JSON.stringify(editForm))
        setUserProfile(editForm)
      }

      console.log("Profile updated successfully")
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  const handleCancel = () => {
    setEditForm(userProfile)
    setIsEditing(false)
  }

  const displayName =
    userProfile.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={displayName} />
                <AvatarFallback className="text-lg">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-2xl font-bold">{displayName}</h1>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground mt-2">{userProfile.bio}</p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Snippets</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_snippets}</div>
              <p className="text-xs text-muted-foreground">
                {stats.public_snippets} public, {stats.private_snippets} private
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collections</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.collections_count}</div>
              <p className="text-xs text-muted-foreground">Organized collections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.favorite_snippets}</div>
              <p className="text-xs text-muted-foreground">Bookmarked snippets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forks</CardTitle>
              <GitFork className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_forks}</div>
              <p className="text-xs text-muted-foreground">Times your code was forked</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="capitalize">{activity.type}</span> "{activity.title}"
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
