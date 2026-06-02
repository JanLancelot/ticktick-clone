export interface Task {
  id: string
  title: string
  completed: boolean
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null // YYYY-MM-DD
  projectId: string // 'inbox' or list ID
  tags: string[]
  sectionId?: string | null // Added to support sections inside list
  content?: string | null // rich text / markdown notes
  sortOrder: number // Added to support custom sorting
  parentId?: string | null // Added to support subtasks
  completedAt?: string | null // Added to support completion grouping/filtering
  duration?: string | null // duration time range e.g. "09:00-17:00"
}

