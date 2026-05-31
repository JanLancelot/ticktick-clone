import { useState, useCallback } from "react"
import { Task } from "../types"
import { createTaskAction, toggleTaskCompletionAction, deleteTaskAction } from "@/src/app/actions"

export function useTasksState(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])

  const saveTasks = useCallback((updatedTasks: Task[]) => {
    setTasks(updatedTasks)
    localStorage.setItem("zoc_tasks", JSON.stringify(updatedTasks))
  }, [])

  const addTask = useCallback(async (
    title: string,
    priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" = "NONE",
    dueDate: string | null = null,
    projectId: string = "inbox",
    tagStr: string = ""
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
      tags: tagStr.trim() ? [tagStr.trim().toLowerCase()] : []
    }

    const currentTasks = [...tasks, tempTask]
    saveTasks(currentTasks)

    const res = await createTaskAction(
      tempTask.title,
      tempTask.priority,
      tempTask.dueDate,
      tempTask.projectId,
      tagStr.trim() || null
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
        return { ...t, completed: isCompleted }
      }
      return t
    })
    
    saveTasks(updated)
    await toggleTaskCompletionAction(taskId, isCompleted)
  }, [tasks, saveTasks])

  const deleteTask = useCallback(async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId)
    if (taskToDelete) {
      setDeletedTasks(prev => [...prev, taskToDelete])
    }
    const updated = tasks.filter(t => t.id !== taskId)
    saveTasks(updated)

    await deleteTaskAction(taskId)
  }, [tasks, saveTasks])

  return {
    tasks,
    setTasks,
    deletedTasks,
    setDeletedTasks,
    saveTasks,
    addTask,
    toggleTaskCompletion,
    deleteTask
  }
}
