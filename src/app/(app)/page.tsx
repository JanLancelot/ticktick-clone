"use client"

import React from "react"
import { useDashboard } from "@/src/components/dashboard/DashboardContext"
import { TaskAdder, TasksList } from "@/src/features/tasks"

export default function TasksPage() {
  const {
    projectsHook,
    tasksHook,
    pomodoroHook,
    activeTab,
    newTaskDueDate,
    setNewTaskDueDate,
    activeFiltered,
    completedFiltered,
  } = useDashboard()

  return (
    <div className="space-y-6 animate-fade-in duration-300">
      {/* Task Adder Bar */}
      <TaskAdder
        projects={projectsHook.projects}
        activeTab={activeTab}
        defaultDueDate={newTaskDueDate}
        onAddTask={(title, priority, dueDate, projectId, tag) => {
          tasksHook.addTask(title, priority, dueDate, projectId, tag)
          setNewTaskDueDate("")
        }}
      />

      {/* Tasks Checklist display */}
      <TasksList
        activeTasks={activeFiltered}
        completedTasks={completedFiltered}
        projects={projectsHook.projects}
        onToggle={tasksHook.toggleTaskCompletion}
        onDelete={tasksHook.deleteTask}
        onSelectFocus={pomodoroHook.setSelectedTaskId}
        selectedTaskId={pomodoroHook.selectedTaskId}
      />
    </div>
  )
}
