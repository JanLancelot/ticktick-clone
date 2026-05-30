import React from "react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex flex-col md:flex-row">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px] dark:bg-blue-500/10" />
        {/* Fine grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.05)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Left Column: Visual Showcase (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative flex-col justify-between p-12 lg:p-20 border-r border-border bg-muted/20 dark:bg-muted/5">
        {/* Branding header */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <svg
              className="h-5 w-5 animate-pulse"
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
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
            TickTick<span className="text-primary font-black">.</span>
          </span>
        </div>

        {/* Feature showcase slider/content */}
        <div className="my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Empowering Your Focus
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Simplify your life, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              one task at a time.
            </span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Organize tasks, build lasting habits, manage time blocks, and track your focus. TickTick is designed to keep you highly productive, wherever you are.
          </p>

          {/* Quick list of value points with beautiful minimalist UI */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 shadow-xs backdrop-blur-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-xs font-semibold">Smart Todo Lists</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 shadow-xs backdrop-blur-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs font-semibold">Focus & Pomodoro</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 shadow-xs backdrop-blur-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-xs font-semibold">Habit Tracker</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 shadow-xs backdrop-blur-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-xs font-semibold">Calendar Blocking</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>&copy; 2026 TickTick Clone. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:underline">Privacy</Link>
            <Link href="#" className="hover:underline">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Card Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 lg:p-24 relative">
        {/* Branding header for mobile view only */}
        <div className="md:hidden flex items-center gap-2 absolute top-6 left-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <svg
              className="h-4 w-4"
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
          <span className="text-base font-bold tracking-tight">TickTick</span>
        </div>

        <div className="w-full max-w-[420px] transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  )
}
