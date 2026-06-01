"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useDashboard } from "./DashboardContext"
import { authClient } from "@/src/lib/auth-client"
import {
  ListTodo,
  Menu,
  X,
  PlusCircle,
  Calendar,
  Inbox,
  Tag,
  CheckCircle2,
  Trash2,
  Award,
  RefreshCw,
  Bell,
  LogOut,
  PieChart,
  Flame,
  Timer,
  Search,
  Settings,
} from "lucide-react"
import { AddProjectForm, EditProjectModal, type Project } from "@/src/features/projects"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const dashboard = useDashboard()
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  // Notifications State & Logic
  const [activeNotification, setActiveNotification] = React.useState<{
    habitId: string
    name: string
    icon: string | null
    color: string
    time: string
  } | null>(null)

  const triggeredRef = React.useRef<Record<string, boolean>>({})

  useEffect(() => {
    // Request browser notification permission on mount
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }

    const interval = setInterval(() => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, "0")
      const minutes = now.getMinutes().toString().padStart(2, "0")
      const timeStr = `${hours}:${minutes}`
      const dateStr = now.toISOString().split("T")[0]

      const habitsList = dashboard.habitsHook.habits

      habitsList.forEach((habit) => {
        if (!habit.reminderTime) return

        const times = habit.reminderTime.split(",")
        if (times.includes(timeStr)) {
          const triggerKey = `${habit.id}_${timeStr}_${dateStr}`
          if (!triggeredRef.current[triggerKey]) {
            triggeredRef.current[triggerKey] = true

            // Trigger custom in-app notification
            setActiveNotification({
              habitId: habit.id,
              name: habit.name,
              icon: habit.icon || null,
              color: habit.color || "#3b82f6",
              time: timeStr,
            })

            // Trigger native browser notification
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification(`⏰ Habit Reminder: ${habit.name}`, {
                  body: `It's ${timeStr}! Time to check in for "${habit.name}".`,
                })
              } catch (err) {
                console.error("Failed to show native notification", err)
              }
            }
          }
        }
      })
    }, 15000) // check every 15s for precision

    return () => clearInterval(interval)
  }, [dashboard.habitsHook.habits])

  const {
    user,
    projectsHook,
    tasksHook,
    activeTab,
    setActiveTab,
    mobileMenuOpen,
    setMobileMenuOpen,
    selectedTagFilter,
    setSelectedTagFilter,
    showSearchInput,
    setShowSearchInput,
    searchQuery,
    setSearchQuery,
    showOnlyCompleted,
    setShowOnlyCompleted,
    showTrash,
    setShowTrash,
    completedPercentage,
    completedFiltered,
    totalFilteredCount,
  } = dashboard

  // Determine active module based on current pathname
  const activeModule = pathname === "/calendar"
    ? "calendar"
    : pathname === "/habits"
    ? "habits"
    : pathname === "/focus"
    ? "pomodoro"
    : "tasks"

  // Sync route changes back to contextual state helper
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, setMobileMenuOpen])

  // Handle Logout
  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login")
        },
      },
    })
  }

  // Sidebar list counts helper
  const getUncompletedCount = (tabName: string) => {
    const todayStr = new Date().toISOString().split("T")[0]
    if (tabName === "inbox") {
      return tasksHook.tasks.filter((t) => t.projectId === "inbox" && !t.completed).length
    }
    if (tabName === "today") {
      return tasksHook.tasks.filter((t) => t.dueDate === todayStr && !t.completed).length
    }
    if (tabName === "upcoming") {
      return tasksHook.tasks.filter((t) => t.dueDate && t.dueDate > todayStr && !t.completed).length
    }
    return tasksHook.tasks.filter((t) => t.projectId === tabName && !t.completed).length
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-background text-foreground animate-fade-in duration-300">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <ListTodo className="h-4.5 w-4.5" />
          </div>
          <span className="font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground text-sm">
            ZOC<span className="text-primary font-black">.</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 
        fixed md:sticky md:top-0 inset-y-0 left-0 
        ${activeModule === "tasks" ? "w-[320px] md:w-[320px]" : "w-16 md:w-16"}
        flex z-50 transition-all duration-300 ease-in-out shadow-lg md:shadow-none h-screen bg-card border-r border-border/80 overflow-hidden
      `}
      >
        {/* Column 1: Tiny Column (Width w-16, always visible) */}
        <div className="w-16 bg-neutral-50/90 dark:bg-zinc-950/40 border-r border-border/80 flex flex-col justify-between items-center py-6 shrink-0 h-full select-none">
          {/* Top avatar */}
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="relative group cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md transition-transform duration-300 active:scale-95 uppercase">
                {user.name ? user.name.slice(0, 1) : "U"}
              </div>
              <div className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-amber-400 border border-card flex items-center justify-center shadow-xs">
                <Award className="h-2.5 w-2.5 text-amber-950 fill-amber-950/20" />
              </div>
            </div>

            {/* Core navigation buttons */}
            <div className="flex flex-col gap-4 items-center w-full px-2">
              <button
                onClick={() => {
                  router.push("/")
                  setActiveTab("inbox")
                  setShowTrash(false)
                  setShowOnlyCompleted(false)
                  setSelectedTagFilter(null)
                }}
                title="Tasks"
                className={`relative h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeModule === "tasks"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Inbox className="h-5 w-5" />
                {activeModule === "tasks" && (
                  <span className="absolute left-0 w-1 h-5 rounded-r-md bg-primary-foreground" />
                )}
              </button>

              <button
                onClick={() => {
                  router.push("/calendar")
                  setShowTrash(false)
                  setShowOnlyCompleted(false)
                  setSelectedTagFilter(null)
                }}
                title="Calendar"
                className={`relative h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeModule === "calendar"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Calendar className="h-5 w-5" />
                {activeModule === "calendar" && (
                  <span className="absolute left-0 w-1 h-5 rounded-r-md bg-primary-foreground" />
                )}
              </button>

              <button
                onClick={() => {
                  router.push("/habits")
                  setShowTrash(false)
                  setShowOnlyCompleted(false)
                  setSelectedTagFilter(null)
                }}
                title="Habits"
                className={`relative h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeModule === "habits"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Flame className="h-5 w-5" />
                {activeModule === "habits" && (
                  <span className="absolute left-0 w-1 h-5 rounded-r-md bg-primary-foreground" />
                )}
              </button>

              <button
                onClick={() => {
                  router.push("/focus")
                  setShowTrash(false)
                  setShowOnlyCompleted(false)
                  setSelectedTagFilter(null)
                }}
                title="Pomodoro Focus"
                className={`relative h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeModule === "pomodoro"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Timer className="h-5 w-5" />
                {activeModule === "pomodoro" && (
                  <span className="absolute left-0 w-1 h-5 rounded-r-md bg-primary-foreground" />
                )}
              </button>

              <div className="w-6 h-px bg-border/80 my-1" />

              <button
                onClick={() => {
                  router.push("/")
                  setShowSearchInput((prev) => !prev)
                }}
                title="Search Tasks"
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  showSearchInput || searchQuery ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Bottom control buttons */}
          <div className="flex flex-col gap-4 items-center w-full">
            <button
              onClick={() => {
                alert("✨ Syncing database data...")
                router.refresh()
              }}
              title="Sync Data"
              className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-all active:rotate-180 duration-500"
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => alert("🔔 You have no new notifications.")}
              title="Notifications"
              className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-all"
            >
              <Bell className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="h-10 w-10 rounded-xl flex items-center justify-center text-destructive hover:bg-destructive/10 cursor-pointer transition-all"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Column 2: Wider Sidebar (Width w-[256px], only visible if tasks is active) */}
        {activeModule === "tasks" && (
          <div className="w-[256px] flex flex-col justify-between py-5 shrink-0 h-full overflow-y-auto bg-card animate-fade-in">
            <div className="flex-1 flex flex-col justify-between py-1 overflow-y-auto">
              <div className="space-y-6">
                {/* Top Header */}
                <div className="px-5 pb-2">
                  <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                    Tasks & Lists
                  </h2>
                </div>

                {/* Core Lists */}
                <div className="px-3 space-y-1">
                  <button
                    onClick={() => {
                      router.push("/")
                      setActiveTab("today")
                      setSelectedTagFilter(null)
                      setShowOnlyCompleted(false)
                      setShowTrash(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "today" &&
                      !selectedTagFilter &&
                      !showOnlyCompleted &&
                      !showTrash
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4.5 w-4.5" />
                      <span>Today</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        activeTab === "today" &&
                        !selectedTagFilter &&
                        !showOnlyCompleted &&
                        !showTrash
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getUncompletedCount("today")}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      router.push("/")
                      setActiveTab("upcoming")
                      setSelectedTagFilter(null)
                      setShowOnlyCompleted(false)
                      setShowTrash(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "upcoming" &&
                      !selectedTagFilter &&
                      !showOnlyCompleted &&
                      !showTrash
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4.5 w-4.5 rotate-90" />
                      <span>Next 7 Days</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        activeTab === "upcoming" &&
                        !selectedTagFilter &&
                        !showOnlyCompleted &&
                        !showTrash
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getUncompletedCount("upcoming")}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      router.push("/")
                      setActiveTab("inbox")
                      setSelectedTagFilter(null)
                      setShowOnlyCompleted(false)
                      setShowTrash(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "inbox" &&
                      !selectedTagFilter &&
                      !showOnlyCompleted &&
                      !showTrash
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Inbox className="h-4.5 w-4.5" />
                      <span>Inbox</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        activeTab === "inbox" &&
                        !selectedTagFilter &&
                        !showOnlyCompleted &&
                        !showTrash
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getUncompletedCount("inbox")}
                    </span>
                  </button>
                </div>

                {/* Lists / Projects Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-5">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">
                      Lists
                    </p>
                    <button
                      onClick={() => projectsHook.setShowAddProject(!projectsHook.showAddProject)}
                      className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted/50 rounded-sm cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>



                  <div className="px-3 space-y-0.5">
                    {projectsHook.projects.map((proj) => {
                      const isSelected =
                        activeTab === proj.id &&
                        !selectedTagFilter &&
                        !showOnlyCompleted &&
                        !showTrash
                      return (
                        <div
                          key={proj.id}
                          className="group relative w-full flex items-center justify-between rounded-xl text-xs font-semibold transition-all select-none"
                        >
                          <button
                            onClick={() => {
                              router.push("/")
                              setActiveTab(proj.id)
                              setSelectedTagFilter(null)
                              setShowOnlyCompleted(false)
                              setShowTrash(false)
                            }}
                            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate pr-6">
                              {proj.icon ? (
                                <span className="text-sm shrink-0 select-none leading-none">{proj.icon}</span>
                              ) : (
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: proj.color }}
                                />
                              )}
                              <span className="truncate">{proj.name}</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold shrink-0 transition-opacity duration-200 group-hover:opacity-0 ${
                                isSelected ? "text-primary-foreground/80" : "text-muted-foreground/60"
                              }`}
                            >
                              {getUncompletedCount(proj.id)}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProject(proj)
                            }}
                            className={`absolute right-2 p-1 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity transition-colors ${
                              isSelected
                                ? "hover:bg-primary-foreground/10 text-primary-foreground/90"
                                : "hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
                            }`}
                            title="List Settings"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tags Section */}
                {Array.from(new Set(tasksHook.tasks.flatMap((t) => t.tags))).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="px-5">
                      <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">
                        Tags
                      </p>
                    </div>
                    <div className="px-3 space-y-0.5">
                      {Array.from(new Set(tasksHook.tasks.flatMap((t) => t.tags))).map((tag) => {
                        const isSelected = selectedTagFilter === tag
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              router.push("/")
                              setSelectedTagFilter(isSelected ? null : tag)
                              setShowOnlyCompleted(false)
                              setShowTrash(false)
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <Tag className="h-3.5 w-3.5 rotate-90 shrink-0 opacity-60" />
                            <span className="truncate">#{tag}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Completed and Trash */}
                <div className="border-t border-border/60 pt-4 px-3 space-y-1">
                  <button
                    onClick={() => {
                      router.push("/")
                      setShowOnlyCompleted(true)
                      setShowTrash(false)
                      setSelectedTagFilter(null)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      showOnlyCompleted
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Completed</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push("/")
                      setShowTrash(true)
                      setShowOnlyCompleted(false)
                      setSelectedTagFilter(null)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      showTrash
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    <span>Trash</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Backdrop overlay for Mobile Menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-30 md:hidden animate-fade-in"
        />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col p-6 md:p-8 lg:p-10 w-full space-y-6 ${
          activeModule === "tasks"
            ? "max-w-none lg:pr-[540px]"
            : "max-w-6xl mx-auto"
        }`}
      >
        {/* Dynamic Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-card to-card/50 border border-border p-6 rounded-2xl shadow-xs relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
              {activeModule === "habits"
                ? "Self Improvement"
                : activeModule === "pomodoro"
                ? "Productivity Engine"
                : activeModule === "calendar"
                ? "Visual Scheduler"
                : "Daily Planner"}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight capitalize flex items-center gap-2">
              {activeModule === "tasks" && showTrash && "Trash Bin"}
              {activeModule === "tasks" && showOnlyCompleted && "Completed Tasks"}
              {activeModule === "tasks" && selectedTagFilter && `Tag: #${selectedTagFilter}`}
              {activeModule !== "tasks" || (!showTrash && !showOnlyCompleted && !selectedTagFilter) ? (
                <>
                  {activeModule === "tasks" && activeTab === "inbox" && "Inbox"}
                  {activeModule === "tasks" && activeTab === "today" && "Today's Agenda"}
                  {activeModule === "tasks" && activeTab === "upcoming" && "Upcoming Commitments"}
                  {activeModule === "habits" && "Habit Tracker"}
                  {activeModule === "pomodoro" && "Focus session"}
                  {activeModule === "calendar" && "Interactive Calendar"}
                  {activeModule === "tasks" &&
                    !["inbox", "today", "upcoming", "habits", "focus", "calendar"].includes(
                      activeTab
                    ) && projectsHook.projects.find((p) => p.id === activeTab)?.name}
                </>
              ) : null}
            </h1>
            <p className="text-xs text-muted-foreground font-semibold">
              {activeModule === "tasks" && showTrash ? (
                "Review or restore recently deleted items."
              ) : activeModule === "tasks" && showOnlyCompleted ? (
                "Review tasks you have successfully completed."
              ) : activeModule === "tasks" && selectedTagFilter ? (
                `Displaying all active tasks labeled with #${selectedTagFilter}.`
              ) : activeModule === "habits" ? (
                "Atomic habits build colossal successes. Form new habits, day by day."
              ) : activeModule === "pomodoro" ? (
                "Work with deep concentration. Eliminate noise, maximize execution."
              ) : activeModule === "calendar" ? (
                "Plan your month. View, log, and organize tasks visually."
              ) : (
                `Success is built step by step. You have ${tasksHook.tasks.filter(t => !t.completed).length} active tasks.`
              )}
            </p>
          </div>

          {/* Quick Metrics & Search */}
          {activeModule === "tasks" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-[200px]">
              {showSearchInput && (
                <div className="relative shrink-0 w-full sm:w-44 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full pl-3 pr-8 text-xs bg-background rounded-xl border border-border focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              <div className="bg-background/80 border border-border/80 p-3.5 rounded-xl flex items-center gap-4 shadow-2xs backdrop-blur-xs select-none flex-1">
                <div className="relative h-11 w-11 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-muted/30"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-primary transition-all duration-300"
                      strokeDasharray={2 * Math.PI * 18}
                      strokeDashoffset={2 * Math.PI * 18 * (1 - completedPercentage / 100)}
                    />
                  </svg>
                  <span className="absolute text-[9px] font-black">{completedPercentage}%</span>
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-extrabold text-foreground leading-tight">Focus Progress</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                    {completedFiltered.length}/{totalFilteredCount} tasks done
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Focus mode mini-stat */}
          {activeModule === "pomodoro" && (
            <div className="bg-background/80 border border-border/80 p-3 px-4 rounded-xl flex items-center gap-3 shadow-2xs">
              <PieChart className="h-5 w-5 text-orange-500" />
              <div className="text-xs">
                <p className="font-extrabold">Today's Focus</p>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  {dashboard.pomodoroHook.focusStats.focusMinutes}m focused (
                  {dashboard.pomodoroHook.focusStats.completedSessions} sessions)
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Dynamic routed panels */}
        <div className="flex-1">{children}</div>
      </main>

      {/* Edit List Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSave={projectsHook.updateProject}
          onDelete={projectsHook.deleteProject}
          onClose={() => setEditingProject(null)}
        />
      )}

      {/* Create List Modal */}
      {projectsHook.showAddProject && (
        <EditProjectModal
          mode="create"
          onSave={async (id, name, color, icon) => {
            await projectsHook.addProject(name, color, icon)
          }}
          onClose={() => projectsHook.setShowAddProject(false)}
        />
      )}

      {/* Custom Premium Toast Notification */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-border/80 p-4.5 rounded-2xl shadow-2xl flex flex-col space-y-3.5 animate-scale-in text-foreground select-none">
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner"
              style={{ backgroundColor: `${activeNotification.color}15`, color: activeNotification.color }}
            >
              {activeNotification.icon ? activeNotification.icon : "⏰"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest leading-none">Habit Alert</p>
              <h5 className="text-sm font-black truncate mt-1 text-foreground/90">{activeNotification.name}</h5>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-none">Scheduled for {activeNotification.time}</p>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              className="text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors p-0.5 hover:bg-muted rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const todayStr = new Date().toISOString().split("T")[0]
                dashboard.habitsHook.toggleHabitRecord(activeNotification.habitId, todayStr)
                setActiveNotification(null)
              }}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer text-center transition-colors active:translate-y-px shadow-sm"
            >
              Mark Done
            </button>
            <button
              onClick={() => setActiveNotification(null)}
              className="flex-1 py-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-black rounded-xl cursor-pointer text-center transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
