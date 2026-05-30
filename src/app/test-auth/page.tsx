"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/src/lib/auth-client"
import { Button } from "@/components/ui/button"

export default function TestAuthPage() {
  const router = useRouter()
  const { data: session, isPending, error } = authClient.useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setSignOutError(null)
    try {
      await authClient.signOut()
      setIsSigningOut(false)
      router.push("/login")
      router.refresh()
    } catch (err: any) {
      setIsSigningOut(false)
      setSignOutError(err?.message || "An unexpected error occurred during sign out.")
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg space-y-8 animate-fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 mb-2">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Better Auth Diagnostics</h1>
          <p className="text-sm text-muted-foreground">
            Verify session states and test sign in / registration routes.
          </p>
        </div>

        {/* Diagnostic Card */}
        <div className="border border-border bg-card text-card-foreground rounded-2xl p-6 shadow-xs relative overflow-hidden">
          {isPending ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs text-muted-foreground font-semibold">Retrieving session state...</span>
            </div>
          ) : session ? (
            <div className="space-y-6">
              {/* Authenticated Header */}
              <div className="flex items-center gap-4">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="h-12 w-12 rounded-full border border-border shadow-xs"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base tracking-tight">{session.user.name}</h3>
                    <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">{session.user.email}</p>
                </div>
              </div>

              {/* Session Meta */}
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 space-y-2 select-none text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">User ID</span>
                  <span className="text-foreground select-all">{session.user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Verified</span>
                  <span className={session.user.emailVerified ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
                    {session.user.emailVerified ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Expires</span>
                  <span className="text-foreground">{new Date(session.session.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>

              {signOutError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{signOutError}</span>
                </div>
              )}

              {/* Sign Out Action */}
              <Button
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="w-full h-10 rounded-xl font-bold tracking-wide shadow-md shadow-primary/10 transition-all duration-200 active:scale-[0.99] cursor-pointer"
              >
                {isSigningOut ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing out...
                  </div>
                ) : (
                  "Sign Out Session"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unauthenticated Header */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold text-lg border border-destructive/20">
                  !
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                    Not Authenticated
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold">No active user session detected</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                Better Auth is working correctly, but there is no user currently logged in on this browser. You can navigate to any of the sign in routes below to log in or create an account.
              </p>

              {/* Primary Sign In Button */}
              <Link href="/sign-in" className="block">
                <Button className="w-full h-10 rounded-xl font-bold tracking-wide shadow-md shadow-primary/10 transition-all duration-200 active:scale-[0.99] cursor-pointer">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links / Route Testing */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Available Routes</h4>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <Link
              href="/sign-in"
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 font-bold transition-all"
            >
              /sign-in
            </Link>
            <Link
              href="/sign-up"
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 font-bold transition-all"
            >
              /sign-up
            </Link>
            <Link
              href="/signin"
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 font-bold transition-all"
            >
              /signin
            </Link>
            <Link
              href="/signup"
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 font-bold transition-all"
            >
              /signup
            </Link>
            <Link
              href="/login"
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 font-bold transition-all"
            >
              /login
            </Link>
            <Link
              href="/register"
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 font-bold transition-all"
            >
              /register
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground select-none">
          TickTick Clone Authentication Module &bull; Built with Better Auth
        </div>
      </div>
    </div>
  )
}
