import { useState, useCallback } from "react"
import { Project } from "../types"
import { createProjectAction, updateProjectAction, deleteProjectAction } from "@/src/app/actions"

export function useProjectsState(initialProjects: Project[] = []) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [newProjectName, setNewProjectName] = useState("")
  const [showAddProject, setShowAddProject] = useState(false)

  const saveProjects = useCallback((updatedProjects: Project[]) => {
    setProjects(updatedProjects)
    localStorage.setItem("zoc_projects", JSON.stringify(updatedProjects))
  }, [])

  const addProject = useCallback(async (name: string, color?: string, icon?: string | null) => {
    if (!name.trim()) return

    const randomColors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"]
    const finalColor = color || randomColors[Math.floor(Math.random() * randomColors.length)]
    const tempId = Date.now().toString()

    const newProj: Project = {
      id: tempId,
      name: name.trim(),
      color: finalColor,
      icon: icon || null
    }

    // Optimistic update
    const currentProjects = [...projects, newProj]
    saveProjects(currentProjects)

    // Sync to database
    const res = await createProjectAction(newProj.name, newProj.color, newProj.icon)
    if (res.success && res.projectId) {
      setProjects(prev => {
        const updated = prev.map(p => p.id === tempId ? { ...p, id: res.projectId! } : p)
        localStorage.setItem("zoc_projects", JSON.stringify(updated))
        return updated
      })
    }
  }, [projects, saveProjects])

  const updateProject = useCallback(async (id: string, name: string, color: string, icon: string | null) => {
    if (!name.trim()) return

    // Optimistic update
    const updatedProjects = projects.map(p => 
      p.id === id ? { ...p, name: name.trim(), color, icon } : p
    )
    saveProjects(updatedProjects)

    // Sync to database
    const res = await updateProjectAction(id, { name: name.trim(), color, icon })
    if (!res.success) {
      console.error("Failed to sync project update:", res.error)
    }
  }, [projects, saveProjects])

  const deleteProject = useCallback(async (id: string) => {
    // Optimistic update
    const updatedProjects = projects.filter(p => p.id !== id)
    saveProjects(updatedProjects)

    // Sync to database
    const res = await deleteProjectAction(id)
    if (!res.success) {
      console.error("Failed to delete project:", res.error)
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
    addProject,
    updateProject,
    deleteProject
  }
}
