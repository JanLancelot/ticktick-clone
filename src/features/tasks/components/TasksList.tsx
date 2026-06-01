import React, { useState, useEffect, useMemo } from "react"
import { Task } from "../types"
import { TaskItem } from "./TaskItem"
import { useDashboard, SortOption, GroupOption } from "@/src/components/dashboard/DashboardContext"
import {
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Layers,
  Flag,
  Calendar,
  Tag,
  FileText,
  FolderOpen,
  SlidersHorizontal,
  Ban,
  Check,
  List,
  Columns3,
  Trash2,
  Inbox,
  Search
} from "lucide-react"
import { AnimatedCheckbox } from "@/components/ui/AnimatedCheckbox"
import { useCelebration } from "@/components/ui/CelebrationContext"

interface Project {
  id: string
  name: string
  color: string
}

interface TasksListProps {
  activeTasks: Task[]
  completedTasks: Task[]
  projects: Project[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSelectFocus?: (id: string) => void
  selectedTaskId?: string | null
  activeSelectedTaskId?: string | null
  onRowClick?: (id: string) => void
  isTrash?: boolean
}

interface GroupedTasks {
  id: string
  title: string
  tasks: Task[]
  color?: string
}

export function TasksList({
  activeTasks,
  completedTasks,
  projects,
  onToggle,
  onDelete,
  onSelectFocus,
  selectedTaskId,
  activeSelectedTaskId,
  onRowClick,
  isTrash = false,
}: TasksListProps) {
  const {
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
    viewMode,
    setViewMode,
    isLoading,
    tasksHook,
    showOnlyCompleted,
    searchQuery,
    setSearchQuery,
    showSearchInput,
    setShowSearchInput,
    sections,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    activeTab,
  } = useDashboard()
  
  const [completedExpanded, setCompletedExpanded] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [isEditingSecId, setIsEditingSecId] = useState<string | null>(null)
  const [editingSecName, setEditingSecName] = useState("")
  const [showAddSectionInput, setShowAddSectionInput] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")

  const isProjectTab = !["today", "upcoming", "inbox", "habits", "focus", "calendar"].includes(activeTab)

  const handleSaveSectionRename = (secId: string) => {
    if (editingSecName.trim()) {
      updateSection(secId, editingSecName.trim())
    }
    setIsEditingSecId(null)
  }

  const handleAddSectionSubmit = () => {
    if (newSectionName.trim()) {
      addSection(newSectionName.trim(), activeTab)
      setNewSectionName("")
      setShowAddSectionInput(false)
    }
  }

  const toggleSectionCollapse = (secId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }))
  }

  const projectSections = useMemo(() => {
    return sections
      .filter((s) => s.projectId === activeTab)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [sections, activeTab])
  const [groupOpen, setGroupOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [completedDateFilter, setCompletedDateFilter] = useState<string>("all")
  const [completedListFilter, setCompletedListFilter] = useState<string>("all")
  const [completedDateOpen, setCompletedDateOpen] = useState(false)
  const [completedListOpen, setCompletedListOpen] = useState(false)
  
  // Custom Calendar State
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth())
  const [pickerMode, setPickerMode] = useState<"single" | "range">("single")
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(null)

  const { triggerCelebration } = useCelebration()

  // Sync calendar display to active filters on opening
  useEffect(() => {
    if (completedDateOpen) {
      if (completedDateFilter.startsWith("custom:")) {
        const dateStr = completedDateFilter.split("custom:")[1]
        const dateObj = new Date(dateStr + "T00:00:00")
        if (!isNaN(dateObj.getTime())) {
          setCalendarYear(dateObj.getFullYear())
          setCalendarMonth(dateObj.getMonth())
          setPickerMode("single")
        }
      } else if (completedDateFilter.startsWith("range:")) {
        const rangeStr = completedDateFilter.split("range:")[1]
        const [startStr, endStr] = rangeStr.split("_")
        const startObj = new Date(startStr + "T00:00:00")
        if (!isNaN(startObj.getTime())) {
          setCalendarYear(startObj.getFullYear())
          setCalendarMonth(startObj.getMonth())
          setPickerMode("range")
          setRangeStart(startStr)
          setRangeEnd(endStr)
        }
      }
    }
  }, [completedDateFilter, completedDateOpen])

  const getCalendarDays = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const prevTotalDays = new Date(year, month, 0).getDate()

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = []

    // Padding from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevTotalDays - i
      const m = month === 0 ? 11 : month - 1
      const y = month === 0 ? year - 1 : year
      days.push({
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        dayNum: i,
        isCurrentMonth: true,
      })
    }

    // Padding from next month
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const m = month === 11 ? 0 : month + 1
      const y = month === 11 ? year + 1 : year
      days.push({
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        dayNum: i,
        isCurrentMonth: false,
      })
    }

    return days
  }

  const getSelectedListDetails = () => {
    if (completedListFilter === "all") {
      return { name: "All Lists", icon: <List className="h-3.5 w-3.5 shrink-0 opacity-70" />, color: null }
    }
    if (completedListFilter === "inbox") {
      return { name: "Inbox", icon: <Inbox className="h-3.5 w-3.5 shrink-0 opacity-70" />, color: null }
    }
    const proj = projects.find((p) => p.id === completedListFilter)
    if (proj) {
      return {
        name: proj.name,
        icon: <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />,
        color: proj.color,
      }
    }
    return { name: "Unknown List", icon: <List className="h-3.5 w-3.5 shrink-0 opacity-70" />, color: null }
  }

  const getSelectedDateLabel = () => {
    if (completedDateFilter === "all") return "All Dates"
    if (completedDateFilter === "today") return "Today"
    if (completedDateFilter === "yesterday") return "Yesterday"
    if (completedDateFilter === "week") return "Last 7 Days"
    if (completedDateFilter === "month") return "Last 30 Days"
    if (completedDateFilter === "year") return "This Year"
    if (completedDateFilter.startsWith("custom:")) {
      const parts = completedDateFilter.split("custom:")
      if (parts[1]) {
        try {
          const dateObj = new Date(parts[1] + "T00:00:00")
          return dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        } catch {
          return parts[1]
        }
      }
    }
    if (completedDateFilter.startsWith("range:")) {
      const parts = completedDateFilter.split("range:")
      if (parts[1]) {
        const [startStr, endStr] = parts[1].split("_")
        try {
          const startObj = new Date(startStr + "T00:00:00")
          const endObj = new Date(endStr + "T00:00:00")
          const opt = { month: "short", day: "numeric" } as const
          return `${startObj.toLocaleDateString(undefined, opt)} - ${endObj.toLocaleDateString(undefined, opt)}`
        } catch {
          return `${startStr} - ${endStr}`
        }
      }
    }
    return "All Dates"
  }

  const renderSubtasksForList = (parentTask: Task) => {
    const taskSubtasks = tasksHook.tasks.filter((t) => t.parentId === parentTask.id)
    if (taskSubtasks.length === 0) return null

    return (
      <div className="pl-9 pr-2 py-0.5 space-y-1.5 border-l-2 border-dashed border-border/60 ml-6 animate-fade-in duration-200">
        {taskSubtasks.map((subtask) => (
          <div
            key={subtask.id}
            onClick={() => onRowClick && onRowClick(parentTask.id)}
            className={`flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-card hover:bg-muted/10 transition-all group/sub cursor-pointer ${
              subtask.completed ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 w-full">
              <AnimatedCheckbox
                completed={subtask.completed}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!subtask.completed) {
                    triggerCelebration(e.clientX, e.clientY)
                  }
                  onToggle(subtask.id)
                }}
                priority="NONE"
              />
              <span
                className={`text-[11px] font-semibold truncate ${
                  subtask.completed ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {subtask.title}
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(subtask.id)
              }}
              title="Delete Subtask"
              className="opacity-0 group-hover/sub:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  const getFilteredCompletedTasks = () => {
    let filtered = [...completedTasks]

    if (completedListFilter !== "all") {
      filtered = filtered.filter((t) => t.projectId === completedListFilter)
    }

    if (completedDateFilter !== "all") {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]
      
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]

      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)
      
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      filtered = filtered.filter((t) => {
        if (!t.completedAt) return false
        const compDateStr = t.completedAt.split("T")[0]

        if (completedDateFilter.startsWith("custom:")) {
          const targetDate = completedDateFilter.split("custom:")[1]
          return compDateStr === targetDate
        }
        if (completedDateFilter.startsWith("range:")) {
          const rangeStr = completedDateFilter.split("range:")[1]
          const [startStr, endStr] = rangeStr.split("_")
          return compDateStr >= startStr && compDateStr <= endStr
        }
        if (completedDateFilter === "today") {
          return compDateStr === todayStr
        }
        if (completedDateFilter === "yesterday") {
          return compDateStr === yesterdayStr
        }
        if (completedDateFilter === "week") {
          return new Date(t.completedAt) >= sevenDaysAgo
        }
        if (completedDateFilter === "month") {
          return new Date(t.completedAt) >= thirtyDaysAgo
        }
        if (completedDateFilter === "year") {
          return new Date(t.completedAt).getFullYear() === today.getFullYear()
        }
        return true
      })
    }

    return filtered
  }

  const groupCompletedTasks = (list: Task[]): { dateLabel: string; tasks: Task[] }[] => {
    const groupsMap: Record<string, Task[]> = {}

    const sorted = [...list].sort((a, b) => {
      const dateA = a.completedAt || ""
      const dateB = b.completedAt || ""
      return dateB.localeCompare(dateA)
    })

    sorted.forEach((task) => {
      let dateStr = "No Date"
      if (task.completedAt) {
        const dateObj = new Date(task.completedAt)
        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]
        
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split("T")[0]

        const compDateStr = task.completedAt.split("T")[0]

        if (compDateStr === todayStr) {
          dateStr = "Today"
        } else if (compDateStr === yesterdayStr) {
          const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" })
          dateStr = `Yesterday ${dayName}`
        } else {
          const monthName = dateObj.toLocaleDateString("en-US", { month: "short" })
          const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" })
          const dateNum = dateObj.getDate()
          dateStr = `${monthName} ${dateNum} ${dayName}`
        }
      }

      if (!groupsMap[dateStr]) {
        groupsMap[dateStr] = []
      }
      groupsMap[dateStr].push(task)
    })

    return Object.keys(groupsMap).map((dateLabel) => ({
      dateLabel,
      tasks: groupsMap[dateLabel],
    }))
  }

  // 1. Sorting Logic
  const sortTasks = (taskList: Task[], sortOpt: SortOption): Task[] => {
    const sorted = [...taskList]
    if (sortOpt === "priority") {
      const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 }
      sorted.sort((a, b) => {
        const diff = priorityWeights[b.priority] - priorityWeights[a.priority]
        if (diff !== 0) return diff
        return a.sortOrder - b.sortOrder
      })
    } else if (sortOpt === "tag") {
      sorted.sort((a, b) => {
        const tagA = a.tags[0] || "\uFFFF"
        const tagB = b.tags[0] || "\uFFFF"
        const diff = tagA.localeCompare(tagB)
        if (diff !== 0) return diff
        return a.sortOrder - b.sortOrder
      })
    } else if (sortOpt === "date") {
      sorted.sort((a, b) => {
        const dateA = a.dueDate || "9999-12-31"
        const dateB = b.dueDate || "9999-12-31"
        const diff = dateA.localeCompare(dateB)
        if (diff !== 0) return diff
        return a.sortOrder - b.sortOrder
      })
    } else if (sortOpt === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title))
    }
    return sorted
  }

  // 2. Grouping Logic
  const groupTasks = (taskList: Task[], groupOpt: GroupOption): GroupedTasks[] => {
    if (groupOpt === "none") {
      return []
    }

    if (groupOpt === "priority") {
      const groups: GroupedTasks[] = [
        { id: "HIGH", title: "High Priority", tasks: [], color: "#ef4444" },
        { id: "MEDIUM", title: "Medium Priority", tasks: [], color: "#f59e0b" },
        { id: "LOW", title: "Low Priority", tasks: [], color: "#3b82f6" },
        { id: "NONE", title: "No Priority", tasks: [], color: "#9ca3af" }
      ]
      taskList.forEach((task) => {
        const g = groups.find((group) => group.id === task.priority)
        if (g) g.tasks.push(task)
      })
      return groups.filter((g) => g.tasks.length > 0)
    }

    if (groupOpt === "list") {
      const groupsMap: Record<string, GroupedTasks> = {}
      
      groupsMap["inbox"] = {
        id: "inbox",
        title: "Inbox",
        tasks: [],
        color: "#6b7280"
      }

      projects.forEach((p) => {
        groupsMap[p.id] = {
          id: p.id,
          title: p.name,
          tasks: [],
          color: p.color
        }
      })

      taskList.forEach((task) => {
        const projectId = task.projectId || "inbox"
        if (groupsMap[projectId]) {
          groupsMap[projectId].tasks.push(task)
        } else {
          groupsMap["inbox"].tasks.push(task)
        }
      })

      return Object.values(groupsMap).filter((g) => g.tasks.length > 0)
    }

    if (groupOpt === "date") {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]
      
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split("T")[0]
      
      const sevenDays = new Date(today)
      sevenDays.setDate(today.getDate() + 7)
      const sevenDaysStr = sevenDays.toISOString().split("T")[0]

      const groups: GroupedTasks[] = [
        { id: "overdue", title: "Overdue", tasks: [], color: "#ef4444" },
        { id: "today", title: "Today", tasks: [], color: "#3b82f6" },
        { id: "tomorrow", title: "Tomorrow", tasks: [], color: "#8b5cf6" },
        { id: "next7", title: "Next 7 Days", tasks: [], color: "#10b981" },
        { id: "later", title: "Later", tasks: [], color: "#6b7280" },
        { id: "nodate", title: "No Date", tasks: [], color: "#9ca3af" }
      ]

      taskList.forEach((task) => {
        if (!task.dueDate) {
          groups.find((g) => g.id === "nodate")?.tasks.push(task)
        } else if (task.dueDate < todayStr) {
          groups.find((g) => g.id === "overdue")?.tasks.push(task)
        } else if (task.dueDate === todayStr) {
          groups.find((g) => g.id === "today")?.tasks.push(task)
        } else if (task.dueDate === tomorrowStr) {
          groups.find((g) => g.id === "tomorrow")?.tasks.push(task)
        } else if (task.dueDate <= sevenDaysStr) {
          groups.find((g) => g.id === "next7")?.tasks.push(task)
        } else {
          groups.find((g) => g.id === "later")?.tasks.push(task)
        }
      })

      return groups.filter((g) => g.tasks.length > 0)
    }

    if (groupOpt === "tag") {
      const groupsMap: Record<string, GroupedTasks> = {}
      const noTagGroup: GroupedTasks = {
        id: "notag",
        title: "No Tag",
        tasks: [],
        color: "#9ca3af"
      }

      taskList.forEach((task) => {
        if (task.tags.length === 0) {
          noTagGroup.tasks.push(task)
        } else {
          task.tags.forEach((tag) => {
            const cleanTag = tag.trim().toLowerCase()
            if (!groupsMap[cleanTag]) {
              groupsMap[cleanTag] = {
                id: cleanTag,
                title: `#${tag}`,
                tasks: [],
                color: "#8b5cf6"
              }
            }
            groupsMap[cleanTag].tasks.push(task)
          })
        }
      })

      const tagGroups = Object.values(groupsMap).sort((a, b) => a.title.localeCompare(b.title))
      if (noTagGroup.tasks.length > 0) {
        tagGroups.push(noTagGroup)
      }
      return tagGroups
    }

    return []
  }

  // 3. Process Active Tasks
  let processedActiveElements: React.ReactNode = null
  const sortedActive = useMemo(() => {
    return sortTasks(activeTasks, sortBy)
  }, [activeTasks, sortBy])

  const currentVisualTasks = useMemo(() => {
    if (groupBy !== "none") {
      const activeGroups = groupTasks(activeTasks, groupBy)
      activeGroups.forEach((group) => {
        group.tasks = sortTasks(group.tasks, sortBy)
      })
      return activeGroups.flatMap((g) => g.tasks)
    }

    if (isProjectTab && projectSections.length > 0) {
      const unsectioned = sortTasks(
        activeTasks.filter(
          (t) => !t.sectionId || !projectSections.some((s) => s.id === t.sectionId)
        ),
        sortBy
      )
      const sectionTasksList = projectSections.flatMap((sec) => {
        return sortTasks(
          activeTasks.filter((t) => t.sectionId === sec.id),
          sortBy
        )
      })
      return [...unsectioned, ...sectionTasksList]
    }

    return sortedActive
  }, [activeTasks, sortedActive, groupBy, sortBy, isProjectTab, projectSections])

  const canDrag = sortBy !== "title" && !isTrash

  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  // Keep local tasks in sync with current visual tasks when not dragging
  useEffect(() => {
    if (!isDragging) {
      const currentKeys = currentVisualTasks.map(t => `${t.id}-${t.completed}-${t.priority}-${t.dueDate}-${t.projectId}-${t.sortOrder}`).join(",")
      const localKeys = localTasks.map(t => `${t.id}-${t.completed}-${t.priority}-${t.dueDate}-${t.projectId}-${t.sortOrder}`).join(",")
      if (currentKeys !== localKeys) {
        setLocalTasks(currentVisualTasks)
      }
    }
  }, [currentVisualTasks, isDragging, localTasks])

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const target = e.target as HTMLElement
    // Prevent dragging when clicking interactive elements (checkbox, focus, delete buttons, etc.)
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("a") ||
      target.closest("svg")
    ) {
      e.preventDefault()
      return
    }

    setDraggedTaskId(taskId)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent, hoverIndex: number) => {
    e.preventDefault()
    if (draggedTaskId === null) return

    const draggedIndex = localTasks.findIndex((t) => t.id === draggedTaskId)
    if (draggedIndex === -1 || draggedIndex === hoverIndex) return

    // Rearrange localTasks array visually in real-time
    const updated = [...localTasks]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    
    // Determine the target neighbor to copy group properties from if grouped
    const targetNeighbor = updated[hoverIndex] || updated[hoverIndex - 1]
    const updatedDraggedItem = { ...draggedItem }

    if (targetNeighbor) {
      if (groupBy !== "none") {
        if (groupBy === "priority") {
          updatedDraggedItem.priority = targetNeighbor.priority
        } else if (groupBy === "list") {
          updatedDraggedItem.projectId = targetNeighbor.projectId
        } else if (groupBy === "date") {
          updatedDraggedItem.dueDate = targetNeighbor.dueDate
        } else if (groupBy === "tag") {
          updatedDraggedItem.tags = [...targetNeighbor.tags]
        }
      } else if (isProjectTab) {
        updatedDraggedItem.sectionId = targetNeighbor.sectionId || null
      }
    }

    updated.splice(hoverIndex, 0, updatedDraggedItem)
    setLocalTasks(updated)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedTaskId(null)

    const finalDraggedTask = localTasks.find((t) => t.id === draggedTaskId)
    if (!finalDraggedTask || !draggedTaskId) return

    // Prepare changes for drag-to-group
    const updates: {
      priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
      dueDate?: string | null
      projectId?: string | null
      tags?: string[]
      sectionId?: string | null
    } = {}

    if (groupBy === "priority") {
      updates.priority = finalDraggedTask.priority
    } else if (groupBy === "list") {
      updates.projectId = finalDraggedTask.projectId
    } else if (groupBy === "date") {
      updates.dueDate = finalDraggedTask.dueDate
    } else if (groupBy === "tag") {
      updates.tags = finalDraggedTask.tags
    } else if (isProjectTab && groupBy === "none") {
      updates.sectionId = finalDraggedTask.sectionId || null
    }

    const orderedIds = localTasks.map((t) => t.id)
    if (tasksHook && tasksHook.reorderAndUpdateTask) {
      tasksHook.reorderAndUpdateTask(draggedTaskId, updates, orderedIds)
    }
  }

  const getRenderGroups = () => {
    const groups = groupTasks(isDragging ? localTasks : activeTasks, groupBy)
    if (!isDragging) {
      groups.forEach((group) => {
        group.tasks = sortTasks(group.tasks, sortBy)
      })
    }
    return groups
  }

  if (isLoading && activeTasks.length === 0) {
    processedActiveElements = (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 shadow-3xs animate-pulse select-none"
          >
            <div className="flex items-center gap-3.5 w-full">
              <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
              <div className="space-y-2 w-full max-w-[250px] md:max-w-[400px]">
                <div className="h-3.5 bg-muted rounded-md w-3/4" />
                <div className="flex gap-2">
                  <div className="h-4 bg-muted rounded-md w-12" />
                  <div className="h-4 bg-muted rounded-md w-16" />
                </div>
              </div>
            </div>
            <div className="h-6 w-6 rounded bg-muted/65 shrink-0 opacity-40" />
          </div>
        ))}
      </div>
    )
  } else if (groupBy === "none" && isProjectTab && projectSections.length > 0) {
    const unsectionedTasks = (isDragging ? localTasks : sortedActive).filter(
      (t) => !t.sectionId || !projectSections.some((s) => s.id === t.sectionId)
    )

    processedActiveElements = (
      <div className="space-y-6">
        {/* Unsectioned Tasks */}
        {unsectionedTasks.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1 select-none">
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/65 shrink-0" />
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                No Section
              </h4>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {unsectionedTasks.length}
              </span>
            </div>
            <div className="space-y-2 pl-3 border-l border-border/60 ml-2">
              {unsectionedTasks.map((task) => {
                const taskIndex = (isDragging ? localTasks : sortedActive).findIndex((t) => t.id === task.id)
                return (
                  <div
                    key={task.id}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, taskIndex !== -1 ? taskIndex : 0)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-250 space-y-1.5 ${
                      draggedTaskId === task.id
                        ? "opacity-30 scale-[0.98] border border-dashed border-primary/30 rounded-xl"
                        : ""
                    }`}
                  >
                    <TaskItem
                      task={task}
                      projects={projects}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onSelectFocus={onSelectFocus}
                      isFocusSelected={selectedTaskId === task.id}
                      isRowSelected={activeSelectedTaskId === task.id}
                      onRowClick={onRowClick}
                      isDraggable={canDrag}
                    />
                    {renderSubtasksForList(task)}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section Groups */}
        {projectSections.map((section) => {
          const sectionTasks = (isDragging ? localTasks : sortedActive).filter(
            (t) => t.sectionId === section.id
          )
          const isCollapsed = !!collapsedSections[section.id]

          return (
            <div key={section.id} className="space-y-2.5">
              <div className="flex items-center justify-between group/sec px-1 border-b border-border/40 pb-1.5 select-none">
                <div className="flex items-center gap-2 truncate">
                  <button
                    onClick={() => toggleSectionCollapse(section.id)}
                    className="text-muted-foreground/60 hover:text-foreground cursor-pointer p-0.5 hover:bg-muted rounded-md transition-colors"
                  >
                    {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {isEditingSecId === section.id ? (
                    <input
                      type="text"
                      value={editingSecName}
                      onChange={(e) => setEditingSecName(e.target.value)}
                      onBlur={() => handleSaveSectionRename(section.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveSectionRename(section.id)
                        if (e.key === "Escape") setIsEditingSecId(null)
                      }}
                      className="text-[10px] font-extrabold text-foreground uppercase tracking-widest bg-transparent border-b border-primary focus:outline-none py-0 focus:ring-0 w-32"
                      autoFocus
                    />
                  ) : (
                    <h4
                      onDoubleClick={() => {
                        setIsEditingSecId(section.id)
                        setEditingSecName(section.name)
                      }}
                      className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hover:text-foreground cursor-pointer truncate"
                      title="Double click to rename"
                    >
                      {section.name}
                    </h4>
                  )}
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    {sectionTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover/sec:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setIsEditingSecId(section.id)
                      setEditingSecName(section.name)
                    }}
                    className="text-muted-foreground hover:text-foreground p-0.5 hover:bg-muted rounded-md cursor-pointer text-[9px] font-black uppercase tracking-wider"
                  >
                    Rename
                  </button>
                  <span className="text-muted-foreground/30 text-[9px]">•</span>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${section.name}"? Tasks inside will be kept.`)) {
                        deleteSection(section.id)
                      }
                    }}
                    className="text-destructive hover:text-destructive/80 p-0.5 hover:bg-destructive/5 rounded-md cursor-pointer text-[9px] font-black uppercase tracking-wider"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="space-y-2 pl-3 border-l border-border/60 ml-2.5 min-h-[8px]">
                  {sectionTasks.map((task) => {
                    const taskIndex = (isDragging ? localTasks : sortedActive).findIndex((t) => t.id === task.id)
                    return (
                      <div
                        key={task.id}
                        draggable={canDrag}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, taskIndex !== -1 ? taskIndex : 0)}
                        onDragEnd={handleDragEnd}
                        className={`transition-all duration-250 space-y-1.5 ${
                          draggedTaskId === task.id
                            ? "opacity-30 scale-[0.98] border border-dashed border-primary/30 rounded-xl"
                            : ""
                        }`}
                      >
                        <TaskItem
                          task={task}
                          projects={projects}
                          onToggle={onToggle}
                          onDelete={onDelete}
                          onSelectFocus={onSelectFocus}
                          isFocusSelected={selectedTaskId === task.id}
                          isRowSelected={activeSelectedTaskId === task.id}
                          onRowClick={onRowClick}
                          isDraggable={canDrag}
                        />
                        {renderSubtasksForList(task)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  } else if (activeTasks.length === 0) {
    processedActiveElements = (
      <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl select-none">
        <CheckCircle2 className="h-10 w-10 text-muted-foreground/35 mx-auto mb-3" />
        <p className="text-sm font-bold text-muted-foreground">
          {isTrash ? "Trash Bin is empty" : "All caught up!"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {isTrash ? "Your deleted tasks will appear here." : "Add a new task or sit back and relax."}
        </p>
      </div>
    )
  } else if (groupBy === "none") {
    processedActiveElements = (
      <div className="space-y-2.5 transition-all">
        {(isDragging ? localTasks : sortedActive).map((task, index) => (
          <div
            key={task.id}
            draggable={canDrag}
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-250 space-y-1.5 ${
              draggedTaskId === task.id
                ? "opacity-30 scale-[0.98] border border-dashed border-primary/30 rounded-xl"
                : ""
            }`}
          >
            <TaskItem
              task={task}
              projects={projects}
              onToggle={onToggle}
              onDelete={onDelete}
              onSelectFocus={onSelectFocus}
              isFocusSelected={selectedTaskId === task.id}
              isRowSelected={activeSelectedTaskId === task.id}
              onRowClick={onRowClick}
              isDraggable={canDrag}
            />
            {renderSubtasksForList(task)}
          </div>
        ))}
      </div>
    )
  } else {
    const activeGroups = getRenderGroups()

    processedActiveElements = (
      <div className="space-y-6">
        {activeGroups.map((group) => (
          <div key={group.id} className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: group.color || "#6b7280" }} />
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </h4>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {group.tasks.length}
              </span>
            </div>
            <div className="space-y-2 pl-3 border-l border-border/60 ml-2">
              {group.tasks.map((task) => {
                const taskIndex = localTasks.findIndex((t) => t.id === task.id)
                return (
                  <div
                    key={task.id}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, taskIndex !== -1 ? taskIndex : 0)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-250 space-y-1.5 ${
                      draggedTaskId === task.id
                        ? "opacity-30 scale-[0.98] border border-dashed border-primary/30 rounded-xl"
                        : ""
                    }`}
                  >
                    <TaskItem
                      task={task}
                      projects={projects}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onSelectFocus={onSelectFocus}
                      isFocusSelected={selectedTaskId === task.id}
                      isRowSelected={activeSelectedTaskId === task.id}
                      onRowClick={onRowClick}
                      isDraggable={canDrag}
                    />
                    {renderSubtasksForList(task)}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 4. Process Completed Tasks (always flat list, sorted by current sortBy)
  const sortedCompleted = useMemo(() => {
    return sortTasks(completedTasks, sortBy)
  }, [completedTasks, sortBy])

  // 5. Dropdown Labels and Icons helpers
  const getSortDetails = (opt: SortOption) => {
    switch (opt) {
      case "priority": return { label: "Priority", icon: <Flag className="h-3.5 w-3.5" /> }
      case "tag": return { label: "Tag", icon: <Tag className="h-3.5 w-3.5" /> }
      case "date": return { label: "Due Date", icon: <Calendar className="h-3.5 w-3.5" /> }
      case "title": return { label: "Title", icon: <FileText className="h-3.5 w-3.5" /> }
      default: return { label: "Default Sort", icon: <SlidersHorizontal className="h-3.5 w-3.5" /> }
    }
  }

  const getGroupDetails = (opt: GroupOption) => {
    switch (opt) {
      case "list": return { label: "List", icon: <FolderOpen className="h-3.5 w-3.5" /> }
      case "date": return { label: "Due Date", icon: <Calendar className="h-3.5 w-3.5" /> }
      case "tag": return { label: "Tag", icon: <Tag className="h-3.5 w-3.5" /> }
      case "priority": return { label: "Priority", icon: <Flag className="h-3.5 w-3.5" /> }
      default: return { label: "No Grouping", icon: <Ban className="h-3.5 w-3.5" /> }
    }
  }

  if (showOnlyCompleted) {
    const filteredCompleted = getFilteredCompletedTasks()
    const groupedCompleted = groupCompletedTasks(filteredCompleted)

    return (
      <div className="space-y-6 animate-fade-in duration-200">
        {/* Dropdown selectors */}
        <div className="flex flex-wrap gap-2.5 pb-2 select-none">
          {/* Date Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setCompletedDateOpen(!completedDateOpen)
                setCompletedListOpen(false)
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer bg-card shadow-3xs ${
                completedDateOpen || completedDateFilter !== "all"
                  ? "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 opacity-80" />
              <span>{getSelectedDateLabel()}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${completedDateOpen ? "rotate-180" : ""}`} />
            </button>

            {completedDateOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCompletedDateOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-card border border-border/80 rounded-2xl shadow-xl py-2.5 z-20 animate-fade-in duration-100 flex flex-col">
                  {/* Preset Options Grid */}
                  <div className="px-3 py-1.5 border-b border-border/40 select-none">
                    <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider mb-2">
                      Filter by Date
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "all", label: "All Dates" },
                        { id: "today", label: "Today" },
                        { id: "yesterday", label: "Yesterday" },
                        { id: "week", label: "Last 7 Days" },
                        { id: "month", label: "Last 30 Days" },
                        { id: "year", label: "This Year" },
                      ].map((opt) => {
                        const isSelected = completedDateFilter === opt.id
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setCompletedDateFilter(opt.id)
                              setCompletedDateOpen(false)
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer truncate ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-3xs"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Picker Mode Selector */}
                  <div className="px-3 pt-3 pb-1 flex items-center justify-between select-none">
                    <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                      Custom Calendar
                    </span>
                    <div className="flex bg-muted/60 p-0.5 rounded-lg text-[9px] font-bold">
                      <button
                        onClick={() => {
                          setPickerMode("single")
                          setRangeStart(null)
                          setRangeEnd(null)
                        }}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          pickerMode === "single"
                            ? "bg-card text-foreground shadow-3xs font-extrabold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Single
                      </button>
                      <button
                        onClick={() => {
                          setPickerMode("range")
                        }}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          pickerMode === "range"
                            ? "bg-card text-foreground shadow-3xs font-extrabold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Range
                      </button>
                    </div>
                  </div>

                  {/* Calendar Navigation Header */}
                  <div className="flex items-center justify-between px-3 py-1.5 select-none">
                    <button
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11)
                          setCalendarYear((y) => y - 1)
                        } else {
                          setCalendarMonth((m) => m - 1)
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronUp className="h-4 w-4 -rotate-90" />
                    </button>
                    <span className="text-xs font-extrabold text-foreground">
                      {new Date(calendarYear, calendarMonth).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0)
                          setCalendarYear((y) => y + 1)
                        } else {
                          setCalendarMonth((m) => m + 1)
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-px text-center px-3 mb-1 select-none">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <span key={day} className="text-[9px] font-black text-muted-foreground/40 py-1 uppercase">
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Day Grid */}
                  <div className="grid grid-cols-7 gap-y-1 px-3">
                    {getCalendarDays(calendarYear, calendarMonth).map((day) => {
                      const isToday = day.dateStr === new Date().toISOString().split("T")[0]
                      
                      let isSelected = false
                      let isInRange = false
                      let isRangeStartEdge = false
                      let isRangeEndEdge = false

                      if (pickerMode === "single") {
                        isSelected = completedDateFilter === "custom:" + day.dateStr
                      } else {
                        isRangeStartEdge = day.dateStr === rangeStart
                        isRangeEndEdge = day.dateStr === rangeEnd
                        isSelected = isRangeStartEdge || isRangeEndEdge
                        if (rangeStart && rangeEnd) {
                          isInRange = day.dateStr > rangeStart && day.dateStr < rangeEnd
                        }
                      }

                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => {
                            if (pickerMode === "single") {
                              setCompletedDateFilter("custom:" + day.dateStr)
                              setCompletedDateOpen(false)
                            } else {
                              if (!rangeStart || (rangeStart && rangeEnd)) {
                                setRangeStart(day.dateStr)
                                setRangeEnd(null)
                              } else {
                                if (day.dateStr < rangeStart) {
                                  setRangeStart(day.dateStr)
                                } else {
                                  setRangeEnd(day.dateStr)
                                  setCompletedDateFilter(`range:${rangeStart}_${day.dateStr}`)
                                  setCompletedDateOpen(false)
                                }
                              }
                            }
                          }}
                          className={`relative h-8 w-8 text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer select-none rounded-lg ${
                            !day.isCurrentMonth ? "opacity-35" : ""
                          } ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-3xs"
                              : isInRange
                              ? "bg-primary/10 text-primary rounded-none"
                              : "hover:bg-muted text-foreground"
                          } ${
                            isRangeStartEdge && rangeEnd ? "rounded-r-none" : ""
                          } ${
                            isRangeEndEdge && rangeStart ? "rounded-l-none" : ""
                          }`}
                        >
                          {isToday && !isSelected && (
                            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                          )}
                          <span>{day.dayNum}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom Footer */}
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1 border-t border-border/40 mt-3 select-none">
                    <button
                      onClick={() => {
                        setCompletedDateFilter("all")
                        setRangeStart(null)
                        setRangeEnd(null)
                        setCompletedDateOpen(false)
                      }}
                      className="text-[9px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Clear
                    </button>
                    {pickerMode === "range" && rangeStart && !rangeEnd && (
                      <span className="text-[8px] font-extrabold text-primary animate-pulse uppercase tracking-wider">
                        Select End Date...
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* List Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setCompletedListOpen(!completedListOpen)
                setCompletedDateOpen(false)
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer bg-card shadow-3xs ${
                completedListOpen || completedListFilter !== "all"
                  ? "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {getSelectedListDetails().icon}
              <span>{getSelectedListDetails().name}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${completedListOpen ? "rotate-180" : ""}`} />
            </button>

            {completedListOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCompletedListOpen(false)} />
                <div className="absolute left-0 mt-2 w-52 bg-card border border-border/80 rounded-xl shadow-lg py-1 z-20 max-h-72 overflow-y-auto animate-fade-in duration-100">
                  <div className="px-3 py-1.5 border-b border-border/40 mb-1 select-none">
                    <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                      Filter by List
                    </p>
                  </div>
                  
                  {/* All Lists */}
                  <button
                    onClick={() => {
                      setCompletedListFilter("all")
                      setCompletedListOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                      completedListFilter === "all" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <List className="h-3.5 w-3.5 opacity-70" />
                      <span>All Lists</span>
                    </div>
                    {completedListFilter === "all" && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                  </button>

                  {/* Inbox */}
                  <button
                    onClick={() => {
                      setCompletedListFilter("inbox")
                      setCompletedListOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                      completedListFilter === "inbox" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Inbox className="h-3.5 w-3.5 opacity-70 shrink-0" />
                      <span>Inbox</span>
                    </div>
                    {completedListFilter === "inbox" && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                  </button>

                  {projects.length > 0 && (
                    <div className="border-t border-border/40 my-1 pt-1">
                      {projects.map((proj) => {
                        const isSelected = completedListFilter === proj.id
                        return (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setCompletedListFilter(proj.id)
                              setCompletedListOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                              isSelected ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                              <span className="truncate">{proj.name}</span>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Grouped Completed Tasks list */}
        {groupedCompleted.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl select-none">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/35 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">
              No completed tasks found
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Try adjusting your filter options or complete some tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedCompleted.map((group) => (
              <div key={group.dateLabel} className="space-y-2.5">
                <div className="flex items-center gap-2 px-1 select-none">
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/65 shrink-0" />
                  <h4 className="text-[11px] font-extrabold text-foreground leading-none">
                    {group.dateLabel}
                  </h4>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {group.tasks.length}
                  </span>
                </div>
                <div className="space-y-2 pl-3 border-l border-border/60 ml-2.5">
                  {group.tasks.map((task) => (
                    <div key={task.id} className="space-y-1.5">
                      <TaskItem
                        task={task}
                        projects={projects}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        isRowSelected={activeSelectedTaskId === task.id}
                        onRowClick={onRowClick}
                      />
                      {renderSubtasksForList(task)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const activeSort = getSortDetails(sortBy)
  const activeGroup = getGroupDetails(groupBy)

  return (
    <div className="space-y-6">
      {/* Premium Display settings Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 border border-border/60 p-3 rounded-2xl select-none relative z-30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase text-muted-foreground/80 tracking-wider">
            Display Settings
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented View Switcher */}
          <div className="flex items-center bg-card border border-border rounded-xl p-0.5 shadow-3xs">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Group By selector dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setGroupOpen(!groupOpen)
                setSortOpen(false)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer bg-card shadow-3xs ${
                groupBy !== "none" ? "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10" : "border-border hover:bg-muted"
              }`}
            >
              <Layers className="h-3.5 w-3.5 opacity-80" />
              <span>Group: {activeGroup.label}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${groupOpen ? "rotate-180" : ""}`} />
            </button>

            {groupOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setGroupOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border/80 rounded-xl shadow-lg py-1 z-20 animate-fade-in duration-100">
                  <div className="px-3 py-1.5 border-b border-border/40 mb-1 select-none">
                    <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                      Group Tasks By
                    </p>
                  </div>
                  {(["none", "list", "date", "tag", "priority"] as GroupOption[]).map((opt) => {
                    const details = getGroupDetails(opt)
                    const isSelected = groupBy === opt
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          setGroupBy(opt)
                          setGroupOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {details.icon}
                          <span>{details.label}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Sort By selector dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setSortOpen(!sortOpen)
                setGroupOpen(false)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer bg-card shadow-3xs ${
                sortBy !== "none" ? "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10" : "border-border hover:bg-muted"
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5 opacity-80" />
              <span>Sort: {activeSort.label}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
            </button>

            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border/80 rounded-xl shadow-lg py-1 z-20 animate-fade-in duration-100">
                  <div className="px-3 py-1.5 border-b border-border/40 mb-1 select-none">
                    <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                      Sort Tasks By
                    </p>
                  </div>
                  {(["none", "priority", "tag", "date", "title"] as SortOption[]).map((opt) => {
                    const details = getSortDetails(opt)
                    const isSelected = sortBy === opt
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt)
                          setSortOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {details.icon}
                          <span>{details.label}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Search Toggle Button / Input */}
          <div className="relative flex items-center">
            {showSearchInput ? (
              <div className="relative flex items-center animate-fade-in">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-8 text-[11px] bg-card rounded-xl border border-border focus:outline-none w-40 sm:w-48 font-bold shadow-3xs"
                  autoFocus
                />
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground text-[10px] font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSearchInput(false)}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground text-[10px] font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className="flex items-center justify-center p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-3xs h-8 w-8"
                title="Search Tasks"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Tasks list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {isTrash ? `Trash Tasks (${activeTasks.length})` : `Active Tasks (${activeTasks.length})`}
          </h3>
          <div className="flex items-center gap-3">
            {isLoading && activeTasks.length > 0 && (
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-primary/75 tracking-wider bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping shrink-0" />
                <span>Syncing...</span>
              </div>
            )}
            {isTrash && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to permanently delete all tasks in the trash? This action cannot be undone.")) {
                    tasksHook.clearDeletedTasks()
                  }
                }}
                title="Empty Trash Bin"
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1.5 rounded-md transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {processedActiveElements}

        {isProjectTab && !isTrash && !showOnlyCompleted && (
          <div className="pt-4 pb-2 border-t border-border/40">
            {showAddSectionInput ? (
              <div className="flex items-center gap-2.5 max-w-sm">
                <input
                  type="text"
                  placeholder="New section name..."
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSectionSubmit()
                    if (e.key === "Escape") setShowAddSectionInput(false)
                  }}
                  className="flex-1 h-8 px-3 text-[11px] bg-card rounded-xl border border-border focus:outline-none font-semibold shadow-3xs text-foreground focus:ring-0 focus-visible:ring-0"
                  autoFocus
                />
                <button
                  onClick={handleAddSectionSubmit}
                  className="h-8 px-3 text-[11px] bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/95 transition-all cursor-pointer shadow-3xs"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddSectionInput(false)}
                  className="h-8 px-3 text-[11px] border border-border hover:bg-muted text-muted-foreground font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAddSectionInput(true)
                  setNewSectionName("")
                }}
                className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest hover:bg-primary/5 px-3 py-1.5 rounded-xl border border-dashed border-primary/20 hover:border-primary/40 transition-all cursor-pointer shadow-3xs"
              >
                + Add Section
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Completed Tasks List */}
      {completedTasks.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="w-full flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground hover:text-foreground p-1 cursor-pointer focus:outline-none"
          >
            <span>Completed Tasks ({completedTasks.length})</span>
            {completedExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {completedExpanded && (
            <div className="space-y-2 animate-fade-in duration-200">
              {sortedCompleted.map((task) => (
                <div key={task.id} className="space-y-1.5">
                  <TaskItem
                    task={task}
                    projects={projects}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    isRowSelected={activeSelectedTaskId === task.id}
                    onRowClick={onRowClick}
                  />
                  {renderSubtasksForList(task)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
