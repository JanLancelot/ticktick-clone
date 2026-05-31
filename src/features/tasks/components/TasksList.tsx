import React, { useState } from "react"
import { Task } from "../types"
import { TaskItem } from "./TaskItem"
import { CheckCircle2, ChevronUp, ChevronDown } from "lucide-react"

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
}: TasksListProps) {
  const [completedExpanded, setCompletedExpanded] = useState(true)

  return (
    <div className="space-y-6">
      {/* Active Tasks list */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-1">
          Active Tasks ({activeTasks.length})
        </h3>

        {activeTasks.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl select-none">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/35 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Add a new task or sit back and relax.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                projects={projects}
                onToggle={onToggle}
                onDelete={onDelete}
                onSelectFocus={onSelectFocus}
                isFocusSelected={selectedTaskId === task.id}
                isRowSelected={activeSelectedTaskId === task.id}
                onRowClick={onRowClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Completed Tasks List */}
      {completedTasks.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
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
              {completedTasks.map((task) => (
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
