"use client"

import React from "react"
import { useDashboard } from "@/src/components/dashboard/DashboardContext"
import { TaskAdder, TasksList, TaskDetailsSidebar } from "@/src/features/tasks"

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
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    showTrash,
  } = useDashboard()

  const selectedTask = tasksHook.tasks.find((t) => t.id === selectedTaskId)

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start h-full w-full">
      {/* Left Column: Tasks Board */}
      <div className="flex-1 space-y-6 w-full">
        {!showTrash && (
          <TaskAdder
            projects={projectsHook.projects}
            activeTab={activeTab}
            defaultDueDate={newTaskDueDate}
            onAddTask={(title, priority, dueDate, projectId, tag) => {
              tasksHook.addTask(title, priority, dueDate, projectId, tag)
              setNewTaskDueDate("")
            }}
          />
        )}

        <TasksList
          activeTasks={activeFiltered}
          completedTasks={completedFiltered}
          projects={projectsHook.projects}
          onToggle={tasksHook.toggleTaskCompletion}
          onDelete={tasksHook.deleteTask}
          onSelectFocus={pomodoroHook.setSelectedTaskId}
          selectedTaskId={pomodoroHook.selectedTaskId}
          activeSelectedTaskId={selectedTaskId}
          onRowClick={setSelectedTaskId}
          isTrash={showTrash}
        />
      </div>

      {/* Permanent vertical line marking the edit panel workspace boundary */}
      <div className="hidden lg:block fixed top-0 right-0 h-screen w-[500px] border-l border-border/60 pointer-events-none" />

      {/* Right Column: Pinned to the right edge, taking full viewport height */}
      {selectedTask && (
        <div className="fixed top-0 right-0 h-screen w-full lg:w-[500px] z-40 border-l border-border bg-card shadow-2xl">
          <TaskDetailsSidebar
            task={selectedTask}
            projects={projectsHook.projects}
            onUpdate={updateTask}
            onToggleComplete={tasksHook.toggleTaskCompletion}
            onClose={() => setSelectedTaskId(null)}
          />
        </div>
      )}
    </div>
  )
}
