"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/src/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getDashboardData,
  createTaskAction,
  toggleTaskCompletionAction,
  deleteTaskAction,
  createProjectAction,
  createHabitAction,
  toggleHabitRecordAction
} from "@/src/app/actions"
import {
  Check,
  Plus,
  Trash2,
  LogOut,
  Inbox,
  Calendar,
  Flame,
  Timer,
  Tag,
  ChevronDown,
  ChevronUp,
  Folder,
  Play,
  Pause,
  RotateCcw,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Menu,
  X,
  PlusCircle,
  PieChart,
  ListTodo
} from "lucide-react"

interface UserSession {
  name: string
  email: string
  image?: string | null
}

interface Task {
  id: string
  title: string
  completed: boolean
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null // YYYY-MM-DD
  projectId: string // 'inbox' or list ID
  tags: string[]
}

interface Project {
  id: string
  name: string
  color: string
}

interface Habit {
  id: string
  name: string
  color: string
  streak: number
  records: Record<string, boolean> // date string (YYYY-MM-DD) -> completed
}

export default function Dashboard({ user }: { user: UserSession }) {
  const router = useRouter()
  


  // Navigation / Sidebar filter states
  const [activeTab, setActiveTab] = useState<string>("today") // 'inbox' | 'today' | 'upcoming' | 'habits' | 'focus' | project.id
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Custom Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState("")
  const [showAddProject, setShowAddProject] = useState(false)

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"NONE" | "LOW" | "MEDIUM" | "HIGH">("NONE")
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("")
  const [newTaskProject, setNewTaskProject] = useState<string>("inbox")
  const [newTaskTag, setNewTaskTag] = useState<string>("")
  
  // Collapsible panels
  const [completedExpanded, setCompletedExpanded] = useState(true)

  // Habits state
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabitName, setNewHabitName] = useState("")
  const [newHabitColor, setNewHabitColor] = useState("#10b981")
  const [showAddHabit, setShowAddHabit] = useState(false)

  // Pomodoro State
  const [timerActive, setTimerActive] = useState(false)
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [focusStats, setFocusStats] = useState({ focusMinutes: 0, completedSessions: 0 })
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sync state with Database (Server Actions) and localStorage backup
  useEffect(() => {
    // Force light mode exclusively
    document.documentElement.classList.remove("dark")
    localStorage.setItem("theme", "light")

    // Load focus stats from localStorage
    const savedStats = localStorage.getItem("zoc_focus_stats")
    if (savedStats) {
      setFocusStats(JSON.parse(savedStats))
    }

    // Dynamic Database Loader
    async function loadData() {
      const res = await getDashboardData()
      if (res.success && res.data) {
        setTasks(res.data.tasks)
        setProjects(res.data.projects)
        setHabits(res.data.habits)
      } else {
        console.warn("Prisma DB is offline or unavailable. Falling back to client-side offline localStorage.")
        // Offline Fallback to localStorage
        const savedTasks = localStorage.getItem("zoc_tasks")
        if (savedTasks) setTasks(JSON.parse(savedTasks))

        const savedProjects = localStorage.getItem("zoc_projects")
        if (savedProjects) setProjects(JSON.parse(savedProjects))

        const savedHabits = localStorage.getItem("zoc_habits")
        if (savedHabits) setHabits(JSON.parse(savedHabits))
      }
    }

    loadData()
  }, [])

  // Save tasks on modification
  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks)
    localStorage.setItem("zoc_tasks", JSON.stringify(updatedTasks))
  }

  // Save habits on modification
  const saveHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits)
    localStorage.setItem("zoc_habits", JSON.stringify(updatedHabits))
  }

  // Save projects on modification
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects)
    localStorage.setItem("zoc_projects", JSON.stringify(updatedProjects))
  }

  // Save stats on modification
  const saveFocusStats = (updatedStats: typeof focusStats) => {
    setFocusStats(updatedStats)
    localStorage.setItem("zoc_focus_stats", JSON.stringify(updatedStats))
  }



  // Helper date generators
  function getTodayDateString() {
    return new Date().toISOString().split("T")[0]
  }
  function getTomorrowDateString() {
    const tom = new Date()
    tom.setDate(tom.getDate() + 1)
    return tom.toISOString().split("T")[0]
  }
  function getYesterdayDateString() {
    const yes = new Date()
    yes.setDate(yes.getDate() - 1)
    return yes.toISOString().split("T")[0]
  }

  // Handle Logout
  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login")
        }
      }
    })
  }

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const clientGeneratedId = Date.now().toString()
    const tempTask: Task = {
      id: clientGeneratedId,
      title: newTaskTitle.trim(),
      completed: false,
      priority: newTaskPriority,
      dueDate: newTaskDueDate || null,
      projectId: newTaskProject || "inbox",
      tags: newTaskTag.trim() ? [newTaskTag.trim().toLowerCase()] : []
    }

    // Optimistic update client-side
    const currentTasks = [...tasks, tempTask]
    setTasks(currentTasks)
    localStorage.setItem("zoc_tasks", JSON.stringify(currentTasks))

    setNewTaskTitle("")
    setNewTaskPriority("NONE")
    setNewTaskDueDate("")
    setNewTaskTag("")

    // Call database server action asynchronously
    const res = await createTaskAction(
      tempTask.title,
      tempTask.priority,
      tempTask.dueDate,
      tempTask.projectId,
      newTaskTag.trim() || null
    )

    if (res.success && res.taskId) {
      // Update temporary ID with actual DB ID
      setTasks(prev => prev.map(t => t.id === clientGeneratedId ? { ...t, id: res.taskId! } : t))
    }
  }

  // Complete/Uncomplete Task
  const toggleTaskCompletion = async (taskId: string) => {
    let isCompleted = false
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        isCompleted = !t.completed
        return { ...t, completed: isCompleted }
      }
      return t
    })
    
    saveTasks(updated)

    // Sync to database
    await toggleTaskCompletionAction(taskId, isCompleted)
  }

  // Delete Task
  const deleteTask = async (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId)
    saveTasks(updated)
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null)
      if (timerActive) handleResetTimer()
    }

    // Sync to database
    await deleteTaskAction(taskId)
  }

  // Add Project
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    const randomColors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"]
    const color = randomColors[Math.floor(Math.random() * randomColors.length)]
    const tempId = Date.now().toString()

    const newProj: Project = {
      id: tempId,
      name: newProjectName.trim(),
      color
    }

    // Optimistic update
    const currentProjects = [...projects, newProj]
    saveProjects(currentProjects)
    
    setNewProjectName("")
    setShowAddProject(false)

    // Sync to database
    const res = await createProjectAction(newProj.name, newProj.color)
    if (res.success && res.projectId) {
      setProjects(prev => prev.map(p => p.id === tempId ? { ...p, id: res.projectId! } : p))
    }
  }

  // Add Habit
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHabitName.trim()) return

    const tempId = Date.now().toString()
    const newH: Habit = {
      id: tempId,
      name: newHabitName.trim(),
      color: newHabitColor,
      streak: 0,
      records: {}
    }

    // Optimistic update
    const currentHabits = [...habits, newH]
    saveHabits(currentHabits)
    
    setNewHabitName("")
    setShowAddHabit(false)

    // Sync to database
    const res = await createHabitAction(newH.name, newH.color)
    if (res.success && res.habitId) {
      setHabits(prev => prev.map(h => h.id === tempId ? { ...h, id: res.habitId! } : h))
    }
  }

  // Log Habit record (toggle YYYY-MM-DD status)
  const toggleHabitRecord = async (habitId: string, dateStr: string) => {
    let isDone = false
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const currentStatus = h.records[dateStr] || false
        const nextStatus = !currentStatus
        isDone = nextStatus
        
        const newRecords = { ...h.records, [dateStr]: nextStatus }
        
        // Calculate new streak
        let streak = 0
        let checkDate = new Date()
        
        while (true) {
          const checkDateStr = checkDate.toISOString().split("T")[0]
          if (newRecords[checkDateStr]) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            const todayStr = getTodayDateString()
            if (checkDateStr === todayStr) {
              checkDate.setDate(checkDate.getDate() - 1)
              const yesterdayStr = checkDate.toISOString().split("T")[0]
              if (newRecords[yesterdayStr]) {
                checkDate.setDate(checkDate.getDate() - 1)
                continue
              }
            }
            break
          }
        }

        return { ...h, records: newRecords, streak }
      }
      return h
    })
    
    saveHabits(updated)

    // Sync to database
    await toggleHabitRecordAction(habitId, dateStr, isDone)
  }


  // Timer Countdown Logic
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer finished!
            handleTimerCompleted()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [timerActive, timerMode])

  const handleTimerCompleted = () => {
    setTimerActive(false)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

    // Complete session
    if (timerMode === "focus") {
      const minutesCompleted = 25
      const newStats = {
        focusMinutes: focusStats.focusMinutes + minutesCompleted,
        completedSessions: focusStats.completedSessions + 1
      }
      saveFocusStats(newStats)
      
      // Optionally complete selected task
      if (selectedTaskId) {
        const updated = tasks.map(t => {
          if (t.id === selectedTaskId) {
            return { ...t, completed: true }
          }
          return t
        })
        saveTasks(updated)
        setSelectedTaskId(null)
      }
      
      alert("🎉 Focus session completed! Outstanding job. Take a short break!")
      setTimerMode("shortBreak")
      setTimeLeft(5 * 60)
    } else {
      alert("⏱️ Break is over! Let's get back to crushing goals.")
      setTimerMode("focus")
      setTimeLeft(25 * 60)
    }
  }

  const handleToggleTimer = () => {
    setTimerActive(!timerActive)
  }

  const handleResetTimer = () => {
    setTimerActive(false)
    if (timerMode === "focus") {
      setTimeLeft(25 * 60)
    } else if (timerMode === "shortBreak") {
      setTimeLeft(5 * 60)
    } else {
      setTimeLeft(15 * 60)
    }
  }

  const handleSetTimerMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setTimerActive(false)
    setTimerMode(mode)
    if (mode === "focus") setTimeLeft(25 * 60)
    else if (mode === "shortBreak") setTimeLeft(5 * 60)
    else setTimeLeft(15 * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  };

  // Filter Tasks for selected view
  const getFilteredTasks = () => {
    const todayStr = getTodayDateString()
    
    switch (activeTab) {
      case "inbox":
        return tasks.filter(t => t.projectId === "inbox")
      case "today":
        return tasks.filter(t => t.dueDate === todayStr)
      case "upcoming":
        return tasks.filter(t => t.dueDate && t.dueDate > todayStr)
      default:
        // Assume it's a project ID
        return tasks.filter(t => t.projectId === activeTab)
    }
  }

  const getFilteredActiveTasks = () => getFilteredTasks().filter(t => !t.completed)
  const getFilteredCompletedTasks = () => getFilteredTasks().filter(t => t.completed)

  const activeFiltered = getFilteredActiveTasks()
  const completedFiltered = getFilteredCompletedTasks()
  const totalFilteredCount = activeFiltered.length + completedFiltered.length
  const completedPercentage = totalFilteredCount > 0 
    ? Math.round((completedFiltered.length / totalFilteredCount) * 100) 
    : 0

  // Priority styling helper
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50"
      case "MEDIUM":
        return "border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50"
      case "LOW":
        return "border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50/50"
      default:
        return "border-l-4 border-l-muted bg-card hover:bg-muted/30"
    }
  }

  // Sidebar list counts helper
  const getUncompletedCount = (tabName: string) => {
    const todayStr = getTodayDateString()
    if (tabName === "inbox") {
      return tasks.filter(t => t.projectId === "inbox" && !t.completed).length
    }
    if (tabName === "today") {
      return tasks.filter(t => t.dueDate === todayStr && !t.completed).length
    }
    if (tabName === "upcoming") {
      return tasks.filter(t => t.dueDate && t.dueDate > todayStr && !t.completed).length
    }
    // Assume project ID
    return tasks.filter(t => t.projectId === tabName && !t.completed).length
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
      <aside className={`
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 
        fixed md:static inset-y-0 left-0 w-72 md:w-64 lg:w-72 
        bg-card border-r border-border md:flex md:flex-col justify-between 
        z-50 transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
        h-full
      `}>
        <div className="flex flex-col h-full">
          {/* Brand/Header */}
          <div className="hidden md:flex items-center justify-between px-6 py-6 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <ListTodo className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight">
                ZOC<span className="text-primary font-black">.</span>
              </span>
            </div>
          </div>

          {/* User Profile */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shadow-xs uppercase">
                {user.name ? user.name.slice(0, 2) : <User className="h-4.5 w-4.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold truncate max-w-[130px]">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-destructive/5 hover:bg-destructive/10 border border-destructive/10 text-destructive hover:text-destructive/95 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Navigation Scrollable Body */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            
            {/* Core Views */}
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab("inbox"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "inbox" ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="h-4.5 w-4.5" />
                  <span>Inbox</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === "inbox" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {getUncompletedCount("inbox")}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("today"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "today" ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4.5 w-4.5" />
                  <span>Today</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === "today" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {getUncompletedCount("today")}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("upcoming"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "upcoming" ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4.5 w-4.5 rotate-90" />
                  <span>Upcoming</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === "upcoming" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {getUncompletedCount("upcoming")}
                </span>
              </button>
            </div>

            {/* Core Modules (Habits & Focus) */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-extrabold px-3 uppercase tracking-wider">Features</p>
              
              <button
                onClick={() => { setActiveTab("habits"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "habits" ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="h-4.5 w-4.5" />
                  <span>Habit Tracker</span>
                </div>
                {habits.length > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === "habits" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-green-500/10 text-green-600"}`}>
                    {habits.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab("focus"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "focus" ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <div className="flex items-center gap-2.5">
                  <Timer className="h-4.5 w-4.5" />
                  <span>Pomodoro Focus</span>
                </div>
                {focusStats.completedSessions > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-extrabold ${activeTab === "focus" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-orange-500/10 text-orange-600"}`}>
                    🍅 {focusStats.completedSessions}
                  </span>
                )}
              </button>
            </div>

            {/* Custom Lists/Projects */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-3">
                <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Custom Lists</p>
                <button 
                  onClick={() => setShowAddProject(!showAddProject)}
                  className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted/50 rounded-sm cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Add Project Form inline */}
              {showAddProject && (
                <form onSubmit={handleAddProject} className="px-3 py-2 border border-border/80 bg-muted/20 rounded-xl space-y-2 animate-fade-in duration-200">
                  <Input 
                    type="text"
                    placeholder="List name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="h-8 text-xs px-2.5 rounded-lg"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddProject(false)}
                      className="h-7 text-[10px] px-2 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="h-7 text-[10px] px-2 rounded-lg cursor-pointer"
                    >
                      Save
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-1">
                {projects.map(proj => (
                  <button
                    key={proj.id}
                    onClick={() => { setActiveTab(proj.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === proj.id ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0">
                      {getUncompletedCount(proj.id)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </nav>
        </div>
      </aside>

      {/* Backdrop overlay for Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-30 md:hidden animate-fade-in" 
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 md:p-8 lg:p-10 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Dynamic Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-card to-card/50 border border-border p-6 rounded-2xl shadow-xs relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
              {activeTab === "habits" ? "Self Improvement" : activeTab === "focus" ? "Productivity Engine" : "Daily Planner"}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight capitalize flex items-center gap-2">
              {activeTab === "inbox" && "Inbox"}
              {activeTab === "today" && "Today's Agenda"}
              {activeTab === "upcoming" && "Upcoming Commitments"}
              {activeTab === "habits" && "Habit Tracker"}
              {activeTab === "focus" && "Focus session"}
              {!["inbox", "today", "upcoming", "habits", "focus"].includes(activeTab) && 
                projects.find(p => p.id === activeTab)?.name
              }
            </h1>
            <p className="text-xs text-muted-foreground font-semibold">
              {activeTab === "habits" ? (
                "Atomic habits build colossal successes. Form new habits, day by day."
              ) : activeTab === "focus" ? (
                "Work with deep concentration. Eliminate noise, maximize execution."
              ) : (
                `Success is built step by step. You have ${activeFiltered.length} active tasks.`
              )}
            </p>
          </div>

          {/* Quick Metrics */}
          {activeTab !== "habits" && activeTab !== "focus" && (
            <div className="bg-background/80 border border-border/80 p-3.5 rounded-xl flex items-center gap-4 min-w-[200px] shadow-2xs backdrop-blur-xs select-none">
              <div className="relative h-11 w-11 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="22" cy="22" r="18" fill="transparent" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <circle cx="22" cy="22" r="18" fill="transparent" stroke="currentColor" strokeWidth="3.5" 
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
          )}

          {/* Focus mode mini-stat */}
          {activeTab === "focus" && (
            <div className="bg-background/80 border border-border/80 p-3 px-4 rounded-xl flex items-center gap-3 shadow-2xs">
              <PieChart className="h-5 w-5 text-orange-500" />
              <div className="text-xs">
                <p className="font-extrabold">Today's Focus</p>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  {focusStats.focusMinutes}m focused ({focusStats.completedSessions} sessions)
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Dynamic Panels Switcher */}
        <div className="flex-1">

          {/* HABITS TRACKER VIEW */}
          {activeTab === "habits" && (
            <div className="space-y-6 animate-fade-in duration-300">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Habits</h2>
                <Button 
                  onClick={() => setShowAddHabit(!showAddHabit)}
                  className="h-8 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Habit
                </Button>
              </div>

              {/* Add Habit Form overlay/inline */}
              {showAddHabit && (
                <form onSubmit={handleAddHabit} className="bg-card border border-border p-5 rounded-2xl max-w-md space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Daily Habit</h3>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="habitName">Habit Name</Label>
                    <Input 
                      id="habitName"
                      placeholder="e.g. Meditate, Read, Walk..."
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      className="rounded-xl h-10"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <div className="flex gap-2">
                      {["#ef4444", "#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewHabitColor(c)}
                          className={`h-7 w-7 rounded-full border-2 transition-all ${newHabitColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddHabit(false)}
                      className="rounded-xl h-9 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="rounded-xl h-9 cursor-pointer"
                    >
                      Create Habit
                    </Button>
                  </div>
                </form>
              )}

              {/* Habit Cards Grid */}
              {habits.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl">
                  <Flame className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-muted-foreground">No habits created yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Consistency is key. Create your first habit!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {habits.map(habit => {
                    const todayStr = getTodayDateString()
                    const yesterdayStr = getYesterdayDateString()
                    const isDoneToday = habit.records[todayStr] || false
                    
                    // Simple last 5 days record row
                    const pastDays = []
                    for (let i = 4; i >= 0; i--) {
                      const d = new Date()
                      d.setDate(d.getDate() - i)
                      pastDays.push(d)
                    }

                    return (
                      <div key={habit.id} className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${habit.color}15`, color: habit.color }}>
                              <Flame className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold truncate max-w-[200px]">{habit.name}</h4>
                              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                Streak: 🔥 {habit.streak} days
                              </p>
                            </div>
                          </div>

                          {/* Quick completion toggle */}
                          <button
                            onClick={() => toggleHabitRecord(habit.id, todayStr)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isDoneToday 
                                ? "bg-green-500/10 border-green-500/20 text-green-600" 
                                : "bg-muted/30 hover:bg-muted border-border text-muted-foreground"
                            }`}
                          >
                            {isDoneToday ? "Done Today" : "Log Completion"}
                          </button>
                        </div>

                        {/* Visual completion grid for past 5 days */}
                        <div className="border-t border-border/60 pt-3">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">History Grid</p>
                          <div className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl border border-border/40">
                            {pastDays.map((day, idx) => {
                              const dateStr = day.toISOString().split("T")[0]
                              const isDayDone = habit.records[dateStr] || false
                              const dayLabel = day.toLocaleDateString("en-US", { weekday: "narrow" })
                              const isToday = dateStr === todayStr

                              return (
                                <button
                                  key={idx}
                                  onClick={() => toggleHabitRecord(habit.id, dateStr)}
                                  className="flex flex-col items-center gap-1.5 focus:outline-hidden cursor-pointer group"
                                >
                                  <span className={`text-[9px] font-black ${isToday ? "text-primary" : "text-muted-foreground"}`}>{dayLabel}</span>
                                  <div 
                                    className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${
                                      isDayDone 
                                        ? "border-transparent text-white" 
                                        : "bg-background border-border group-hover:bg-muted"
                                    }`}
                                    style={{ backgroundColor: isDayDone ? habit.color : undefined }}
                                  >
                                    {isDayDone && <Check className="h-3 w-3" />}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* POMODORO FOCUS ENGINE VIEW */}
          {activeTab === "focus" && (
            <div className="max-w-md mx-auto space-y-6 text-center py-6 animate-fade-in duration-300">
              
              {/* Mode Presets tabs */}
              <div className="flex bg-muted/50 border border-border p-1 rounded-2xl max-w-xs mx-auto">
                <button
                  onClick={() => handleSetTimerMode("focus")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${timerMode === "focus" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Focus (25m)
                </button>
                <button
                  onClick={() => handleSetTimerMode("shortBreak")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${timerMode === "shortBreak" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Break (5m)
                </button>
              </div>

              {/* Gigantic visual clock with glassmorphism glow */}
              <div className="relative h-64 w-64 rounded-full mx-auto bg-card border-4 border-border flex flex-col items-center justify-center shadow-lg relative select-none">
                {/* Glow ring */}
                <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-pulse pointer-events-none opacity-40 ${timerActive ? "border-orange-500" : "border-muted"}`} />
                
                {/* Progress bar container */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="124" cy="124" r="118" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-muted/10" />
                  <circle cx="124" cy="124" r="118" fill="transparent" stroke="currentColor" strokeWidth="5.5" 
                    className="text-orange-500 transition-all duration-1000"
                    strokeDasharray={2 * Math.PI * 118}
                    strokeDashoffset={
                      timerMode === "focus" 
                        ? 2 * Math.PI * 118 * (1 - timeLeft / (25 * 60))
                        : 2 * Math.PI * 118 * (1 - timeLeft / (5 * 60))
                    }
                  />
                </svg>

                <div className="space-y-1.5 z-10">
                  <h2 className="text-5xl font-black font-mono tracking-wider">{formatTime(timeLeft)}</h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                    {timerActive ? "Drown the noise" : "Prepare your mind"}
                  </p>
                </div>
              </div>

              {/* Selected Task context */}
              <div className="bg-card border border-border p-4 rounded-2xl max-w-sm mx-auto shadow-2xs">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1.5">Active Focus Goal</p>
                {selectedTaskId ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate max-w-[220px]">
                      {tasks.find(t => t.id === selectedTaskId)?.title}
                    </span>
                    <button 
                      onClick={() => setSelectedTaskId(null)}
                      className="text-[10px] text-destructive hover:underline font-bold"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground">Select a task below to focus on:</p>
                    <select
                      onChange={(e) => setSelectedTaskId(e.target.value || null)}
                      className="w-full h-9 rounded-xl border border-border text-xs px-3 bg-background focus:outline-hidden"
                      value={selectedTaskId || ""}
                    >
                      <option value="">No specific task</option>
                      {tasks.filter(t => !t.completed).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Clock controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  onClick={handleResetTimer}
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full cursor-pointer border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </Button>
                <Button
                  onClick={handleToggleTimer}
                  className={`h-14 w-14 rounded-full shadow-md font-bold text-white transition-transform active:scale-[0.98] cursor-pointer ${timerActive ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  {timerActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                </Button>
              </div>

            </div>
          )}

          {/* TASKS LIST VIEWS */}
          {activeTab !== "habits" && activeTab !== "focus" && (
            <div className="space-y-6">
              
              {/* Task Adder Bar */}
              <form onSubmit={handleAddTask} className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3.5 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <Plus className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                  <Input 
                    type="text"
                    placeholder="Add task to this list... (Press Enter)"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-9 text-sm font-medium w-full placeholder:text-muted-foreground/60 placeholder:font-semibold"
                  />
                </div>
                
                {/* Advanced Quick-Selectors for Task creation (Priority, DueDate, List, Tags) */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Priority Indicator select button */}
                    <div className="flex items-center gap-1">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-muted-foreground cursor-pointer focus:outline-hidden hover:bg-muted/30"
                      >
                        <option value="NONE">Priority: None</option>
                        <option value="LOW">Priority: Low</option>
                        <option value="MEDIUM">Priority: Med</option>
                        <option value="HIGH">Priority: High</option>
                      </select>
                    </div>

                    {/* Due date picker input */}
                    <input 
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-muted-foreground cursor-pointer focus:outline-hidden hover:bg-muted/30"
                    />

                    {/* Quick project list selector (only if in overall tabs like Today/Upcoming) */}
                    {["today", "upcoming"].includes(activeTab) && (
                      <select
                        value={newTaskProject}
                        onChange={(e) => setNewTaskProject(e.target.value)}
                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-muted-foreground cursor-pointer focus:outline-hidden hover:bg-muted/30"
                      >
                        <option value="inbox">Inbox</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Quick Tag tag input */}
                    <Input 
                      placeholder="Add tag..."
                      value={newTaskTag}
                      onChange={(e) => setNewTaskTag(e.target.value)}
                      className="h-8 text-[10px] max-w-[100px] border border-border bg-background/50 px-2.5 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={!newTaskTitle.trim()}
                    className="h-8 text-xs font-bold rounded-xl px-4 cursor-pointer select-none active:scale-[0.98]"
                  >
                    Add Task
                  </Button>
                </div>
              </form>

              {/* Tasks Checklist display */}
              <div className="space-y-6">
                
                {/* Active Tasks list */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-1">Active Tasks ({activeFiltered.length})</h3>
                  
                  {activeFiltered.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl select-none">
                      <CheckCircle2 className="h-10 w-10 text-muted-foreground/35 mx-auto mb-3" />
                      <p className="text-sm font-bold text-muted-foreground">All caught up!</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Add a new task or sit back and relax.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeFiltered.map(task => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-4 rounded-xl border border-border transition-all group ${getPriorityStyle(task.priority)} shadow-2xs`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            
                            {/* Round animated checkbox */}
                            <button
                              onClick={() => toggleTaskCompletion(task.id)}
                              className="focus:outline-hidden cursor-pointer text-muted-foreground/60 hover:text-primary transition-colors shrink-0"
                            >
                              <Circle className="h-5 w-5 hover:scale-105 transition-transform" />
                            </button>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate max-w-[300px] md:max-w-[450px]">
                                {task.title}
                              </p>
                              
                              {/* Metadata tags */}
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {task.dueDate && (
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm border ${
                                    task.dueDate === getTodayDateString() 
                                      ? "bg-red-500/5 border-red-500/20 text-red-500" 
                                      : "bg-muted/40 border-border text-muted-foreground"
                                  }`}>
                                    📅 {task.dueDate === getTodayDateString() ? "Today" : task.dueDate}
                                  </span>
                                )}

                                {task.projectId !== "inbox" && (
                                  <span 
                                    className="text-[9px] font-black px-1.5 py-0.5 rounded-sm border"
                                    style={{ 
                                      borderColor: `${projects.find(p => p.id === task.projectId)?.color}30`, 
                                      color: projects.find(p => p.id === task.projectId)?.color,
                                      backgroundColor: `${projects.find(p => p.id === task.projectId)?.color}08`
                                    }}
                                  >
                                    📁 {projects.find(p => p.id === task.projectId)?.name}
                                  </span>
                                )}

                                {task.tags.map(t => (
                                  <span key={t} className="text-[9px] font-bold text-muted-foreground/80 bg-muted/45 px-1.5 py-0.5 rounded-sm border border-border/80">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Quick delete icons visible on hover / active */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedTaskId(task.id)}
                              title="Focus on this"
                              className={`p-1.5 rounded-lg border border-border bg-background hover:bg-orange-50/50 hover:text-orange-500 cursor-pointer ${selectedTaskId === task.id ? "text-orange-500 bg-orange-50/50" : "text-muted-foreground"}`}
                            >
                              <Timer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              title="Delete Task"
                              className="p-1.5 rounded-lg border border-border bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive hover:border-destructive/20 cursor-pointer transition-colors active:scale-95"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Collapsible Completed Tasks List */}
                {completedFiltered.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <button
                      onClick={() => setCompletedExpanded(!completedExpanded)}
                      className="w-full flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground hover:text-foreground p-1 cursor-pointer focus:outline-hidden"
                    >
                      <span>Completed Tasks ({completedFiltered.length})</span>
                      {completedExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {completedExpanded && (
                      <div className="space-y-2 animate-fade-in duration-200">
                        {completedFiltered.map(task => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/10 opacity-70 group hover:opacity-90 transition-opacity"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Filled checked button */}
                              <button
                                onClick={() => toggleTaskCompletion(task.id)}
                                className="focus:outline-hidden cursor-pointer text-green-500 shrink-0"
                              >
                                <CheckCircle2 className="h-5 w-5 fill-green-500 text-card hover:scale-[0.98] transition-transform" />
                              </button>

                              <p className="text-xs font-semibold text-muted-foreground line-through truncate max-w-[300px] md:max-w-[450px]">
                                {task.title}
                              </p>
                            </div>

                            <button
                              onClick={() => deleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg border border-border/80 bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive hover:border-destructive/25 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  )
}
