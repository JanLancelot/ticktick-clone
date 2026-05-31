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
      tags: t.tags.map((tt) => tt.tag.name),
      content: t.content,
      sortOrder: t.sortOrder,
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
      const records: Record<string, boolean> = {}
      h.records.forEach((r) => {
        records[r.date.toISOString().split("T")[0]] = true
      })

      return {
        id: h.id,
        name: h.name,
        color: h.color || "#10b981",
        streak: h.goal, // mapping goal/streak representation
        records,
      }
    })

    return {
      success: true,
      data: { tasks, projects, habits },
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
  tagStr: string | null
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
        status: "NORMAL",
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
export async function createHabitAction(name: string, color: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const userId = session.user.id
    const habit = await prisma.habit.create({
      data: {
        name,
        color,
        userId,
      },
    })
    return { success: true, habitId: habit.id }
  } catch (error: any) {
    console.error("Database error in createHabitAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 7. Toggle a habit log record
export async function toggleHabitRecordAction(habitId: string, dateStr: string, completed: boolean) {
  const session = await getSession()
  if (!session) return { success: false, error: "UNAUTHORIZED" }

  try {
    const recordDate = new Date(dateStr)
    
    if (completed) {
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
          value: 1,
        },
        update: {
          value: 1,
        },
      })
    } else {
      await prisma.habitRecord.delete({
        where: {
          habitId_date: {
            habitId,
            date: recordDate,
          },
        },
      })
    }
    return { success: true }
  } catch (error: any) {
    console.error("Database error in toggleHabitRecordAction:", error)
    return { success: false, error: "DATABASE_UNAVAILABLE" }
  }
}

// 8. Update task properties (title, content, priority, dueDate, projectId)
export async function updateTaskAction(
  taskId: string,
  updates: {
    title?: string
    content?: string | null
    priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
    dueDate?: string | null
    projectId?: string | null
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



