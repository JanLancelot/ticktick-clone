import { useState, useEffect, useRef, useCallback } from "react"

export interface FocusRecord {
  id: string
  taskId?: string | null
  taskTitle?: string | null
  type: "POMODORO" | "STOPWATCH"
  startedAt: string
  endedAt: string
  duration: number // in seconds
}

export interface FocusStats {
  focusMinutes: number
  completedSessions: number
}

interface Task {
  id: string
  title: string
  completed: boolean
}

// Simple Web Audio API Chime Synth to keep it purely zero-dependency and fast
const playChime = () => {
  if (typeof window === "undefined") return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    
    // Play a sweet double bell chime
    const playBell = (time: number, pitch: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = "sine"
      osc.frequency.setValueAtTime(pitch, time)
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, time + 0.1)
      
      gain.gain.setValueAtTime(0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8)
      
      osc.start(time)
      osc.stop(time + 0.8)
    }
    
    const now = ctx.currentTime
    playBell(now, 523.25) // C5
    playBell(now + 0.15, 659.25) // E5
    playBell(now + 0.3, 783.99) // G5
    playBell(now + 0.45, 1046.50) // C6 (high bell sound)
  } catch (err) {
    console.error("Failed to play chime audio", err)
  }
}

export function usePomodoroState(
  tasks: Task[],
  onCompleteTask: (taskId: string) => Promise<void> | void
) {
  const [focusMode, setFocusMode] = useState<"pomo" | "stopwatch">("pomo")
  const [timerActive, setTimerActive] = useState(false)
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  
  // Custom Focus Records State
  const [focusRecords, setFocusRecords] = useState<FocusRecord[]>([])
  
  // Stats summary (will be calculated dynamically from focusRecords to ensure 100% data sync)
  const [focusStats, setFocusStats] = useState<FocusStats>({ focusMinutes: 0, completedSessions: 0 })
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  // 1. Initial Load from localStorage
  useEffect(() => {
    const savedRecords = localStorage.getItem("zoc_focus_records")
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords)
        setFocusRecords(parsed)
      } catch (err) {
        console.error("Failed to parse focus records", err)
      }
    }
  }, [])

  // 2. Dynamically calculate stats whenever records change to guarantee integrity
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    
    // Total stats
    let totalMinutes = 0
    let pomoCount = 0

    focusRecords.forEach((rec) => {
      // Round duration to minutes for total focus duration
      totalMinutes += Math.round(rec.duration / 60)
      if (rec.type === "POMODORO") {
        pomoCount++
      }
    })

    setFocusStats({
      focusMinutes: totalMinutes,
      completedSessions: pomoCount,
    })

    // Persist records
    localStorage.setItem("zoc_focus_records", JSON.stringify(focusRecords))
  }, [focusRecords])

  // Track session start when timer is started
  useEffect(() => {
    if (timerActive && !sessionStartRef.current) {
      sessionStartRef.current = new Date()
    } else if (!timerActive) {
      sessionStartRef.current = null
    }
  }, [timerActive])

  // Switch modes: Pomo vs Stopwatch
  const handleSetFocusMode = useCallback((mode: "pomo" | "stopwatch") => {
    setTimerActive(false)
    setFocusMode(mode)
    setTimerMode("focus")
    if (mode === "pomo") {
      setTimeLeft(25 * 60)
    } else {
      setTimeLeft(0)
    }
    sessionStartRef.current = null
  }, [])

  const handleResetTimer = useCallback(() => {
    setTimerActive(false)
    if (focusMode === "pomo") {
      setTimeLeft(timerMode === "focus" ? 25 * 60 : 5 * 60)
    } else {
      setTimeLeft(0)
    }
    sessionStartRef.current = null
  }, [focusMode, timerMode])

  // Manual session deletion
  const handleDeleteRecord = useCallback((id: string) => {
    setFocusRecords((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // Add a manual record offline
  const handleAddManualRecord = useCallback((
    taskTitle: string,
    dateStr: string,
    durationMinutes: number,
    startTimeStr: string,
    endTimeStr: string
  ) => {
    const durationSeconds = durationMinutes * 60
    
    // Parse times
    const startedAt = new Date(`${dateStr}T${startTimeStr || "00:00"}:00`).toISOString()
    const endedAt = new Date(`${dateStr}T${endTimeStr || "00:00"}:00`).toISOString()

    const newRecord: FocusRecord = {
      id: "manual_" + Math.random().toString(36).substr(2, 9),
      taskId: null,
      taskTitle: taskTitle || "Manual Focus Session",
      type: "POMODORO",
      startedAt,
      endedAt,
      duration: durationSeconds,
    }

    setFocusRecords((prev) => [newRecord, ...prev])
    playChime()
  }, [])

  // Complete and save Stopwatch session
  const handleStopwatchComplete = useCallback(() => {
    if (timeLeft < 5) {
      // Don't save sessions under 5 seconds
      setTimerActive(false)
      setTimeLeft(0)
      sessionStartRef.current = null
      return
    }

    setTimerActive(false)
    const startTime = sessionStartRef.current || new Date(Date.now() - timeLeft * 1000)
    const endTime = new Date()

    const selectedTask = tasks.find((t) => t.id === selectedTaskId)

    const newRecord: FocusRecord = {
      id: "stopwatch_" + Math.random().toString(36).substr(2, 9),
      taskId: selectedTaskId,
      taskTitle: selectedTaskId && selectedTask ? selectedTask.title : "No specific task",
      type: "STOPWATCH",
      startedAt: startTime.toISOString(),
      endedAt: endTime.toISOString(),
      duration: timeLeft,
    }

    setFocusRecords((prev) => [newRecord, ...prev])
    playChime()
    setTimeLeft(0)
    sessionStartRef.current = null

    if (selectedTaskId) {
      onCompleteTask(selectedTaskId)
      setSelectedTaskId(null)
    }
  }, [timeLeft, selectedTaskId, tasks, onCompleteTask])

  // Timer/Stopwatch Completed Logic
  const handleTimerCompleted = useCallback(() => {
    setTimerActive(false)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

    playChime()

    if (focusMode === "pomo") {
      if (timerMode === "focus") {
        // 1. Save Focus Session record
        const startTime = sessionStartRef.current || new Date(Date.now() - 25 * 60000)
        const endTime = new Date()
        const selectedTask = tasks.find((t) => t.id === selectedTaskId)

        const newRecord: FocusRecord = {
          id: "pomo_" + Math.random().toString(36).substr(2, 9),
          taskId: selectedTaskId,
          taskTitle: selectedTaskId && selectedTask ? selectedTask.title : "No specific task",
          type: "POMODORO",
          startedAt: startTime.toISOString(),
          endedAt: endTime.toISOString(),
          duration: 25 * 60,
        }

        setFocusRecords((prev) => [newRecord, ...prev])

        if (selectedTaskId) {
          onCompleteTask(selectedTaskId)
          setSelectedTaskId(null)
        }

        // 2. Transition automatically to short break
        setTimerMode("break")
        setTimeLeft(5 * 60)
        setTimerActive(true) // Breaks are automatic! Start automatically
        sessionStartRef.current = new Date()
      } else {
        // Break is over
        setTimerMode("focus")
        setTimeLeft(25 * 60)
        setTimerActive(false) // Wait for user to start next focus
        sessionStartRef.current = null
      }
    }
  }, [focusMode, timerMode, selectedTaskId, tasks, onCompleteTask])

  // Core ticker interval
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (focusMode === "pomo") {
            if (prev <= 1) {
              handleTimerCompleted()
              return 0
            }
            return prev - 1
          } else {
            // Stopwatch counts up indefinitely
            return prev + 1
          }
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [timerActive, focusMode, handleTimerCompleted])

  const handleToggleTimer = useCallback(() => {
    setTimerActive((prev) => !prev)
  }, [])

  const handleSetTimerMode = useCallback((mode: "focus" | "break") => {
    setTimerActive(false)
    setTimerMode(mode)
    if (focusMode === "pomo") {
      setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60)
    }
    sessionStartRef.current = null
  }, [focusMode])

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  return {
    focusMode,
    setFocusMode: handleSetFocusMode,
    timerActive,
    timerMode,
    timeLeft,
    selectedTaskId,
    setSelectedTaskId,
    focusStats,
    focusRecords,
    handleResetTimer,
    handleToggleTimer,
    handleSetTimerMode,
    formatTime,
    handleStopwatchComplete,
    handleDeleteRecord,
    handleAddManualRecord,
  }
}
