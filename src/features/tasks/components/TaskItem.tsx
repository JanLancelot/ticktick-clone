import React from "react"
import { Task } from "../types"
import { Circle, CheckCircle2, Timer, Trash2 } from "lucide-react"

interface Project {
  id: string
  name: string
  color: string
}

interface TaskItemProps {
  task: Task
  projects: Project[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSelectFocus?: (id: string) => void
  isFocusSelected?: boolean
}

export function TaskItem({
  task,
  projects,
  onToggle,
  onDelete,
  onSelectFocus,
  isFocusSelected = false,
}: TaskItemProps) {
  const getTodayDateString = () => new Date().toISOString().split("T")[0]

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

  const project = projects.find((p) => p.id === task.projectId)

  if (task.completed) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/10 opacity-70 group hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => onToggle(task.id)}
            className="focus:outline-none cursor-pointer text-green-500 shrink-0"
          >
            <CheckCircle2 className="h-5 w-5 fill-green-500 text-card hover:scale-[0.98] transition-transform" />
          </button>
          <p className="text-xs font-semibold text-muted-foreground line-through truncate max-w-[300px] md:max-w-[450px]">
            {task.title}
          </p>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg border border-border/80 bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive hover:border-destructive/25 transition-all cursor-pointer"
          title="Delete Task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border border-border transition-all group ${getPriorityStyle(
        task.priority
      )} shadow-2xs`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={() => onToggle(task.id)}
          className="focus:outline-none cursor-pointer text-muted-foreground/60 hover:text-primary transition-colors shrink-0"
        >
          <Circle className="h-5 w-5 hover:scale-105 transition-transform" />
        </button>

        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate max-w-[300px] md:max-w-[450px]">
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {task.dueDate && (
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm border ${
                  task.dueDate === getTodayDateString()
                    ? "bg-red-500/5 border-red-500/20 text-red-500"
                    : "bg-muted/40 border-border text-muted-foreground"
                }`}
              >
                📅 {task.dueDate === getTodayDateString() ? "Today" : task.dueDate}
              </span>
            )}

            {task.projectId !== "inbox" && project && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-sm border"
                style={{
                  borderColor: `${project.color}30`,
                  color: project.color,
                  backgroundColor: `${project.color}08`,
                }}
              >
                📁 {project.name}
              </span>
            )}

            {task.tags.map((t) => (
              <span
                key={t}
                className="text-[9px] font-bold text-muted-foreground/80 bg-muted/45 px-1.5 py-0.5 rounded-sm border border-border/80"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onSelectFocus && (
          <button
            onClick={() => onSelectFocus(task.id)}
            title="Focus on this"
            className={`p-1.5 rounded-lg border border-border bg-background hover:bg-orange-50/50 hover:text-orange-500 cursor-pointer ${
              isFocusSelected ? "text-orange-500 bg-orange-50/50" : "text-muted-foreground"
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          title="Delete Task"
          className="p-1.5 rounded-lg border border-border bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive hover:border-destructive/20 cursor-pointer transition-colors active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
