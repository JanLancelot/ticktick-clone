"use server"

import prisma from "@/src/lib/prisma"
import { auth } from "@/src/lib/auth"
import { headers } from "next/headers"

// Helper to get authenticated session
async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    return session
  } catch (error) {
    console.error("Failed to retrieve session from database:", error)
    return null
  }
}

// 1. Fetch all dashboard data for user
export async function getDashboardData() {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "UNAUTHORIZED" }
  }

  try {
    const userId = session.user.id

    // Fetch or create default Inbox project
    let userProjects = await prisma.project.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    })

    let inboxProject = userProjects.find((p) => p.isDefault || p.kind === "INBOX")
    if (!inboxProject) {
      inboxProject = await prisma.project.create({
        data: {
          name: "Inbox",
          kind: "INBOX",
          isDefault: true,
          userId,
          color: "#3b82f6",
        },
      })
      userProjects.push(inboxProject)
    }

    const projectIds = userProjects.map((p) => p.id)

    // Fetch tasks belonging to user's projects
    const dbTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" }
      ],
    })

    // Fetch sections
    const dbSections = await prisma.section.findMany({
      where: {
        projectId: { in: projectIds },
      },
      orderBy: { sortOrder: "asc" },
    })

    // Fetch habits
    const dbHabits = await prisma.habit.findMany({
      where: { userId },
      include: {
        records: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform database tasks to client format
    const tasks = dbTasks.map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.status === "COMPLETED",
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
      projectId: (t.projectId === null || t.projectId === inboxProject?.id) ? "inbox" : t.projectId,
      sectionId: t.sectionId,
      tags: t.tags.map((tt) => tt.tag.name),
      content: t.content,
      sortOrder: t.sortOrder,
      parentId: t.parentId,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    }))

    // Transform database projects to client format
    const projects = userProjects
      .filter((p) => p.id !== inboxProject?.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color || "#94a3b8",
        icon: p.icon || null,
      }))

    // Transform database habits to client format
    const habits = dbHabits.map((h) => {
      const records: Record<string, number> = {}
      h.records.forEach((r) => {
        records[r.date.toISOString().split("T")[0]] = r.value
      })

      // Calculate streak on backend
      let streak = 0
      const checkDate = new Date()
      const recordMap = new Set(
        h.records
          .filter((r) => {
            const isComp = h.goalType === "amount" ? r.value >= (h.goal || 1) : r.value > 0
            return isComp
          })
          .map((r) => r.date.toISOString().split("T")[0])
      )

      const todayStr = new Date().toISOString().split("T")[0]
      while (true) {
        const checkDateStr = checkDate.toISOString().split("T")[0]
        if (recordMap.has(checkDateStr)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          if (checkDateStr === todayStr) {
            checkDate.setDate(checkDate.getDate() - 1)
            const yesterdayStr = checkDate.toISOString().split("T")[0]
            if (recordMap.has(yesterdayStr)) {
              checkDate.setDate(checkDate.getDate() - 1)
              continue
            }
          }
          break
        }
      }

      return {
        id: h.id,
        name: h.name,
        color: h.color || "#10b981",
        streak,
        records,
        icon: h.icon,
        frequency: h.frequency,
        repeatDays: h.repeatDays,
        goal: h.goal,
        reminderTime: h.reminderTime,
        startDate: h.startDate ? h.startDate.toISOString().split("T")[0] : undefined,
        unit: h.unit,
        goalDays: h.goalDays,
        section: h.section,
        goalType: h.goalType,
        checkingMode: h.checkingMode,
        recordCount: h.recordCount,
        frequencyType: h.frequencyType,
        frequencyValue: h.frequencyValue,
      }
    })

    const sections = dbSections.map((s) => ({
      id: s.id,
      name: s.name,
      projectId: s.projectId,
      sortOrder: s.sortOrder,
    }))

    return {
      success: true,
      data: { tasks, projects, habits, sections },
    }
  } catch (error: any) {
    console.error("Database error in getDashboardData:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 2. Create a new task
export async function createTaskAction(
  title: string,
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH",
  dueDateStr: string | null,
  projectId: string | null,
  tagStr: string | null,
  parentId: string | null = null,
  sectionId: string | null = null
) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const userId = session.user.id
    
    // Find or create default Inbox project if none provided
    let targetProjectId = projectId
    if (!targetProjectId || targetProjectId === "inbox") {
      let inbox = await prisma.project.findFirst({
        where: { userId, kind: "INBOX" },
      })
      if (!inbox) {
        inbox = await prisma.project.create({
          data: {
            name: "Inbox",
            kind: "INBOX",
            isDefault: true,
            userId,
            color: "#3b82f6",
          },
        })
      }
      targetProjectId = inbox.id
    }

    const task = await prisma.task.create({
      data: {
        title,
        priority,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
        projectId: targetProjectId,
        sectionId: sectionId || null,
        status: "NORMAL",
        parentId: parentId || null,
      },
    })

    // Handle tag mapping if present
    if (tagStr) {
      const tagName = tagStr.toLowerCase().trim()
      let tag = await prisma.tag.findFirst({
        where: { userId, name: tagName },
      })
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: tagName, userId },
        })
      }
      await prisma.tagTask.create({
        data: {
          tagId: tag.id,
          taskId: task.id,
        },
      })
    }

    return { success: true, taskId: task.id }
  } catch (error: any) {
    console.error("Database error in createTaskAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 3. Toggle task completion
export async function toggleTaskCompletionAction(taskId: string, completed: boolean) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: completed ? "COMPLETED" : "NORMAL",
        completedAt: completed ? new Date() : null,
      },
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in toggleTaskCompletionAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 4. Delete a task
export async function deleteTaskAction(taskId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in deleteTaskAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 5. Create a new custom list/project
export async function createProjectAction(name: string, color: string, icon?: string | null) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const userId = session.user.id
    const project = await prisma.project.create({
      data: {
        name,
        color,
        icon: icon || null,
        userId,
        kind: "LIST",
      },
    })
    return { success: true, projectId: project.id }
  } catch (error: any) {
    console.error("Database error in createProjectAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 5b. Update an existing custom list/project
export async function updateProjectAction(
  projectId: string,
  updates: { name?: string; color?: string; icon?: string | null }
) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const data: any = {}
    if (updates.name !== undefined) data.name = updates.name
    if (updates.color !== undefined) data.color = updates.color
    if (updates.icon !== undefined) data.icon = updates.icon

    await prisma.project.update({
      where: { id: projectId },
      data,
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in updateProjectAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 5c. Delete a custom list/project
export async function deleteProjectAction(projectId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    // Delete the project
    await prisma.project.delete({
      where: { id: projectId },
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in deleteProjectAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 6. Create a new habit
export async function createHabitAction(
  name: string,
  color: string,
  icon?: string | null,
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY",
  repeatDays?: number[],
  goal?: number,
  unit?: string | null,
  reminderTime?: string | null,
  startDate?: string | null,
  goalDays?: string | null,
  section?: string | null,
  goalType?: string | null,
  checkingMode?: string | null,
  recordCount?: number | null,
  frequencyType?: string | null,
  frequencyValue?: number | null
) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const userId = session.user.id
    const habit = await prisma.habit.create({
      data: {
        name,
        color,
        icon: icon || null,
        frequency: (frequency as any) || "DAILY",
        repeatDays: repeatDays || [],
        goal: goal || 1,
        unit: unit || null,
        reminderTime: reminderTime || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        goalDays: goalDays || "Forever",
        section: section || "Others",
        goalType: goalType || "all",
        checkingMode: checkingMode || "auto",
        recordCount: recordCount || 1,
        frequencyType: frequencyType || "daily",
        frequencyValue: frequencyValue || 1,
        userId,
      },
    })
    return { success: true, habitId: habit.id }
  } catch (error: any) {
    console.error("Database error in createHabitAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 6b. Update an existing habit
export async function updateHabitAction(
  habitId: string,
  updates: {
    name?: string
    color?: string
    icon?: string | null
    frequency?: "DAILY" | "WEEKLY" | "MONTHLY"
    repeatDays?: number[]
    goal?: number
    unit?: string | null
    reminderTime?: string | null
    startDate?: string | null
    goalDays?: string | null
    section?: string | null
    goalType?: string | null
    checkingMode?: string | null
    recordCount?: number | null
    frequencyType?: string | null
    frequencyValue?: number | null
  }
) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const data: any = {}
    if (updates.name !== undefined) data.name = updates.name
    if (updates.color !== undefined) data.color = updates.color
    if (updates.icon !== undefined) data.icon = updates.icon
    if (updates.frequency !== undefined) data.frequency = updates.frequency
    if (updates.repeatDays !== undefined) data.repeatDays = updates.repeatDays
    if (updates.goal !== undefined) data.goal = updates.goal
    if (updates.unit !== undefined) data.unit = updates.unit
    if (updates.reminderTime !== undefined) data.reminderTime = updates.reminderTime
    if (updates.startDate !== undefined) {
      data.startDate = updates.startDate ? new Date(updates.startDate) : new Date()
    }
    if (updates.goalDays !== undefined) data.goalDays = updates.goalDays
    if (updates.section !== undefined) data.section = updates.section
    if (updates.goalType !== undefined) data.goalType = updates.goalType
    if (updates.checkingMode !== undefined) data.checkingMode = updates.checkingMode
    if (updates.recordCount !== undefined) data.recordCount = updates.recordCount
    if (updates.frequencyType !== undefined) data.frequencyType = updates.frequencyType
    if (updates.frequencyValue !== undefined) data.frequencyValue = updates.frequencyValue

    await prisma.habit.update({
      where: { id: habitId },
      data,
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in updateHabitAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 6c. Delete a habit
export async function deleteHabitAction(habitId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    await prisma.habit.delete({
      where: { id: habitId },
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in deleteHabitAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 7. Toggle a habit log record
export async function toggleHabitRecordAction(habitId: string, dateStr: string, value: number) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const recordDate = new Date(dateStr)
    
    if (value > 0) {
      await prisma.habitRecord.upsert({
        where: {
          habitId_date: {
            habitId,
            date: recordDate,
          },
        },
        create: {
          habitId,
          date: recordDate,
          value,
        },
        update: {
          value,
        },
      })
    } else {
      await prisma.habitRecord.deleteMany({
        where: {
          habitId,
          date: recordDate,
        },
      })
    }
    return { success: true }
  } catch (error: any) {
    console.error("Database error in toggleHabitRecordAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 8. Update task properties (title, content, priority, dueDate, projectId, sectionId)
export async function updateTaskAction(
  taskId: string,
  updates: {
    title?: string
    content?: string | null
    priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
    dueDate?: string | null
    projectId?: string | null
    sectionId?: string | null
  }
) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const data: any = {}
    if (updates.title !== undefined) data.title = updates.title
    if (updates.content !== undefined) data.content = updates.content
    if (updates.priority !== undefined) data.priority = updates.priority
    if (updates.dueDate !== undefined) {
      data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null
    }
    if (updates.projectId !== undefined) {
      data.projectId = updates.projectId === "inbox" ? null : updates.projectId
    }
    if (updates.sectionId !== undefined) {
      data.sectionId = updates.sectionId
    }

    await prisma.task.update({
      where: { id: taskId },
      data,
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in updateTaskAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 9. Reorder multiple tasks in a transaction
export async function reorderTasksAction(taskIds: string[]) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    await prisma.$transaction(
      taskIds.map((id, index) =>
        prisma.task.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )
    return { success: true }
  } catch (error: any) {
    console.error("Database error in reorderTasksAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 10. Sync drag-and-drop task reordering and property updates in a transaction
export async function syncTaskDragDropAction(
  taskId: string,
  updates: {
    priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
    dueDate?: string | null
    projectId?: string | null
    sectionId?: string | null
    completed?: boolean
    tags?: string[]
  },
  orderedIds: string[]
) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const userId = session.user.id
    const data: any = {}
    if (updates.priority !== undefined) data.priority = updates.priority
    if (updates.dueDate !== undefined) {
      data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null
    }
    if (updates.projectId !== undefined) {
      data.projectId = updates.projectId === "inbox" ? null : updates.projectId
    }
    if (updates.sectionId !== undefined) {
      data.sectionId = updates.sectionId
    }
    if (updates.completed !== undefined) {
      data.status = updates.completed ? "COMPLETED" : "NORMAL"
      data.completedAt = updates.completed ? new Date() : null
    }

    const prismaUpdates: any[] = []

    // 1. Update the dragged task's properties if there are updates
    if (Object.keys(data).length > 0) {
      prismaUpdates.push(
        prisma.task.update({
          where: { id: taskId },
          data,
        })
      )
    }

    // 2. Handle tags update if provided
    let tagIdsToLink: string[] = []
    if (updates.tags !== undefined) {
      for (const tagName of updates.tags) {
        const name = tagName.toLowerCase().trim()
        if (!name) continue
        let tag = await prisma.tag.findFirst({
          where: { userId, name },
        })
        if (!tag) {
          tag = await prisma.tag.create({
            data: { name, userId },
          })
        }
        tagIdsToLink.push(tag.id)
      }

      // Delete existing TagTask mappings for this task
      prismaUpdates.push(
        prisma.tagTask.deleteMany({
          where: { taskId },
        })
      )

      // Create new TagTask mappings
      tagIdsToLink.forEach((tagId) => {
        prismaUpdates.push(
          prisma.tagTask.create({
            data: { tagId, taskId },
          })
        )
      })
    }

    // 3. Update the sort orders of all reordered tasks
    orderedIds.forEach((id, index) => {
      prismaUpdates.push(
        prisma.task.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    })

    // Execute all updates in a transaction
    await prisma.$transaction(prismaUpdates)
    return { success: true }
  } catch (error: any) {
    console.error("Database error in syncTaskDragDropAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 11. Create a new section
export async function createSectionAction(name: string, projectId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const section = await prisma.section.create({
      data: {
        name,
        projectId,
      },
    })
    return { success: true, sectionId: section.id }
  } catch (error: any) {
    console.error("Database error in createSectionAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 12. Update an existing section
export async function updateSectionAction(sectionId: string, name: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    await prisma.section.update({
      where: { id: sectionId },
      data: { name },
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in updateSectionAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 13. Delete a section
export async function deleteSectionAction(sectionId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    await prisma.section.delete({
      where: { id: sectionId },
    })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in deleteSectionAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 14. Reorder multiple sections in a transaction
export async function reorderSectionsAction(sectionIds: string[]) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.section.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )
    return { success: true }
  } catch (error: any) {
    console.error("Database error in reorderSectionsAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}



