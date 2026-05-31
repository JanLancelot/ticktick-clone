"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useDashboard } from "@/src/components/dashboard/DashboardContext"
import { CalendarView } from "@/src/features/calendar"

export default function CalendarPage() {
  const router = useRouter()
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
      onToggleTaskCompletion={tasksHook.toggleTaskCompletion}
      onQuickAddTask={(dateStr) => {
        setNewTaskDueDate(dateStr)
        setActiveTab("inbox")
        router.push("/")
      }}
    />
  )
}
