import React, { useState, useEffect, useMemo } from "react"
import { Task } from "../types"
import { X, FileText, Type, MessageSquare, MoreHorizontal, ListTodo, Trash2, Plus, GripVertical } from "lucide-react"
import { AnimatedCheckbox } from "@/components/ui/AnimatedCheckbox"
import { useCelebration } from "@/components/ui/CelebrationContext"
import { PriorityDropdown, type Priority } from "@/components/ui/PriorityDropdown"
import { ListDropdown, type ListProject } from "@/components/ui/ListDropdown"
import { CalendarDropdown } from "@/components/ui/CalendarDropdown"
import { useDashboard } from "@/src/components/dashboard/DashboardContext"

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
  const { triggerCelebration } = useCelebration()
  const { tasksHook } = useDashboard()
  const [title, setTitle] = useState(task.title)
  const [content, setContent] = useState(task.content || "")
  const [dueDate, setDueDate] = useState(task.dueDate || "")
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [projectId, setProjectId] = useState(task.projectId)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [localSubtasks, setLocalSubtasks] = useState<Task[]>([])
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null)

  const subtasks = useMemo(() => {
    return tasksHook.tasks.filter((t) => t.parentId === task.id)
  }, [tasksHook.tasks, task.id])

  const totalSubtasksCount = subtasks.length
  const completedSubtasksCount = subtasks.filter((t) => t.completed).length

  const handleSubtaskDragStart = (e: React.DragEvent, subtaskId: string) => {
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("svg")
    ) {
      e.preventDefault()
      return
    }

    setLocalSubtasks(subtasks)
    setDraggedSubtaskId(subtaskId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", subtaskId)
  }

  const handleSubtaskDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleSubtaskDragEnter = (e: React.DragEvent, hoverIndex: number) => {
    e.preventDefault()
    if (draggedSubtaskId === null) return

    const draggedIndex = localSubtasks.findIndex((t) => t.id === draggedSubtaskId)
    if (draggedIndex === -1 || draggedIndex === hoverIndex) return

    const updated = [...localSubtasks]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    updated.splice(hoverIndex, 0, draggedItem)
    setLocalSubtasks(updated)
  }

  const handleSubtaskDragEnd = () => {
    setDraggedSubtaskId(null)
    const orderedIds = localSubtasks.map((t) => t.id)
    tasksHook.reorderTasks(orderedIds)
    setLocalSubtasks([])
  }

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
          <AnimatedCheckbox
            completed={task.completed}
            onClick={(e) => {
              if (!task.completed) {
                triggerCelebration(e.clientX, e.clientY)
              }
              onToggleComplete(task.id)
            }}
            priority={task.priority}
          />

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

        {/* Subtasks checklist area */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground select-none">
            <ListTodo className="h-3 w-3 text-muted-foreground/75" />
            <span>Subtasks</span>
            <span className="ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {completedSubtasksCount}/{totalSubtasksCount}
            </span>
          </div>

          {/* Subtasks List */}
          {(draggedSubtaskId !== null ? localSubtasks : subtasks).length > 0 && (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {(draggedSubtaskId !== null ? localSubtasks : subtasks).map((subtask, index) => (
                <div
                  key={subtask.id}
                  draggable
                  onDragStart={(e) => handleSubtaskDragStart(e, subtask.id)}
                  onDragOver={handleSubtaskDragOver}
                  onDragEnter={(e) => handleSubtaskDragEnter(e, index)}
                  onDragEnd={handleSubtaskDragEnd}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border border-border/45 bg-muted/5 hover:bg-muted/15 hover:border-border transition-all group cursor-pointer ${
                    draggedSubtaskId === subtask.id ? "opacity-30 scale-[0.98] border-dashed" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 w-full">
                    {/* Grip Vertical Handle */}
                    <div className="cursor-grab hover:text-foreground/80 active:cursor-grabbing shrink-0 flex items-center justify-center p-0.5" title="Drag to reorder">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                    </div>

                    <AnimatedCheckbox
                      completed={subtask.completed}
                      onClick={(e) => {
                        if (!subtask.completed) {
                          triggerCelebration(e.clientX, e.clientY)
                        }
                        onToggleComplete(subtask.id)
                      }}
                      priority="NONE"
                    />
                    <input
                      type="text"
                      defaultValue={subtask.title}
                      onBlur={(e) => {
                        const newTitle = e.target.value.trim()
                        if (newTitle && newTitle !== subtask.title) {
                          onUpdate(subtask.id, { title: newTitle })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur()
                        }
                      }}
                      className={`w-full bg-transparent border-0 p-0 text-xs font-semibold focus:outline-none focus:ring-0 focus-visible:ring-0 select-text truncate ${
                        subtask.completed
                          ? "text-muted-foreground line-through opacity-70"
                          : "text-foreground"
                      }`}
                    />
                  </div>

                  <button
                    onClick={() => tasksHook.deleteTask(subtask.id)}
                    title="Delete Subtask"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Rapid Add Subtask Input */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border border-dashed border-border rounded-xl bg-card hover:bg-muted/5 transition-all">
            <Plus className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            <input
              type="text"
              placeholder="Add a subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSubtaskTitle.trim()) {
                  tasksHook.addTask(
                    newSubtaskTitle.trim(),
                    "NONE",
                    null,
                    task.projectId,
                    "",
                    task.id
                  )
                  setNewSubtaskTitle("")
                }
              }}
              className="w-full bg-transparent border-0 p-0 text-xs font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 focus-visible:ring-0 select-text"
            />
          </div>
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
