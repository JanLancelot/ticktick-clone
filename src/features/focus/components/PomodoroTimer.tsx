import React from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Timer } from "lucide-react"

interface Task {
  id: string
  title: string
  completed: boolean
}

interface PomodoroTimerProps {
  timerActive: boolean
  timerMode: "focus" | "shortBreak" | "longBreak"
  timeLeft: number
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  tasks: Task[]
  onReset: () => void
  onToggle: () => void
  onSetMode: (mode: "focus" | "shortBreak" | "longBreak") => void
  formatTime: (seconds: number) => string
}

export function PomodoroTimer({
  timerActive,
  timerMode,
  timeLeft,
  selectedTaskId,
  setSelectedTaskId,
  tasks,
  onReset,
  onToggle,
  onSetMode,
  formatTime,
}: PomodoroTimerProps) {
  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  return (
    <div className="max-w-md mx-auto space-y-6 text-center py-6 animate-fade-in duration-300">
      {/* Mode Presets Tabs */}
      <div className="flex bg-muted/50 border border-border p-1 rounded-2xl max-w-xs mx-auto">
        <button
          onClick={() => onSetMode("focus")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            timerMode === "focus"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Focus (25m)
        </button>
        <button
          onClick={() => onSetMode("shortBreak")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            timerMode === "shortBreak"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Break (5m)
        </button>
      </div>

      {/* Clock Graphic */}
      <div className="relative h-64 w-64 rounded-full mx-auto bg-card border-4 border-border flex flex-col items-center justify-center shadow-lg relative select-none">
        {/* Glow Ring */}
        <div
          className={`absolute inset-0 rounded-full border-4 border-dashed animate-pulse pointer-events-none opacity-40 ${
            timerActive ? "border-orange-500" : "border-muted"
          }`}
        />

        {/* Circular Progress Bar */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="124"
            cy="124"
            r="118"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/10"
          />
          <circle
            cx="124"
            cy="124"
            r="118"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="5.5"
            className="text-orange-500 transition-all duration-1000"
            strokeDasharray={2 * Math.PI * 118}
            strokeDashoffset={
              timerMode === "focus"
                ? 2 * Math.PI * 118 * (1 - timeLeft / (25 * 60))
                : 2 * Math.PI * 118 * (1 - timeLeft / (5 * 60))
            }
          />
        </svg>

        <div className="space-y-1.5 z-10">
          <h2 className="text-5xl font-black font-mono tracking-wider">{formatTime(timeLeft)}</h2>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">
            {timerActive ? "Drown the noise" : "Prepare your mind"}
          </p>
        </div>
      </div>

      {/* Selected Task Context */}
      <div className="bg-card border border-border p-4 rounded-2xl max-w-sm mx-auto shadow-2xs">
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1.5">
          Active Focus Goal
        </p>
        {selectedTaskId && selectedTask ? (
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold truncate max-w-[220px]">
              {selectedTask.title}
            </span>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="text-[10px] text-destructive hover:underline font-bold"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground">Select a task below to focus on:</p>
            <select
              onChange={(e) => setSelectedTaskId(e.target.value || null)}
              className="w-full h-9 rounded-xl border border-border text-xs px-3 bg-background focus:outline-none"
              value={selectedTaskId || ""}
            >
              <option value="">No specific task</option>
              {tasks
                .filter((t) => !t.completed)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Clock Controls */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <Button
          onClick={onReset}
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full cursor-pointer border-border hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4.5 w-4.5" />
        </Button>
        <Button
          onClick={onToggle}
          className={`h-14 w-14 rounded-full shadow-md font-bold text-white transition-transform active:scale-[0.98] cursor-pointer ${
            timerActive ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {timerActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>
      </div>
    </div>
  )
}
