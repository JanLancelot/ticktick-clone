"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Task } from "../../types"
import { TaskItem } from "../TaskItem"
import { useDashboard, SortOption, GroupOption, ViewMode } from "@/src/components/dashboard/DashboardContext"
import {
  Plus,
  X,
  Layers,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Ban,
  Check,
  FolderOpen,
  Calendar,
  Tag,
  Flag,
  FileText,
  List,
  Columns3,
  SlidersHorizontal
} from "lucide-react"

interface Project {
  id: string
  name: string
  color: string
  icon?: string | null
}

interface KanbanColumn {
  id: string
  title: string
  color?: string
  tasks: Task[]
  icon?: React.ReactNode
}

export function KanbanView({
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
}: {
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
}) {
  const {
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
    viewMode,
    setViewMode,
    isLoading,
    tasksHook,
    updateTask,
    activeTab
  } = useDashboard()

  const [groupOpen, setGroupOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // Quick Add State by Column ID
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | null>(null)
  const [quickAddTitle, setQuickAddTitle] = useState("")

  // Collapsed sections / completed tasks states
  const [expandedCompletedColumns, setExpandedCompletedColumns] = useState<Record<string, boolean>>({})
  const [completedColumnCollapsed, setCompletedColumnCollapsed] = useState(false)

  const isCompletedExpanded = (colId: string) => !!expandedCompletedColumns[colId]
  const toggleCompletedExpanded = (colId: string) => {
    setExpandedCompletedColumns(prev => ({
      ...prev,
      [colId]: !prev[colId]
    }))
  }

  // Drag and drop state
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [activeDragColumnId, setActiveDragColumnId] = useState<string | null>(null)

  // 1. Helper to sort tasks
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

  // Combine active and completed for processing when dragging or displaying
  const allTasks = useMemo(() => {
    return [...activeTasks, ...completedTasks]
  }, [activeTasks, completedTasks])

  // Sync local tasks with filtered tasks from context when NOT dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalTasks(allTasks)
    }
  }, [allTasks, isDragging])

  // 2. Compute relative date utilities
  const getDates = () => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    const sevenDays = new Date(today)
    sevenDays.setDate(today.getDate() + 7)
    const sevenDaysStr = sevenDays.toISOString().split("T")[0]

    return { todayStr, tomorrowStr, yesterdayStr, sevenDaysStr }
  }

  // 3. Generate Columns based on Grouping Mode
  const columns = useMemo((): KanbanColumn[] => {
    const currentList = isDragging ? localTasks : allTasks
    const { todayStr, tomorrowStr, sevenDaysStr } = getDates()

    if (groupBy === "none") {
      return [
        {
          id: "todo",
          title: "To Do",
          color: "#3b82f6",
          tasks: sortTasks(currentList.filter(t => !t.completed), sortBy),
        },
        {
          id: "completed",
          title: "Completed",
          color: "#10b981",
          tasks: sortTasks(currentList.filter(t => t.completed), sortBy),
        }
      ]
    }

    if (groupBy === "priority") {
      const groups = [
        { id: "HIGH", title: "High Priority", color: "#ef4444", tasks: [] as Task[] },
        { id: "MEDIUM", title: "Medium Priority", color: "#f59e0b", tasks: [] as Task[] },
        { id: "LOW", title: "Low Priority", color: "#3b82f6", tasks: [] as Task[] },
        { id: "NONE", title: "No Priority", color: "#9ca3af", tasks: [] as Task[] },
      ]

      currentList.forEach(t => {
        const group = groups.find(g => g.id === t.priority)
        if (group) group.tasks.push(t)
      })

      groups.forEach(g => {
        g.tasks = sortTasks(g.tasks, sortBy)
      })

      return groups
    }

    if (groupBy === "list") {
      const colMap: Record<string, KanbanColumn> = {
        inbox: {
          id: "inbox",
          title: "Inbox",
          color: "#6b7280",
          icon: <FolderOpen className="h-4 w-4" />,
          tasks: []
        }
      }

      projects.forEach(p => {
        colMap[p.id] = {
          id: p.id,
          title: p.name,
          color: p.color,
          tasks: []
        }
      })

      currentList.forEach(t => {
        const pId = t.projectId || "inbox"
        if (colMap[pId]) {
          colMap[pId].tasks.push(t)
        } else {
          colMap["inbox"].tasks.push(t)
        }
      })

      return Object.values(colMap).map(col => ({
        ...col,
        tasks: sortTasks(col.tasks, sortBy)
      }))
    }

    if (groupBy === "date") {
      const groups = [
        { id: "overdue", title: "Overdue", color: "#ef4444", tasks: [] as Task[] },
        { id: "today", title: "Today", color: "#3b82f6", tasks: [] as Task[] },
        { id: "tomorrow", title: "Tomorrow", color: "#8b5cf6", tasks: [] as Task[] },
        { id: "next7", title: "Next 7 Days", color: "#10b981", tasks: [] as Task[] },
        { id: "later", title: "Later", color: "#6b7280", tasks: [] as Task[] },
        { id: "nodate", title: "No Date", color: "#9ca3af", tasks: [] as Task[] }
      ]

      currentList.forEach(t => {
        if (!t.dueDate) {
          groups.find(g => g.id === "nodate")?.tasks.push(t)
        } else if (t.dueDate < todayStr) {
          groups.find(g => g.id === "overdue")?.tasks.push(t)
        } else if (t.dueDate === todayStr) {
          groups.find(g => g.id === "today")?.tasks.push(t)
        } else if (t.dueDate === tomorrowStr) {
          groups.find(g => g.id === "tomorrow")?.tasks.push(t)
        } else if (t.dueDate <= sevenDaysStr) {
          groups.find(g => g.id === "next7")?.tasks.push(t)
        } else {
          groups.find(g => g.id === "later")?.tasks.push(t)
        }
      })

      groups.forEach(g => {
        g.tasks = sortTasks(g.tasks, sortBy)
      })

      return groups
    }

    if (groupBy === "tag") {
      const groupsMap: Record<string, KanbanColumn> = {}
      const noTagCol: KanbanColumn = {
        id: "notag",
        title: "No Tag",
        color: "#9ca3af",
        tasks: []
      }

      currentList.forEach(t => {
        if (t.tags.length === 0) {
          noTagCol.tasks.push(t)
        } else {
          t.tags.forEach(tag => {
            const clean = tag.trim().toLowerCase()
            if (!groupsMap[clean]) {
              groupsMap[clean] = {
                id: clean,
                title: `#${tag}`,
                color: "#8b5cf6",
                tasks: []
              }
            }
            if (!groupsMap[clean].tasks.some(item => item.id === t.id)) {
              groupsMap[clean].tasks.push(t)
            }
          })
        }
      })

      const listCols = Object.values(groupsMap).sort((a, b) => a.title.localeCompare(b.title))
      listCols.forEach(c => {
        c.tasks = sortTasks(c.tasks, sortBy)
      })
      noTagCol.tasks = sortTasks(noTagCol.tasks, sortBy)

      return [...listCols, noTagCol]
    }

    return []
  }, [localTasks, allTasks, groupBy, sortBy, projects, isDragging])

  // 4. Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const target = e.target as HTMLElement
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

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (activeDragColumnId !== columnId) {
      setActiveDragColumnId(columnId)
    }
  }

  const handleDragLeaveColumn = () => {
    setActiveDragColumnId(null)
  }

  const handleDragEnterCard = (e: React.DragEvent, targetTask: Task, hoverIndex: number, targetColumnId: string) => {
    e.preventDefault()
    if (draggedTaskId === null || draggedTaskId === targetTask.id) return

    const draggedIndex = localTasks.findIndex(t => t.id === draggedTaskId)
    if (draggedIndex === -1) return

    const updated = [...localTasks]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    const updatedDraggedItem = { ...draggedItem }

    if (groupBy === "none") {
      updatedDraggedItem.completed = targetColumnId === "completed"
    } else if (groupBy === "priority") {
      updatedDraggedItem.priority = targetColumnId as any
    } else if (groupBy === "list") {
      updatedDraggedItem.projectId = targetColumnId === "inbox" ? "inbox" : targetColumnId
    } else if (groupBy === "date") {
      const { todayStr, tomorrowStr, yesterdayStr } = getDates()
      if (targetColumnId === "nodate") updatedDraggedItem.dueDate = null
      else if (targetColumnId === "today") updatedDraggedItem.dueDate = todayStr
      else if (targetColumnId === "tomorrow") updatedDraggedItem.dueDate = tomorrowStr
      else if (targetColumnId === "overdue") updatedDraggedItem.dueDate = yesterdayStr
      else if (targetColumnId === "next7") updatedDraggedItem.dueDate = tomorrowStr
      else if (targetColumnId === "later") {
        const later = new Date()
        later.setDate(later.getDate() + 8)
        updatedDraggedItem.dueDate = later.toISOString().split("T")[0]
      }
    } else if (groupBy === "tag") {
      updatedDraggedItem.tags = targetColumnId === "notag" ? [] : [targetColumnId]
    }

    const targetAbsoluteIndex = updated.findIndex(t => t.id === targetTask.id)
    if (targetAbsoluteIndex !== -1) {
      updated.splice(targetAbsoluteIndex, 0, updatedDraggedItem)
      setLocalTasks(updated)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    setIsDragging(false)
    setActiveDragColumnId(null)
    setDraggedTaskId(null)

    if (!draggedTaskId) return

    const targetTask = localTasks.find(t => t.id === draggedTaskId)
    if (!targetTask) return

    if (groupBy === "none") {
      const shouldBeCompleted = targetColumnId === "completed"
      if (targetTask.completed !== shouldBeCompleted) {
        onToggle(draggedTaskId)
      }
      return
    }

    const updates: {
      priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
      dueDate?: string | null
      projectId?: string | null
      tags?: string[]
    } = {}

    if (groupBy === "priority") {
      updates.priority = targetColumnId as any
    } else if (groupBy === "list") {
      updates.projectId = targetColumnId === "inbox" ? "inbox" : targetColumnId
    } else if (groupBy === "date") {
      const { todayStr, tomorrowStr, yesterdayStr, sevenDaysStr } = getDates()
      if (targetColumnId === "nodate") {
        updates.dueDate = null
      } else if (targetColumnId === "today") {
        updates.dueDate = todayStr
      } else if (targetColumnId === "tomorrow") {
        updates.dueDate = tomorrowStr
      } else if (targetColumnId === "overdue") {
        updates.dueDate = yesterdayStr
      } else if (targetColumnId === "next7") {
        const existingNext7 = localTasks.find(t => t.id !== draggedTaskId && t.dueDate && t.dueDate > tomorrowStr && t.dueDate <= sevenDaysStr)
        updates.dueDate = existingNext7 ? existingNext7.dueDate : tomorrowStr
      } else if (targetColumnId === "later") {
        const later = new Date()
        later.setDate(later.getDate() + 8)
        updates.dueDate = later.toISOString().split("T")[0]
      }
    } else if (groupBy === "tag") {
      updates.tags = targetColumnId === "notag" ? [] : [targetColumnId]
    }

    let updatedTasksList = [...localTasks]
    updatedTasksList = updatedTasksList.map(t => {
      if (t.id === draggedTaskId) {
        return {
          ...t,
          ...updates,
          projectId: (updates.projectId === null || updates.projectId === "inbox") ? "inbox" : (updates.projectId || t.projectId)
        }
      }
      return t
    })

    const orderedIds = updatedTasksList.map(t => t.id)

    if (tasksHook && tasksHook.reorderAndUpdateTask) {
      tasksHook.reorderAndUpdateTask(draggedTaskId, updates, orderedIds)
    }
  }

  const handleQuickAddSubmit = async (columnId: string) => {
    if (!quickAddTitle.trim()) return

    const title = quickAddTitle.trim()
    setQuickAddTitle("")
    setQuickAddColumnId(null)

    const { todayStr, tomorrowStr } = getDates()

    let priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" = "NONE"
    let dueDate: string | null = null
    let projectId = activeTab === "today" || activeTab === "upcoming" ? "inbox" : activeTab
    let tagStr = ""

    if (groupBy === "priority") {
      priority = columnId as any
    } else if (groupBy === "list") {
      projectId = columnId
    } else if (groupBy === "date") {
      if (columnId === "today") dueDate = todayStr
      else if (columnId === "tomorrow") dueDate = tomorrowStr
      else if (columnId === "next7") {
        const inTwoDays = new Date()
        inTwoDays.setDate(inTwoDays.getDate() + 2)
        dueDate = inTwoDays.toISOString().split("T")[0]
      } else if (columnId === "later") {
        const inEightDays = new Date()
        inEightDays.setDate(inEightDays.getDate() + 8)
        dueDate = inEightDays.toISOString().split("T")[0]
      }
    } else if (groupBy === "tag") {
      if (columnId !== "notag") tagStr = columnId
    }

    if (tasksHook && tasksHook.addTask) {
      tasksHook.addTask(title, priority, dueDate, projectId, tagStr)
    }
  }

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

  const activeSort = getSortDetails(sortBy)
  const activeGroup = getGroupDetails(groupBy)

  return (
    <div className="space-y-6 w-full">
      {/* 1. Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 border border-border/60 p-3 rounded-2xl select-none relative z-30 w-full">
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
        </div>
      </div>

      {/* 2. Horizontal Scrollable Kanban Columns Container */}
      <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin select-none w-full items-start">
        {columns.map(col => {
          const isOver = activeDragColumnId === col.id
          const showQuickAdd = quickAddColumnId === col.id
          const canQuickAdd = !isTrash && col.id !== "completed"

          // Check if this column is collapsed (status completed column)
          if (groupBy === "none" && col.id === "completed" && completedColumnCollapsed) {
            return (
              <div
                key={col.id}
                onClick={() => setCompletedColumnCollapsed(false)}
                className="flex flex-col w-12 shrink-0 rounded-2xl border border-border/60 bg-muted/5 hover:bg-muted/10 h-[450px] items-center justify-start py-6 space-y-6 cursor-pointer transition-all duration-200 select-none shadow-3xs"
                title="Expand Completed Column"
              >
                <button className="text-muted-foreground p-1 hover:bg-muted/80 rounded-lg">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex flex-col items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground rotate-90 my-8 origin-center whitespace-nowrap">
                    Completed
                  </h4>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {col.tasks.length}
                  </span>
                </div>
              </div>
            )
          }

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col min-w-[290px] max-w-[340px] w-full shrink-0 rounded-2xl border transition-all duration-200 ${
                isOver
                  ? "bg-primary/5 border-primary/45 shadow-md shadow-primary/5 scale-[1.01]"
                  : "bg-muted/10 border-border/60"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: col.color || "#6b7280" }}
                  />
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground truncate">
                    {col.title}
                  </h4>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {col.tasks.length}
                  </span>
                </div>
                {canQuickAdd ? (
                  <button
                    onClick={() => {
                      setQuickAddColumnId(showQuickAdd ? null : col.id)
                      setQuickAddTitle("")
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    title="Quick Add Task"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : col.id === "completed" && groupBy === "none" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCompletedColumnCollapsed(true)
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    title="Collapse Column"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {/* Column Body - Tasks List */}
              <div className="p-3.5 pt-2.5 space-y-2.5 min-h-[350px] max-h-[calc(100vh-340px)] overflow-y-auto scrollbar-thin">
                {/* 1. Active Tasks in Column */}
                {(groupBy === "none" ? col.tasks : col.tasks.filter(t => !t.completed)).map((task, index) => {
                  const taskIndex = localTasks.findIndex(t => t.id === task.id)
                  const isCurrentDragged = draggedTaskId === task.id

                  return (
                    <div
                      key={task.id}
                      draggable={!isTrash && sortBy !== "title"}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnter={(e) => handleDragEnterCard(e, task, taskIndex !== -1 ? taskIndex : index, col.id)}
                      className={`transition-all duration-200 select-none ${
                        isCurrentDragged
                          ? "opacity-35 scale-[0.98] border border-dashed border-primary/40 rounded-xl"
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
                        isDraggable={!isTrash && sortBy !== "title"}
                      />
                    </div>
                  )
                })}

                {/* 2. Collapsible Completed Tasks inside Column (only for grouped boards) */}
                {groupBy !== "none" && col.tasks.some(t => t.completed) && (
                  <div className="space-y-2 mt-3 pt-2.5 border-t border-border/40">
                    <button
                      onClick={() => toggleCompletedExpanded(col.id)}
                      className="flex items-center gap-1.5 text-[10px] font-extrabold text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none py-1 w-full select-none"
                    >
                      {isCompletedExpanded(col.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <span>Completed ({col.tasks.filter(t => t.completed).length})</span>
                    </button>

                    {isCompletedExpanded(col.id) && (
                      <div className="space-y-2.5 animate-fade-in duration-200">
                        {col.tasks.filter(t => t.completed).map((task, index) => {
                          const taskIndex = localTasks.findIndex(t => t.id === task.id)
                          return (
                            <div
                              key={task.id}
                              draggable={!isTrash && sortBy !== "title"}
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onDragEnter={(e) => handleDragEnterCard(e, task, taskIndex !== -1 ? taskIndex : index, col.id)}
                              className="opacity-60 transition-all hover:opacity-90 select-none animate-fade-in"
                            >
                              <TaskItem
                                task={task}
                                projects={projects}
                                onToggle={onToggle}
                                onDelete={onDelete}
                                isRowSelected={activeSelectedTaskId === task.id}
                                onRowClick={onRowClick}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {((groupBy === "none" && col.tasks.length === 0) || (groupBy !== "none" && col.tasks.filter(t => !t.completed).length === 0)) && !showQuickAdd && (
                  <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-muted bg-card/20 select-none">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                      Drop Tasks Here
                    </p>
                  </div>
                )}

                {showQuickAdd && (
                  <div className="p-3 bg-card rounded-xl border border-primary/20 shadow-xs space-y-2 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleQuickAddSubmit(col.id)
                        else if (e.key === "Escape") setQuickAddColumnId(null)
                      }}
                      className="w-full text-xs font-semibold px-2 py-1.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/65"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setQuickAddColumnId(null)}
                        className="px-2 py-1 rounded-lg border border-border text-[9px] font-black uppercase text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleQuickAddSubmit(col.id)}
                        className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[9px] font-black uppercase hover:bg-primary/90 cursor-pointer shadow-3xs transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
