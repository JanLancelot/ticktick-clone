import { useState, useCallback } from "react"
import { Task } from "../types"
import { createTaskAction, toggleTaskCompletionAction, deleteTaskAction, reorderTasksAction, syncTaskDragDropAction } from "@/src/app/actions"

export function useTasksState(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])

  const saveDeletedTasks = useCallback((updatedDeleted: Task[]) => {
    setDeletedTasks(updatedDeleted)
    localStorage.setItem("zoc_deleted_tasks", JSON.stringify(updatedDeleted))
  }, [])

  const saveTasks = useCallback((updatedTasks: Task[]) => {
    setTasks(updatedTasks)
    localStorage.setItem("zoc_tasks", JSON.stringify(updatedTasks))
  }, [])

  const addTask = useCallback(async (
    title: string,
    priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" = "NONE",
    dueDate: string | null = null,
    projectId: string = "inbox",
    tagStr: string = "",
    parentId: string | null = null
  ) => {
    if (!title.trim()) return

    const clientGeneratedId = Date.now().toString()
    const tempTask: Task = {
      id: clientGeneratedId,
      title: title.trim(),
      completed: false,
      priority,
      dueDate: dueDate || null,
      projectId: projectId || "inbox",
      tags: tagStr.trim() ? [tagStr.trim().toLowerCase()] : [],
      sortOrder: 0,
      parentId: parentId || null
    }

    const currentTasks = [...tasks, tempTask]
    saveTasks(currentTasks)

    const res = await createTaskAction(
      tempTask.title,
      tempTask.priority,
      tempTask.dueDate,
      tempTask.projectId,
      tagStr.trim() || null,
      parentId || null
    )

    if (res.success && res.taskId) {
      setTasks(prev => {
        const updated = prev.map(t => t.id === clientGeneratedId ? { ...t, id: res.taskId! } : t)
        localStorage.setItem("zoc_tasks", JSON.stringify(updated))
        return updated
      })
    }
  }, [tasks, saveTasks])

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    let isCompleted = false
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        isCompleted = !t.completed
        return {
          ...t,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : null
        }
      }
      return t
    })
    
    saveTasks(updated)
    await toggleTaskCompletionAction(taskId, isCompleted)
  }, [tasks, saveTasks])

  const deleteTask = useCallback(async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId)
    if (taskToDelete) {
      const newDeleted = [...deletedTasks, taskToDelete]
      saveDeletedTasks(newDeleted)
    }
    const updated = tasks.filter(t => t.id !== taskId)
    saveTasks(updated)

    await deleteTaskAction(taskId)
  }, [tasks, deletedTasks, saveTasks, saveDeletedTasks])

  const reorderTasks = useCallback(async (orderedIds: string[]) => {
    const reorderedSet = new Set(orderedIds)
    const taskMap = new Map(tasks.map(t => [t.id, t]))
    const reorderedTasks = orderedIds.map(id => taskMap.get(id)).filter(Boolean) as Task[]
    
    let reorderIndex = 0
    const updated = tasks.map(t => {
      if (reorderedSet.has(t.id)) {
        const matchingTask = reorderedTasks[reorderIndex++]
        if (matchingTask) {
          return {
            ...matchingTask,
            sortOrder: reorderIndex - 1
          }
        }
      }
      return t
    })

    saveTasks(updated)

    // Call server action to update database
    const res = await reorderTasksAction(orderedIds)
    if (!res.success) {
      console.error("Failed to sync task reordering to database:", res.error)
    }
  }, [tasks, saveTasks])

  const reorderAndUpdateTask = useCallback(async (
    taskId: string,
    updates: {
      priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
      dueDate?: string | null
      projectId?: string | null
      tags?: string[]
    },
    orderedIds: string[]
  ) => {
    // 1. First, apply property updates to the dragged task in the local array
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          ...updates,
          projectId: (updates.projectId === null || updates.projectId === "inbox")
            ? "inbox"
            : (updates.projectId || t.projectId)
        }
      }
      return t
    })

    // 2. Apply relative in-place reordering using orderedIds
    const reorderedSet = new Set(orderedIds)
    const taskMap = new Map(updatedTasks.map(t => [t.id, t]))
    const reorderedTasks = orderedIds.map(id => taskMap.get(id)).filter(Boolean) as Task[]
    
    let reorderIndex = 0
    const finalTasks = updatedTasks.map(t => {
      if (reorderedSet.has(t.id)) {
        const matchingTask = reorderedTasks[reorderIndex++]
        if (matchingTask) {
          return {
            ...matchingTask,
            sortOrder: reorderIndex - 1
          }
        }
      }
      return t
    })

    saveTasks(finalTasks)

    // 3. Sync changes using the new server action
    const res = await syncTaskDragDropAction(taskId, updates, orderedIds)
    if (!res.success) {
      console.error("Failed to sync drag drop updates to database:", res.error)
    }
  }, [tasks, saveTasks])

  const clearDeletedTasks = useCallback(() => {
    saveDeletedTasks([])
  }, [saveDeletedTasks])

  return {
    tasks,
    setTasks,
    deletedTasks,
    setDeletedTasks,
    saveTasks,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    reorderTasks,
    reorderAndUpdateTask,
    clearDeletedTasks
  }
}
