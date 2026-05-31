import React, { useState, useEffect } from "react"
import { Task } from "../types"
import { X, CheckCircle2, Circle, FileText, Type, MessageSquare, MoreHorizontal } from "lucide-react"
import { PriorityDropdown, type Priority } from "@/components/ui/PriorityDropdown"
import { ListDropdown, type ListProject } from "@/components/ui/ListDropdown"
import { CalendarDropdown } from "@/components/ui/CalendarDropdown"

interface Project {
  id: string
  name: string
  color: string
  icon?: string | null
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
  const [priority, setPriority] = useState<Priority>(task.priority)
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

  const handleDueDateChange = (date: string | null) => {
    setDueDate(date || "")
    onUpdate(task.id, { dueDate: date })
  }

  const handlePriorityChange = (val: Priority) => {
    setPriority(val)
    onUpdate(task.id, { priority: val })
  }

  const handleProjectChange = (val: string) => {
    setProjectId(val)
    onUpdate(task.id, { projectId: val })
  }

  return (
    <aside className="w-full md:w-[500px] bg-card border-l border-border h-full flex flex-col shadow-2xl relative overflow-hidden">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-neutral-50/50 select-none shrink-0">
        <div className="flex items-center gap-3">
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

          {/* Subtle vertical separator */}
          <div className="w-px h-4 bg-border/80" />

          {/* Calendar Dropdown Component */}
          <CalendarDropdown
            value={dueDate || null}
            onChange={handleDueDateChange}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Priority Dropdown Component */}
          <PriorityDropdown
            value={priority}
            onChange={handlePriorityChange}
          />

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            title="Close Panel"
          >
            <X className="h-4.5 w-4.5" />
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

      {/* Bottom Footer Actions */}
      <div className="border-t border-border px-5 py-3 bg-neutral-50/50 flex items-center justify-between shrink-0 select-none">
        {/* List Dropdown Component (Bottom Left) */}
        <ListDropdown
          value={projectId}
          projects={projects as ListProject[]}
          onChange={handleProjectChange}
        />

        {/* Action icons (Bottom Right) */}
        <div className="flex items-center gap-1.5">
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
            title="Formatting Help"
          >
            <Type className="h-4.5 w-4.5" />
          </button>
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
            title="Task Comments"
          >
            <MessageSquare className="h-4.5 w-4.5" />
          </button>
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
            title="More Options"
          >
            <MoreHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
