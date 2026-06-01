"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useDashboard } from "@/src/components/dashboard/DashboardContext"
import { CalendarView } from "@/src/features/calendar"
import { useCelebration } from "@/components/ui/CelebrationContext"

export default function CalendarPage() {
  const router = useRouter()
  const { triggerCelebration } = useCelebration()
  const {
    tasksHook,
    calendarDate,
    setCalendarDate,
    setNewTaskDueDate,
    setActiveTab,
  } = useDashboard()

  return (
    <CalendarView
      tasks={tasksHook.tasks}
      calendarDate={calendarDate}
      setCalendarDate={setCalendarDate}
      onToggleTaskCompletion={(id) => {
        const task = tasksHook.tasks.find((t) => t.id === id)
        if (task && !task.completed) {
          triggerCelebration()
        }
        tasksHook.toggleTaskCompletion(id)
      }}
      onQuickAddTask={(dateStr) => {
        setNewTaskDueDate(dateStr)
        setActiveTab("inbox")
        router.push("/")
      }}
    />
  )
}

