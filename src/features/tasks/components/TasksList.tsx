import React, { useState, useEffect } from "react"
import { Task } from "../types"
import { TaskItem } from "./TaskItem"
import { useDashboard, SortOption, GroupOption } from "@/src/components/dashboard/DashboardContext"
import {
  CheckCircle2,
  ChevronUp,
  ChevronDown,
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
  Columns3
} from "lucide-react"

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
  const { sortBy, setSortBy, groupBy, setGroupBy, viewMode, setViewMode, isLoading, tasksHook } = useDashboard()
  const [completedExpanded, setCompletedExpanded] = useState(true)
  const [groupOpen, setGroupOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

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
  const sortedActive = sortTasks(activeTasks, sortBy)

  const getVisualTasks = (): Task[] => {
    if (groupBy === "none") {
      return sortedActive
    }
    const activeGroups = groupTasks(activeTasks, groupBy)
    activeGroups.forEach((group) => {
      group.tasks = sortTasks(group.tasks, sortBy)
    })
    return activeGroups.flatMap((g) => g.tasks)
  }

  const currentVisualTasks = getVisualTasks()

  const canDrag = sortBy !== "title" && !isTrash

  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  // Keep local tasks in sync with current visual tasks when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalTasks(currentVisualTasks)
    }
  }, [currentVisualTasks, isDragging])

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

    if (targetNeighbor && groupBy !== "none") {
      if (groupBy === "priority") {
        updatedDraggedItem.priority = targetNeighbor.priority
      } else if (groupBy === "list") {
        updatedDraggedItem.projectId = targetNeighbor.projectId
      } else if (groupBy === "date") {
        updatedDraggedItem.dueDate = targetNeighbor.dueDate
      } else if (groupBy === "tag") {
        updatedDraggedItem.tags = [...targetNeighbor.tags]
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
    } = {}

    if (groupBy === "priority") {
      updates.priority = finalDraggedTask.priority
    } else if (groupBy === "list") {
      updates.projectId = finalDraggedTask.projectId
    } else if (groupBy === "date") {
      updates.dueDate = finalDraggedTask.dueDate
    } else if (groupBy === "tag") {
      updates.tags = finalDraggedTask.tags
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
            className={`transition-all duration-250 ${
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
                    className={`transition-all duration-250 ${
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
  const sortedCompleted = sortTasks(completedTasks, sortBy)

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
        </div>
      </div>

      {/* Active Tasks list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {isTrash ? `Trash Tasks (${activeTasks.length})` : `Active Tasks (${activeTasks.length})`}
          </h3>
          {isLoading && activeTasks.length > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-primary/75 tracking-wider bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping shrink-0" />
              <span>Syncing...</span>
            </div>
          )}
        </div>

        {processedActiveElements}
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
                <TaskItem
                  key={task.id}
                  task={task}
                  projects={projects}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  isRowSelected={activeSelectedTaskId === task.id}
                  onRowClick={onRowClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
