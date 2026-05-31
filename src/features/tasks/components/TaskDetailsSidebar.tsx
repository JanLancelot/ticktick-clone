import React, { useState, useEffect } from "react"
import { Task } from "../types"
import { X, Calendar, Flag, Folder, CheckCircle2, Circle, FileText } from "lucide-react"

interface Project {
  id: string
  name: string
  color: string
}

interface TaskDetailsSidebarProps {
  task: Task
  projects: Project[]
  onUpdate: (
    taskId: string,
    updates: {
      title?: string
      content?: string | null
      priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
      dueDate?: string | null
      projectId?: string | null
    }
  ) => Promise<void> | void
  onToggleComplete: (taskId: string) => void
  onClose: () => void
}

export function TaskDetailsSidebar({
  task,
  projects,
  onUpdate,
  onToggleComplete,
  onClose,
}: TaskDetailsSidebarProps) {
  const [title, setTitle] = useState(task.title)
  const [content, setContent] = useState(task.content || "")
  const [dueDate, setDueDate] = useState(task.dueDate || "")
  const [priority, setPriority] = useState(task.priority)
  const [projectId, setProjectId] = useState(task.projectId)

  // Keep local state in sync when task selection changes
  useEffect(() => {
    setTitle(task.title)
    setContent(task.content || "")
    setDueDate(task.dueDate || "")
    setPriority(task.priority)
    setProjectId(task.projectId)
  }, [task])

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== task.title) {
      onUpdate(task.id, { title: title.trim() })
    }
  }

  const handleContentBlur = () => {
    if (content !== (task.content || "")) {
      onUpdate(task.id, { content: content.trim() || null })
    }
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDueDate(val)
    onUpdate(task.id, { dueDate: val || null })
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "NONE" | "LOW" | "MEDIUM" | "HIGH"
    setPriority(val)
    onUpdate(task.id, { priority: val })
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setProjectId(val)
    onUpdate(task.id, { projectId: val })
  }

  // Get human-readable relative date string
  const getRelativeDateString = (dateStr: string | null) => {
    if (!dateStr) return "Set Due Date"
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(dateStr)
    checkDate.setHours(0, 0, 0, 0)

    const diffTime = checkDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    const formatted = checkDate.toLocaleDateString("en-US", options)

    if (diffDays === 0) return `Today (${formatted})`
    if (diffDays === 1) return `Tomorrow (${formatted})`
    if (diffDays === -1) return `Yesterday (${formatted})`
    return `${formatted}`
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "HIGH":
        return "text-red-500 hover:text-red-600"
      case "MEDIUM":
        return "text-amber-500 hover:text-amber-600"
      case "LOW":
        return "text-blue-500 hover:text-blue-600"
      default:
        return "text-gray-400 hover:text-gray-500"
    }
  }

  return (
    <aside className="w-full md:w-[500px] bg-card border-l border-border h-full flex flex-col shadow-2xl relative overflow-hidden">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-neutral-50/50 select-none shrink-0">
        <div className="flex items-center gap-4">
          {/* Animated Toggle Completion checkbox */}
          <button
            onClick={() => onToggleComplete(task.id)}
            className="focus:outline-none cursor-pointer"
            title={task.completed ? "Mark Uncompleted" : "Mark Completed"}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 fill-green-500 text-card hover:scale-[0.98] transition-transform" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/60 hover:text-primary hover:scale-105 transition-all" />
            )}
          </button>

          {/* Quick Date Display */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/40 px-2 py-1 rounded-lg border border-border/60 relative group cursor-pointer hover:bg-muted/70 transition-all">
            <Calendar className="h-3.5 w-3.5" />
            <span>{getRelativeDateString(dueDate || null)}</span>
            <input
              type="date"
              value={dueDate}
              onChange={handleDueDateChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Priority dropdown indicator */}
          <div className="relative group cursor-pointer flex items-center gap-1 bg-muted/40 border border-border/60 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-muted/70 transition-all">
            <Flag className={`h-3.5 w-3.5 ${getPriorityColor(priority)}`} />
            <select
              value={priority}
              onChange={handlePriorityChange}
              className="bg-transparent border-0 text-xs font-bold focus:outline-none focus-visible:ring-0 cursor-pointer pr-1"
            >
              <option value="NONE">No Priority</option>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Med Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
          </div>

          {/* Project folder dropdown */}
          <div className="relative group cursor-pointer flex items-center gap-1 bg-muted/40 border border-border/60 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-muted/70 transition-all">
            <Folder className="h-3.5 w-3.5 text-sky-500" />
            <select
              value={projectId}
              onChange={handleProjectChange}
              className="bg-transparent border-0 text-xs font-bold focus:outline-none focus-visible:ring-0 cursor-pointer max-w-[80px] truncate"
            >
              <option value="inbox">Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            title="Close Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Details Input Areas Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        {/* Task Title editable input */}
        <div className="space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur()
              }
            }}
            placeholder="Task title..."
            className="w-full text-xl md:text-2xl font-extrabold tracking-tight bg-transparent border-0 p-0 text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-0 focus-visible:ring-0 select-text"
          />
        </div>

        {/* Notes editor content area */}
        <div className="flex-1 flex flex-col min-h-[250px]">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2 select-none">
            <FileText className="h-3 w-3 text-muted-foreground/75" />
            <span>Notes</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
            placeholder="Add detailed markdown notes, checklists, or comments..."
            className="w-full flex-1 bg-muted/15 border border-border/40 p-4 rounded-2xl resize-none text-xs font-medium leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:bg-background focus:border-primary/40 focus:ring-0 focus-visible:ring-0 transition-all select-text"
          />
        </div>
      </div>
    </aside>
  )
}
