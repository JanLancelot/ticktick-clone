import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { FocusRecord, FocusStats } from "../hooks/usePomodoroState"
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  MoreHorizontal,
  Clock,
  CheckCircle,
  Trash2,
  ChevronRight,
  Search,
  X,
  Check,
  Award,
  Zap,
  Info
} from "lucide-react"

interface Task {
  id: string
  title: string
  completed: boolean
}

interface PomodoroTimerProps {
  focusMode: "pomo" | "stopwatch"
  setFocusMode: (mode: "pomo" | "stopwatch") => void
  timerActive: boolean
  timerMode: "focus" | "break"
  timeLeft: number
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  tasks: Task[]
  focusStats: FocusStats
  focusRecords: FocusRecord[]
  onReset: () => void
  onToggle: () => void
  onSetMode: (mode: "focus" | "break") => void
  formatTime: (seconds: number) => string
  handleStopwatchComplete: () => void
  handleDeleteRecord: (id: string) => void
  handleAddManualRecord: (
    taskTitle: string,
    dateStr: string,
    durationMinutes: number,
    startTimeStr: string,
    endTimeStr: string
  ) => void
}

export function PomodoroTimer({
  focusMode,
  setFocusMode,
  timerActive,
  timerMode,
  timeLeft,
  selectedTaskId,
  setSelectedTaskId,
  tasks,
  focusStats,
  focusRecords,
  onReset,
  onToggle,
  onSetMode,
  formatTime,
  handleStopwatchComplete,
  handleDeleteRecord,
  handleAddManualRecord,
}: PomodoroTimerProps) {
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [taskSearch, setTaskSearch] = useState("")

  // Form states for manual record
  const [manualTitle, setManualTitle] = useState("")
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0])
  const [manualDuration, setManualDuration] = useState(25)
  const [manualStart, setManualStart] = useState("09:00")
  const [manualEnd, setManualEnd] = useState("09:25")

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  // Filter uncompleted tasks for custom picker
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed)
      .filter((t) => t.title.toLowerCase().includes(taskSearch.toLowerCase()))
  }, [tasks, taskSearch])

  // Group records by date for chronicle timeline
  const groupedRecords = useMemo(() => {
    const groups: Record<string, FocusRecord[]> = {}
    
    // Sort records descending by startedAt
    const sortedRecords = [...focusRecords].sort((a, b) => b.startedAt.localeCompare(a.startedAt))

    sortedRecords.forEach((rec) => {
      const dateObj = new Date(rec.startedAt)
      let dateLabel = "Today"
      
      const todayStr = new Date().toISOString().split("T")[0]
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]
      
      const recDateStr = rec.startedAt.split("T")[0]

      if (recDateStr === todayStr) {
        dateLabel = "Today"
      } else if (recDateStr === yesterdayStr) {
        dateLabel = "Yesterday"
      } else {
        dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      }

      if (!groups[dateLabel]) {
        groups[dateLabel] = []
      }
      groups[dateLabel].push(rec)
    })

    return Object.keys(groups).map((date) => ({
      date,
      records: groups[date],
    }))
  }, [focusRecords])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTitle.trim()) return
    handleAddManualRecord(manualTitle, manualDate, manualDuration, manualStart, manualEnd)
    
    // Reset Form
    setManualTitle("")
    setManualDuration(25)
    setShowManualModal(false)
  }

  // Auto calculate manual end time based on start time and duration
  const handleStartTimeChange = (start: string) => {
    setManualStart(start)
    if (!start) return
    const [hrs, mins] = start.split(":").map(Number)
    const totalMins = hrs * 60 + mins + Number(manualDuration)
    const endHrs = Math.floor(totalMins / 60) % 24
    const endMins = totalMins % 60
    setManualEnd(`${endHrs.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`)
  }

  const handleDurationChange = (dur: number) => {
    setManualDuration(dur)
    if (!manualStart) return
    const [hrs, mins] = manualStart.split(":").map(Number)
    const totalMins = hrs * 60 + mins + Number(dur)
    const endHrs = Math.floor(totalMins / 60) % 24
    const endMins = totalMins % 60
    setManualEnd(`${endHrs.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`)
  }

  // Calculate format total focus duration string (e.g. "2 h 24 m")
  const formatTotalDuration = (minutes: number) => {
    if (minutes === 0) return "0 m"
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs} h ${mins} m`
    }
    return `${mins} m`
  }

  // Get active color styling based on timer mode
  const getThemeColors = () => {
    if (focusMode === "stopwatch") {
      return {
        bg: "from-blue-500/10 via-indigo-500/5 to-transparent",
        glow: "border-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]",
        stroke: "text-blue-500",
        pulse: "border-blue-500/30",
        button: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30",
      }
    }
    if (timerMode === "break") {
      return {
        bg: "from-emerald-500/10 via-teal-500/5 to-transparent",
        glow: "border-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]",
        stroke: "text-emerald-500",
        pulse: "border-emerald-500/30",
        button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30",
      }
    }
    return {
      bg: "from-orange-500/10 via-amber-500/5 to-transparent",
      glow: "border-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.35)]",
      stroke: "text-orange-500",
      pulse: "border-orange-500/30",
      button: "bg-orange-600 hover:bg-orange-700 shadow-orange-600/30",
    }
  }

  const theme = getThemeColors()

  // Circular progress stroke dash offset
  const dashOffset = useMemo(() => {
    const radius = 118
    const circumference = 2 * Math.PI * radius
    if (focusMode === "stopwatch") {
      // Stopwatch loop animation every 60s
      const progress = (timeLeft % 60) / 60
      return circumference * (1 - progress)
    }
    // Pomodoro countdown
    const maxTime = timerMode === "focus" ? 25 * 60 : 5 * 60
    const progress = timeLeft / maxTime
    return circumference * (1 - progress)
  }, [timeLeft, timerMode, focusMode])

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch h-full w-full max-w-6xl mx-auto select-none animate-fade-in relative">
      {/* Background Radial Glow Effect */}
      <div className={`absolute -left-12 -top-12 w-96 h-96 rounded-full bg-gradient-to-tr ${theme.bg} blur-3xl pointer-events-none opacity-60 transition-all duration-1000`} />
      
      {/* Left Column: Premium Focus Terminal */}
      <div className="flex-1 bg-card/60 backdrop-blur-xl border border-border/80 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col justify-between items-center relative min-h-[580px] overflow-visible">
        
        {/* Sub Header row: Title, Mode Tabs, and Quick Actions */}
        <div className="w-full flex items-center justify-between gap-4 border-b border-border/40 pb-5 z-20">
          <h2 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
            Pomodoro
          </h2>

          {/* Premium Animated Segmented Control */}
          <div className="flex bg-muted/60 p-0.5 rounded-xl border border-border/40 relative w-44">
            <button
              onClick={() => setFocusMode("pomo")}
              className={`flex-1 py-1.5 text-[10px] font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer relative z-10 ${
                focusMode === "pomo" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pomo
            </button>
            <button
              onClick={() => setFocusMode("stopwatch")}
              className={`flex-1 py-1.5 text-[10px] font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer relative z-10 ${
                focusMode === "stopwatch" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Stopwatch
            </button>
            <div
              className={`absolute top-0.5 bottom-0.5 bg-card border border-border/40 rounded-lg shadow-3xs transition-all duration-300 w-[86px] ${
                focusMode === "stopwatch" ? "left-[90px]" : "left-0.5"
              }`}
            />
          </div>

          {/* Top-Right Quick Options */}
          <div className="flex items-center gap-1.5 relative">
            <button
              onClick={() => setShowManualModal(true)}
              className="p-2 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-3xs"
              title="Add Manual Log"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-3xs"
              title="Reset View"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {/* Float Dropdown Options */}
            {showOptionsMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowOptionsMenu(false)} />
                <div className="absolute right-0 top-11 w-44 bg-card border border-border/80 rounded-xl shadow-lg py-1 z-40 animate-fade-in">
                  <button
                    onClick={() => {
                      onReset()
                      setShowOptionsMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Clock
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Reset all focus stats & log history? This cannot be undone.")) {
                        localStorage.removeItem("zoc_focus_records")
                        window.location.reload()
                      }
                      setShowOptionsMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer flex items-center gap-2 border-t border-border/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear History
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected Task Context Button */}
        <div className="relative mt-4 w-full flex justify-center z-20">
          <button
            onClick={() => setShowTaskPicker(!showTaskPicker)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-border/70 bg-card hover:bg-muted text-xs font-bold transition-all shadow-3xs hover:-translate-y-0.5 cursor-pointer max-w-sm truncate"
          >
            <Zap className={`h-3.5 w-3.5 ${timerActive ? "animate-pulse text-amber-500" : "text-muted-foreground"}`} />
            <span>
              {selectedTaskId && selectedTask ? `Focusing: ${selectedTask.title}` : "Focus Goal"}
            </span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>

          {/* Premium Custom Task Selector Popover */}
          {showTaskPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowTaskPicker(false)} />
              <div className="absolute top-11 mt-1 w-72 bg-card border border-border/80 rounded-2xl shadow-xl p-3 z-40 animate-fade-in flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">
                    Select Active Task
                  </span>
                  {selectedTaskId && (
                    <button
                      onClick={() => {
                        setSelectedTaskId(null)
                        setShowTaskPicker(false)
                      }}
                      className="text-[9px] text-red-500 hover:underline font-extrabold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search active tasks..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-xs bg-background rounded-lg border border-border focus:outline-none font-bold"
                  />
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredTasks.length === 0 ? (
                    <p className="text-[10px] text-center py-4 text-muted-foreground font-semibold">
                      No active tasks found.
                    </p>
                  ) : (
                    filteredTasks.map((t) => {
                      const isSelected = selectedTaskId === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskId(t.id)
                            setShowTaskPicker(false)
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected ? "bg-primary/5 text-primary font-extrabold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className="truncate pr-4">{t.title}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[3px]" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Circular Clock Dial */}
        <div className="relative my-8 h-64 w-64 rounded-full flex flex-col items-center justify-center select-none z-10 transition-all duration-1000">
          
          {/* Animated Glow Backring */}
          <div className={`absolute inset-0 rounded-full border-4 border-dashed pointer-events-none transition-all duration-1000 ${
            timerActive ? `animate-spin duration-30s ${theme.pulse}` : "border-muted/30"
          }`} />

          {/* Circular Sub-pixel Smooth SVG Progress Bar */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="118"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/10"
            />
            <circle
              cx="128"
              cy="128"
              r="118"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="5.5"
              className={`${theme.stroke} transition-all duration-1000`}
              strokeDasharray={2 * Math.PI * 118}
              strokeDashoffset={dashOffset}
            />
          </svg>

          {/* Clock Concentric Tick Lines Decoration */}
          <div className="absolute inset-4 rounded-full border border-border/20 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-3 rounded-full border border-dashed border-border/10" />
          </div>

          {/* Central Time Indicators */}
          <div className="text-center z-10 space-y-1">
            <h2 className="text-5xl font-black font-mono tracking-wider tabular-nums leading-none">
              {formatTime(timeLeft)}
            </h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mt-2">
              {focusMode === "stopwatch" ? (
                timerActive ? "Stopwatch Running" : "Elapsed Time"
              ) : timerMode === "break" ? (
                "Refreshing Mind"
              ) : timerActive ? (
                "Deep Concentration"
              ) : (
                "Ready to Focus"
              )}
            </p>
          </div>
        </div>

        {/* Play/Pause Control Buttons Row */}
        <div className="flex items-center gap-4.5 pt-2 z-20">
          
          {/* Reset button */}
          <Button
            onClick={onReset}
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl cursor-pointer border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-3xs"
            title="Reset Session"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </Button>

          {/* Main Action Start/Pause button */}
          <button
            onClick={onToggle}
            className={`h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-white transition-all duration-300 hover:scale-105 active:scale-[0.98] cursor-pointer shadow-md ${theme.button}`}
          >
            {timerActive ? <Pause className="h-6 w-6 stroke-[2.5px]" /> : <Play className="h-6 w-6 ml-0.5 stroke-[2.5px]" />}
          </button>

          {/* Stop / Complete Session button for Stopwatch Mode */}
          {focusMode === "stopwatch" && (
            <Button
              onClick={handleStopwatchComplete}
              disabled={timeLeft === 0}
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl cursor-pointer border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-3xs disabled:opacity-40 disabled:pointer-events-none"
              title="Stop & Log Session"
            >
              <CheckCircle className="h-4.5 w-4.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Right Column: Statistics & Chronicle Focus Record */}
      <div className="w-full lg:w-[360px] flex flex-col space-y-6 shrink-0 h-full">
        
        {/* Right Section 1: Overview Panel */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/85 p-5.5 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Overview
            </h3>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 select-none">
            {/* Card 1: Today's Pomos */}
            <div className="bg-muted/30 border border-border/60 p-3.5 rounded-2xl transition-all hover:-translate-y-0.5 hover:bg-muted/40">
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Today's Pomos</p>
              <h4 className="text-2xl font-black mt-1 leading-none">{focusStats.completedSessions}</h4>
            </div>

            {/* Card 2: Today's Focus Duration */}
            <div className="bg-muted/30 border border-border/60 p-3.5 rounded-2xl transition-all hover:-translate-y-0.5 hover:bg-muted/40">
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Today's Focus</p>
              <h4 className="text-2xl font-black mt-1 leading-none">
                {formatTotalDuration(focusStats.focusMinutes).split(" ")[0]}
                <span className="text-xs font-bold text-muted-foreground ml-1">
                  {formatTotalDuration(focusStats.focusMinutes).split(" ")[1] || "m"}
                </span>
              </h4>
            </div>

            {/* Card 3: Total Pomos */}
            <div className="bg-muted/30 border border-border/60 p-3.5 rounded-2xl transition-all hover:-translate-y-0.5 hover:bg-muted/40">
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Total Pomos</p>
              <h4 className="text-2xl font-black mt-1 leading-none">{focusStats.completedSessions}</h4>
            </div>

            {/* Card 4: Total Focus Duration */}
            <div className="bg-muted/30 border border-border/60 p-3.5 rounded-2xl transition-all hover:-translate-y-0.5 hover:bg-muted/40">
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Total Duration</p>
              <h4 className="text-2xl font-black mt-1 leading-none truncate">
                {formatTotalDuration(focusStats.focusMinutes)}
              </h4>
            </div>
          </div>
        </div>

        {/* Right Section 2: Chronicle Focus Record log */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/85 p-5.5 rounded-3xl shadow-sm flex flex-col flex-1 min-h-[300px] overflow-visible">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-4">
            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Focus Record
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowManualModal(true)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Log Focus Session"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Timeline Stream */}
          <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-6 scrollbar-thin">
            {groupedRecords.length === 0 ? (
              <div className="text-center py-10 select-none">
                <Info className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-muted-foreground">No sessions logged yet.</p>
                <p className="text-[9px] text-muted-foreground/60 mt-1">Crush your goals to start recording logs.</p>
              </div>
            ) : (
              groupedRecords.map((group) => (
                <div key={group.date} className="space-y-3.5 relative">
                  {/* Group Date Header */}
                  <div className="flex items-center gap-2 select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                      {group.date}
                    </h4>
                  </div>

                  {/* Group Sessions */}
                  <div className="pl-3.5 border-l border-border/70 ml-0.5 space-y-3.5">
                    {group.records.map((rec) => {
                      const startTimeStr = new Date(rec.startedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      const endTimeStr = rec.endedAt ? new Date(rec.endedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Ongoing"
                      const durationMins = Math.round(rec.duration / 60)
                      
                      return (
                        <div
                          key={rec.id}
                          className="group/item flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all shadow-3xs"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <CheckCircle className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${
                              rec.type === "POMODORO" ? "text-orange-500" : "text-blue-500"
                            }`} />
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-muted-foreground select-none leading-none">
                                {startTimeStr} - {endTimeStr}
                              </p>
                              <p className="text-xs font-bold text-foreground truncate mt-1 leading-tight">
                                {rec.taskTitle || "Manual Focus Session"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground">
                              {durationMins}m
                            </span>
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                              title="Delete Log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Manual Focus Record Logger Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-card border border-border/80 p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-primary" />
                Add Focus Record
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                  Goal Name / Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polish portfolio website"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border focus:outline-none bg-background font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border focus:outline-none bg-background font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={1440}
                    value={manualDuration}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-border focus:outline-none bg-background font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={manualStart}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border focus:outline-none bg-background font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={manualEnd}
                    onChange={(e) => setManualEnd(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border focus:outline-none bg-background font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 h-10 rounded-xl cursor-pointer font-bold border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 rounded-xl cursor-pointer font-bold bg-primary hover:bg-primary/95 text-white"
                >
                  Log Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
