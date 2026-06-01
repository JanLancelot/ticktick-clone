"use client"

import React from "react"
import { useDashboard } from "@/src/components/dashboard/DashboardContext"
import { HabitsView } from "@/src/features/habits"

export default function HabitsPage() {
  const { habitsHook } = useDashboard()

  return (
    <HabitsView
      habits={habitsHook.habits}
      showAddHabit={habitsHook.showAddHabit}
      setShowAddHabit={habitsHook.setShowAddHabit}
      onAddHabit={habitsHook.addHabit}
      onToggleRecord={habitsHook.toggleHabitRecord}
      onDeleteHabit={habitsHook.deleteHabit}
      onEditHabit={habitsHook.editHabit}
    />
  )
}
