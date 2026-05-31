"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useProjectsState } from "@/src/features/projects"
import { useTasksState, Task } from "@/src/features/tasks"
import { useHabitsState } from "@/src/features/habits"
import { usePomodoroState } from "@/src/features/focus"
import { getDashboardData, updateTaskAction } from "@/src/app/actions"

export type SortOption = "none" | "priority" | "tag" | "date" | "title"
export type GroupOption = "none" | "list" | "date" | "tag" | "priority"

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
  sortBy: SortOption
  setSortBy: (val: SortOption) => void
  groupBy: GroupOption
  setGroupBy: (val: GroupOption) => void
  isLoading: boolean

  // Selected Task Detail Edit State
  selectedTaskId: string | null
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>
  updateTask: (
    taskId: string,
    updates: {
      title?: string
      content?: string | null
      priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
      dueDate?: string | null
      projectId?: string | null
    }
  ) => Promise<void>

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

  // Task selection details editor state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [sortBy, setSortByState] = useState<SortOption>("none")
  const [groupBy, setGroupByState] = useState<GroupOption>("none")

  // Sync sort/group preferences from localStorage on mount
  useEffect(() => {
    const savedSort = localStorage.getItem("zoc_sort_by") as SortOption
    if (savedSort) setSortByState(savedSort)
    const savedGroup = localStorage.getItem("zoc_group_by") as GroupOption
    if (savedGroup) setGroupByState(savedGroup)
  }, [])

  const setSortBy = (val: SortOption) => {
    setSortByState(val)
    localStorage.setItem("zoc_sort_by", val)
  }

  const setGroupBy = (val: GroupOption) => {
    setGroupByState(val)
    localStorage.setItem("zoc_group_by", val)
  }

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

    // 1. Immediately render cached data from localStorage (Zero Flicker Initial Load)
    const savedTasks = localStorage.getItem("zoc_tasks")
    if (savedTasks) tasksHook.setTasks(JSON.parse(savedTasks))

    const savedProjects = localStorage.getItem("zoc_projects")
    if (savedProjects) projectsHook.setProjects(JSON.parse(savedProjects))

    const savedHabits = localStorage.getItem("zoc_habits")
    if (savedHabits) habitsHook.setHabits(JSON.parse(savedHabits))

    // 2. Fetch fresh updates from server in the background and update cache
    async function loadData() {
      const res = await getDashboardData()
      if (res.success && res.data) {
        tasksHook.setTasks(res.data.tasks)
        projectsHook.setProjects(res.data.projects)
        habitsHook.setHabits(res.data.habits)
        
        // Cache the latest PostgreSQL data
        localStorage.setItem("zoc_tasks", JSON.stringify(res.data.tasks))
        localStorage.setItem("zoc_projects", JSON.stringify(res.data.projects))
        localStorage.setItem("zoc_habits", JSON.stringify(res.data.habits))
      }
      setIsLoading(false)
    }

    loadData()
  }, [])

  // Update specific task locally & DB sync
  const updateTask = async (
    taskId: string,
    updates: {
      title?: string
      content?: string | null
      priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
      dueDate?: string | null
      projectId?: string | null
    }
  ) => {
    // Optimistic state update
    const updatedTasks = tasksHook.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          ...updates,
          projectId: (updates.projectId === null || updates.projectId === "inbox")
            ? "inbox"
            : (updates.projectId || t.projectId),
        }
      }
      return t
    })

    tasksHook.saveTasks(updatedTasks)

    // Call server action to update PostgreSQL
    const res = await updateTaskAction(taskId, updates)
    if (!res.success) {
      console.error("Failed to sync task updates to database:", res.error)
    }
  }

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

  // Wrap projectsHook.deleteProject to clean up local tasks & active tab
  const handleDeleteProject = React.useCallback(async (id: string) => {
    // 1. Reassign tasks belonging to this project to inbox
    const updatedTasks = tasksHook.tasks.map((t) =>
      t.projectId === id ? { ...t, projectId: "inbox" } : t
    )
    tasksHook.saveTasks(updatedTasks)

    // 2. Delete project from hook
    await projectsHook.deleteProject(id)

    // 3. If active tab is the deleted project, redirect to today
    if (activeTab === id) {
      setActiveTab("today")
    }
  }, [tasksHook, projectsHook, activeTab, setActiveTab])

  const customizedProjectsHook = {
    ...projectsHook,
    deleteProject: handleDeleteProject,
  }

  return (
    <DashboardContext.Provider
      value={{
        user,
        projectsHook: customizedProjectsHook,
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
        sortBy,
        setSortBy,
        groupBy,
        setGroupBy,
        isLoading,
        selectedTaskId,
        setSelectedTaskId,
        updateTask,
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
