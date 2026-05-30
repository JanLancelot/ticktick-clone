"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/src/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  
  // Fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Status states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationError, setValidationError] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  // Live password criteria checking
  const criteria = {
    length: password.length >= 6,
    numberOrSpecial: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password),
    match: password && password === confirmPassword,
  }

  // Form Validation
  const validateForm = () => {
    const errors: typeof validationError = {}
    if (!name.trim()) {
      errors.name = "Full name is required"
    }

    if (!email) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email format"
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setValidationError(errors)
    return Object.keys(errors).length === 0
  }

  // Handle standard registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      await authClient.signUp.email({
        email,
        password,
        name,
      }, {
        onRequest: () => {
          setIsLoading(true)
        },
        onSuccess: () => {
          setIsLoading(false)
          setSuccess(true)
          // Delayed redirect to allow success state to shine
          setTimeout(() => {
            router.push("/")
            router.refresh()
          }, 1500)
        },
        onError: (ctx) => {
          setIsLoading(false)
          setError(ctx.error.message || "Failed to create your account.")
        }
      })
    } catch (err) {
      setIsLoading(false)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  // Handle Social Login (Google / GitHub)
  const handleSocialLogin = async (provider: "google" | "github") => {
    setError(null)
    setIsLoading(true)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/"
      }, {
        onRequest: () => {
          setIsLoading(true)
        },
        onError: (ctx) => {
          setIsLoading(false)
          setError(ctx.error.message || `Failed to sign up with ${provider}.`)
        }
      })
    } catch (err) {
      setIsLoading(false)
      setError("Failed to initialize social sign-up.")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in duration-500">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to organize tasks and supercharge your focus
        </p>
      </div>

      {/* Social Logins */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading || success}
          onClick={() => handleSocialLogin("google")}
          className="w-full flex items-center justify-center gap-2 rounded-xl h-10 border-border hover:bg-muted/50 cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading || success}
          onClick={() => handleSocialLogin("github")}
          className="w-full flex items-center justify-center gap-2 rounded-xl h-10 border-border hover:bg-muted/50 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
          GitHub
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-semibold tracking-wider">
            Or create account with email
          </span>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-start gap-2.5 animate-shake">
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold flex items-start gap-2.5 animate-bounce">
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Account created successfully! Logging you in...</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="name">Full Name</Label>
            {validationError.name && (
              <span className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                {validationError.name}
              </span>
            )}
          </div>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            disabled={isLoading || success}
            error={!!validationError.name}
            onChange={(e) => {
              setName(e.target.value)
              if (validationError.name) {
                setValidationError(prev => ({ ...prev, name: undefined }))
              }
            }}
            className="rounded-xl h-10 px-3.5 dark:bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="email">Email Address</Label>
            {validationError.email && (
              <span className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                {validationError.email}
              </span>
            )}
          </div>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            disabled={isLoading || success}
            error={!!validationError.email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (validationError.email) {
                setValidationError(prev => ({ ...prev, email: undefined }))
              }
            }}
            className="rounded-xl h-10 px-3.5 dark:bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            {validationError.password && (
              <span className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                {validationError.password}
              </span>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            disabled={isLoading || success}
            error={!!validationError.password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (validationError.password) {
                setValidationError(prev => ({ ...prev, password: undefined }))
              }
            }}
            className="rounded-xl h-10 px-3.5 dark:bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            {validationError.confirmPassword && (
              <span className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                {validationError.confirmPassword}
              </span>
            )}
          </div>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            disabled={isLoading || success}
            error={!!validationError.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (validationError.confirmPassword) {
                setValidationError(prev => ({ ...prev, confirmPassword: undefined }))
              }
            }}
            className="rounded-xl h-10 px-3.5 dark:bg-background"
          />
        </div>

        {/* Dynamic Criteria checklist (Premium Micro-UX) */}
        {password && (
          <div className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-2 select-none text-[11px]">
            <p className="font-bold text-muted-foreground uppercase tracking-wider text-[9px] mb-1">
              Password Requirements
            </p>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${criteria.length ? "bg-green-500" : "bg-muted-foreground/30"}`} />
              <span className={criteria.length ? "text-green-600 dark:text-green-400 font-semibold" : "text-muted-foreground"}>
                At least 6 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${criteria.numberOrSpecial ? "bg-green-500" : "bg-muted-foreground/30"}`} />
              <span className={criteria.numberOrSpecial ? "text-green-600 dark:text-green-400 font-semibold" : "text-muted-foreground"}>
                Contains a number or special character
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${criteria.match ? "bg-green-500" : "bg-muted-foreground/30"}`} />
              <span className={criteria.match ? "text-green-600 dark:text-green-400 font-semibold" : "text-muted-foreground"}>
                Passwords match
              </span>
            </div>
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading || success}
          className="w-full h-11 rounded-xl font-bold tracking-wide shadow-md shadow-primary/10 transition-all duration-200 active:scale-[0.99] cursor-pointer mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Account...
            </div>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-primary hover:underline hover:text-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}
