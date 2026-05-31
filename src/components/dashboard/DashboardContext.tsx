"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useProjectsState, Project } from "@/src/features/projects"
import { useTasksState, Task } from "@/src/features/tasks"
import { useHabitsState, Habit } from "@/src/features/habits"
import { usePomodoroState } from "@/src/features/focus"
import { getDashboardData } from "@/src/app/actions"

interface UserSession {
  name: string
  email: string
  image?: string | null
}

interface DashboardContextType {
  user: UserSession
  projectsHook: ReturnType<typeof useProjectsState>
  tasksHook: ReturnType<typeof useTasksState>
  habitsHook: ReturnType<typeof useHabitsState>
  pomodoroHook: ReturnType<typeof usePomodoroState>

  // UI/Navigation state
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
  mobileMenuOpen: boolean
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  selectedTagFilter: string | null
  setSelectedTagFilter: React.Dispatch<React.SetStateAction<string | null>>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  showSearchInput: boolean
  setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>
  showOnlyCompleted: boolean
  setShowOnlyCompleted: React.Dispatch<React.SetStateAction<boolean>>
  showTrash: boolean
  setShowTrash: React.Dispatch<React.SetStateAction<boolean>>
  calendarDate: Date
  setCalendarDate: React.Dispatch<React.SetStateAction<Date>>
  newTaskDueDate: string
  setNewTaskDueDate: React.Dispatch<React.SetStateAction<string>>

  // Computed helper values
  activeFiltered: Task[]
  completedFiltered: Task[]
  totalFilteredCount: number
  completedPercentage: number
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({
  children,
  user,
}: {
  children: React.ReactNode
  user: UserSession
}) {
  // Navigation / Sidebar filter states
  const [activeTab, setActiveTab] = useState<string>("today")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("")

  // Clean sub-feature hooks for state management
  const projectsHook = useProjectsState()
  const tasksHook = useTasksState()
  const habitsHook = useHabitsState()
  const pomodoroHook = usePomodoroState(tasksHook.tasks, tasksHook.toggleTaskCompletion)

  // Sync state with Database and localStorage fallback
  useEffect(() => {
    // Force light mode exclusively
    document.documentElement.classList.remove("dark")
    localStorage.setItem("theme", "light")

    async function loadData() {
      const res = await getDashboardData()
      if (res.success && res.data) {
        tasksHook.setTasks(res.data.tasks)
        projectsHook.setProjects(res.data.projects)
        habitsHook.setHabits(res.data.habits)
      } else {
        console.warn("Prisma DB is offline or unavailable. Falling back to client-side offline localStorage.")
        const savedTasks = localStorage.getItem("zoc_tasks")
        if (savedTasks) tasksHook.setTasks(JSON.parse(savedTasks))

        const savedProjects = localStorage.getItem("zoc_projects")
        if (savedProjects) projectsHook.setProjects(JSON.parse(savedProjects))

        const savedHabits = localStorage.getItem("zoc_habits")
        if (savedHabits) habitsHook.setHabits(JSON.parse(savedHabits))
      }
    }

    loadData()
  }, [])

  // Filter Tasks for selected view
  const getFilteredTasks = () => {
    if (showTrash) {
      return tasksHook.deletedTasks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    let filtered = [...tasksHook.tasks]

    // Apply main view filter (if not viewing habits or focus or calendar pages)
    if (showOnlyCompleted) {
      filtered = filtered.filter((t) => t.completed)
    } else if (selectedTagFilter) {
      filtered = filtered.filter((t) => t.tags.includes(selectedTagFilter))
    } else {
      const todayStr = new Date().toISOString().split("T")[0]
      switch (activeTab) {
        case "inbox":
          filtered = filtered.filter((t) => t.projectId === "inbox")
          break
        case "today":
          filtered = filtered.filter((t) => t.dueDate === todayStr)
          break
        case "upcoming":
          filtered = filtered.filter((t) => t.dueDate && t.dueDate > todayStr)
          break
        case "habits":
        case "focus":
        case "calendar":
          filtered = []
          break
        default:
          filtered = filtered.filter((t) => t.projectId === activeTab)
      }
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    }

    return filtered
  }

  const activeFiltered = getFilteredTasks().filter((t) => !t.completed)
  const completedFiltered = getFilteredTasks().filter((t) => t.completed)
  const totalFilteredCount = activeFiltered.length + completedFiltered.length
  const completedPercentage =
    totalFilteredCount > 0 ? Math.round((completedFiltered.length / totalFilteredCount) * 100) : 0

  return (
    <DashboardContext.Provider
      value={{
        user,
        projectsHook,
        tasksHook,
        habitsHook,
        pomodoroHook,
        activeTab,
        setActiveTab,
        mobileMenuOpen,
        setMobileMenuOpen,
        selectedTagFilter,
        setSelectedTagFilter,
        searchQuery,
        setSearchQuery,
        showSearchInput,
        setShowSearchInput,
        showOnlyCompleted,
        setShowOnlyCompleted,
        showTrash,
        setShowTrash,
        calendarDate,
        setCalendarDate,
        newTaskDueDate,
        setNewTaskDueDate,
        activeFiltered,
        completedFiltered,
        totalFilteredCount,
        completedPercentage,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
