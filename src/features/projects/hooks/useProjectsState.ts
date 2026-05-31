import { useState, useCallback } from "react"
import { Project } from "../types"
import { createProjectAction } from "@/src/app/actions"

export function useProjectsState(initialProjects: Project[] = []) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [newProjectName, setNewProjectName] = useState("")
  const [showAddProject, setShowAddProject] = useState(false)

  const saveProjects = useCallback((updatedProjects: Project[]) => {
    setProjects(updatedProjects)
    localStorage.setItem("zoc_projects", JSON.stringify(updatedProjects))
  }, [])

  const addProject = useCallback(async (name: string) => {
    if (!name.trim()) return

    const randomColors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"]
    const color = randomColors[Math.floor(Math.random() * randomColors.length)]
    const tempId = Date.now().toString()

    const newProj: Project = {
      id: tempId,
      name: name.trim(),
      color
    }

    // Optimistic update
    const currentProjects = [...projects, newProj]
    saveProjects(currentProjects)

    // Sync to database
    const res = await createProjectAction(newProj.name, newProj.color)
    if (res.success && res.projectId) {
      setProjects(prev => {
        const updated = prev.map(p => p.id === tempId ? { ...p, id: res.projectId! } : p)
        localStorage.setItem("zoc_projects", JSON.stringify(updated))
        return updated
      })
    }
  }, [projects, saveProjects])

  return {
    projects,
    setProjects,
    saveProjects,
    newProjectName,
    setNewProjectName,
    showAddProject,
    setShowAddProject,
    addProject
  }
}
