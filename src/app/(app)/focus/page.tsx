"use client"

import React from "react"
import { useDashboard } from "@/src/components/dashboard/DashboardContext"
import { PomodoroTimer } from "@/src/features/focus"

export default function FocusPage() {
  const { pomodoroHook, tasksHook } = useDashboard()

  return (
    <PomodoroTimer
      focusMode={pomodoroHook.focusMode}
      setFocusMode={pomodoroHook.setFocusMode}
      timerActive={pomodoroHook.timerActive}
      timerMode={pomodoroHook.timerMode}
      timeLeft={pomodoroHook.timeLeft}
      selectedTaskId={pomodoroHook.selectedTaskId}
      setSelectedTaskId={pomodoroHook.setSelectedTaskId}
      tasks={tasksHook.tasks}
      focusStats={pomodoroHook.focusStats}
      focusRecords={pomodoroHook.focusRecords}
      onReset={pomodoroHook.handleResetTimer}
      onToggle={pomodoroHook.handleToggleTimer}
      onSetMode={pomodoroHook.handleSetTimerMode}
      formatTime={pomodoroHook.formatTime}
      handleStopwatchComplete={pomodoroHook.handleStopwatchComplete}
      handleDeleteRecord={pomodoroHook.handleDeleteRecord}
      handleAddManualRecord={pomodoroHook.handleAddManualRecord}
    />
  )
}
