export interface Task {
  id: string
  title: string
  completed: boolean
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null // YYYY-MM-DD
  projectId: string // 'inbox' or list ID
  tags: string[]
}
