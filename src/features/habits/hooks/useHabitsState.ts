import { useState, useCallback } from "react"
import { Habit } from "../types"
import { createHabitAction, toggleHabitRecordAction } from "@/src/app/actions"

export function useHabitsState(initialHabits: Habit[] = []) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [newHabitName, setNewHabitName] = useState("")
  const [newHabitColor, setNewHabitColor] = useState("#10b981")
  const [showAddHabit, setShowAddHabit] = useState(false)

  const saveHabits = useCallback((updatedHabits: Habit[]) => {
    setHabits(updatedHabits)
    localStorage.setItem("zoc_habits", JSON.stringify(updatedHabits))
  }, [])

  const addHabit = useCallback(async (
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
  ) => {
    if (!name.trim()) return

    const tempId = Date.now().toString()
    const newH: Habit = {
      id: tempId,
      name: name.trim(),
      color,
      streak: 0,
      records: {},
      icon: icon || null,
      frequency: frequency || "DAILY",
      repeatDays: repeatDays || [],
      goal: goal || 1,
      unit: unit || null,
      reminderTime: reminderTime || null,
      startDate: startDate || new Date().toISOString().split("T")[0],
      goalDays: goalDays || "Forever",
      section: section || "Others",
      goalType: goalType || "all",
      checkingMode: checkingMode || "auto",
      recordCount: recordCount || 1,
      frequencyType: frequencyType || "daily",
      frequencyValue: frequencyValue || 1,
    }

    const currentHabits = [newH, ...habits]
    saveHabits(currentHabits)

    const res = await createHabitAction(
      newH.name,
      newH.color,
      newH.icon,
      newH.frequency,
      newH.repeatDays,
      newH.goal,
      newH.unit,
      newH.reminderTime,
      newH.startDate,
      newH.goalDays,
      newH.section,
      newH.goalType,
      newH.checkingMode,
      newH.recordCount,
      newH.frequencyType,
      newH.frequencyValue
    )
    if (res.success && res.habitId) {
      setHabits((prev) => {
        const updated = prev.map((h) => (h.id === tempId ? { ...h, id: res.habitId! } : h))
        localStorage.setItem("zoc_habits", JSON.stringify(updated))
        return updated
      })
    }
  }, [habits, saveHabits])

  const editHabit = useCallback(async (
    habitId: string,
    updates: Partial<Omit<Habit, "id" | "records" | "streak">>
  ) => {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        return { ...h, ...updates }
      }
      return h
    })
    saveHabits(updated)

    const { updateHabitAction } = await import("@/src/app/actions")
    await updateHabitAction(habitId, updates)
  }, [habits, saveHabits])

  const deleteHabit = useCallback(async (habitId: string) => {
    const updated = habits.filter((h) => h.id !== habitId)
    saveHabits(updated)

    const { deleteHabitAction } = await import("@/src/app/actions")
    await deleteHabitAction(habitId)
  }, [habits, saveHabits])

  const toggleHabitRecord = useCallback(async (habitId: string, dateStr: string) => {
    let isDone = false
    const todayStr = new Date().toISOString().split("T")[0]

    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const currentStatus = h.records[dateStr] || false
        const nextStatus = !currentStatus
        isDone = nextStatus

        const newRecords = { ...h.records, [dateStr]: nextStatus }

        // Calculate new streak
        let streak = 0
        const checkDate = new Date()

        while (true) {
          const checkDateStr = checkDate.toISOString().split("T")[0]
          if (newRecords[checkDateStr]) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            if (checkDateStr === todayStr) {
              checkDate.setDate(checkDate.getDate() - 1)
              const yesterdayStr = checkDate.toISOString().split("T")[0]
              if (newRecords[yesterdayStr]) {
                checkDate.setDate(checkDate.getDate() - 1)
                continue
              }
            }
            break
          }
        }

        return { ...h, records: newRecords, streak }
      }
      return h
    })

    saveHabits(updated)
    await toggleHabitRecordAction(habitId, dateStr, isDone)
  }, [habits, saveHabits])

  return {
    habits,
    setHabits,
    newHabitName,
    setNewHabitName,
    newHabitColor,
    setNewHabitColor,
    showAddHabit,
    setShowAddHabit,
    addHabit,
    editHabit,
    deleteHabit,
    toggleHabitRecord,
  }
}
