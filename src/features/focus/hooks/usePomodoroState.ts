import { useState, useEffect, useRef, useCallback } from "react"

interface FocusStats {
  focusMinutes: number
  completedSessions: number
}

interface Task {
  id: string
  title: string
  completed: boolean
}

export function usePomodoroState(
  tasks: Task[],
  onCompleteTask: (taskId: string) => Promise<void> | void
) {
  const [timerActive, setTimerActive] = useState(false)
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [focusStats, setFocusStats] = useState<FocusStats>({ focusMinutes: 0, completedSessions: 0 })
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load focus stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem("zoc_focus_stats")
    if (savedStats) {
      setFocusStats(JSON.parse(savedStats))
    }
  }, [])

  // Save focus stats on modification
  const saveFocusStats = useCallback((updatedStats: FocusStats) => {
    setFocusStats(updatedStats)
    localStorage.setItem("zoc_focus_stats", JSON.stringify(updatedStats))
  }, [])

  const handleResetTimer = useCallback(() => {
    setTimerActive(false)
    if (timerMode === "focus") {
      setTimeLeft(25 * 60)
    } else if (timerMode === "shortBreak") {
      setTimeLeft(5 * 60)
    } else {
      setTimeLeft(15 * 60)
    }
  }, [timerMode])

  const handleTimerCompleted = useCallback(() => {
    setTimerActive(false)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

    if (timerMode === "focus") {
      const minutesCompleted = 25
      const newStats = {
        focusMinutes: focusStats.focusMinutes + minutesCompleted,
        completedSessions: focusStats.completedSessions + 1,
      }
      saveFocusStats(newStats)

      if (selectedTaskId) {
        onCompleteTask(selectedTaskId)
        setSelectedTaskId(null)
      }

      alert("🎉 Focus session completed! Outstanding job. Take a short break!")
      setTimerMode("shortBreak")
      setTimeLeft(5 * 60)
    } else {
      alert("⏱️ Break is over! Let's get back to crushing goals.")
      setTimerMode("focus")
      setTimeLeft(25 * 60)
    }
  }, [timerMode, focusStats, selectedTaskId, onCompleteTask, saveFocusStats])

  // Timer countdown countdown interval
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerCompleted()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [timerActive, handleTimerCompleted])

  const handleToggleTimer = useCallback(() => {
    setTimerActive((prev) => !prev)
  }, [])

  const handleSetTimerMode = useCallback((mode: "focus" | "shortBreak" | "longBreak") => {
    setTimerActive(false)
    setTimerMode(mode)
    if (mode === "focus") setTimeLeft(25 * 60)
    else if (mode === "shortBreak") setTimeLeft(5 * 60)
    else setTimeLeft(15 * 60)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  return {
    timerActive,
    timerMode,
    timeLeft,
    selectedTaskId,
    setSelectedTaskId,
    focusStats,
    handleResetTimer,
    handleToggleTimer,
    handleSetTimerMode,
    formatTime,
  }
}
