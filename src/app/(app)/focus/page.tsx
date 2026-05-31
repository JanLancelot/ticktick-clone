"use client"

import React from "react"
import { useDashboard } from "@/src/components/dashboard/DashboardContext"
import { PomodoroTimer } from "@/src/features/focus"

export default function FocusPage() {
  const { pomodoroHook, tasksHook } = useDashboard()

  return (
    <PomodoroTimer
      timerActive={pomodoroHook.timerActive}
      timerMode={pomodoroHook.timerMode}
      timeLeft={pomodoroHook.timeLeft}
      selectedTaskId={pomodoroHook.selectedTaskId}
      setSelectedTaskId={pomodoroHook.setSelectedTaskId}
      tasks={tasksHook.tasks}
      onReset={pomodoroHook.handleResetTimer}
      onToggle={pomodoroHook.handleToggleTimer}
      onSetMode={pomodoroHook.handleSetTimerMode}
      formatTime={pomodoroHook.formatTime}
    />
  )
}
