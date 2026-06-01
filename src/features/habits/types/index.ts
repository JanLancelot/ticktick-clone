export interface Habit {
  id: string
  name: string
  color: string
  streak: number
  records: Record<string, boolean> // YYYY-MM-DD -> completed
  icon?: string | null
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY"
  repeatDays?: number[]
  goal?: number
  reminderTime?: string | null
  startDate?: string
  unit?: string | null
  goalDays?: string | null
  section?: string | null
  goalType?: string | null
  checkingMode?: string | null
  recordCount?: number | null
  frequencyType?: string | null
  frequencyValue?: number | null
}
