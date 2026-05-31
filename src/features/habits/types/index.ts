export interface Habit {
  id: string
  name: string
  color: string
  streak: number
  records: Record<string, boolean> // YYYY-MM-DD -> completed
}
