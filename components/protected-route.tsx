"use client"

import type React from "react"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        {fallback || (
          <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please sign in to access this page and manage your code snippets.</CardDescription>
              </CardHeader>
              <CardContent>
                <SignInButton mode="modal">
                  <Button className="w-full">Sign In to Continue</Button>
                </SignInButton>
              </CardContent>
            </Card>
          </div>
        )}
      </SignedOut>
    </>
  )
}
