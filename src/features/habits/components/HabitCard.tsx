import React from "react"
import { Habit } from "../types"
import { Flame, Check, Trash2, CalendarRange, Clock, Sliders } from "lucide-react"

interface HabitCardProps {
  habit: Habit
  onToggleRecord: (habitId: string, dateStr: string) => void
  onDeleteHabit?: (habitId: string) => Promise<void> | void
  onEditHabit?: () => void
}

export function HabitCard({ habit, onToggleRecord, onDeleteHabit, onEditHabit }: HabitCardProps) {
  const getTodayDateString = () => new Date().toISOString().split("T")[0]

  const todayStr = getTodayDateString()
  const todayVal = habit.records[todayStr] || 0
  const isDoneToday = habit.goalType === "amount" ? todayVal >= (habit.goal || 1) : todayVal > 0

  // Last 5 days record row
  const pastDays = []
  for (let i = 4; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    pastDays.push(d)
  }

  const getFrequencyText = () => {
    if (habit.frequency === "DAILY") {
      if (habit.repeatDays && habit.repeatDays.length === 7) return "Everyday"
      return "Custom Days"
    }
    return habit.frequency ? habit.frequency.toLowerCase() : "Daily"
  }

  const getGoalText = () => {
    if (habit.goalType === "amount") {
      return `Target: ${habit.goal} ${habit.unit || "Count"}`
    }
    return "Achieve it all"
  }

  return (
    <div className="bg-card border border-border/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-md hover:border-border transition-all duration-300 relative group animate-fade-in">
      
      {/* Edit & Delete controls (visible on card hover) */}
      <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onEditHabit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditHabit()
            }}
            className="p-1 text-muted-foreground/60 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer transition-colors"
            title="Edit Habit Settings"
          >
            <Sliders className="h-4 w-4" />
          </button>
        )}
        {onDeleteHabit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                onDeleteHabit(habit.id)
              }
            }}
            className="p-1 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
            title="Delete Habit"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Circular icon container with custom emoji */}
          <div
            className="h-11 w-11 rounded-2xl flex items-center justify-center text-xl shadow-xs"
            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
          >
            {habit.icon ? (
              <span>{habit.icon}</span>
            ) : (
              <Flame className="h-5 w-5" style={{ fill: `${habit.color}20` }} />
            )}
          </div>
          <div className="min-w-0 pr-6">
            <h4 className="text-sm font-black truncate max-w-[160px] text-foreground/90">{habit.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5 select-none text-[9px] text-muted-foreground/80 font-extrabold uppercase tracking-wide">
              <span>Streak: 🔥 {habit.streak} days</span>
              <span>•</span>
              <span>{getFrequencyText()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Goal Days & Reminders Meta details */}
      {(habit.goalType === "amount" || habit.reminderTime) && (
        <div className="flex flex-wrap gap-2 items-center text-[10px] font-bold text-muted-foreground/80 bg-muted/20 border border-border/30 rounded-xl p-2 select-none">
          {habit.goalType === "amount" && (
            <span className="flex items-center gap-1">
              <CalendarRange className="h-3 w-3 shrink-0" />
              <span>{getGoalText()}</span>
            </span>
          )}
          {habit.goalType === "amount" && habit.reminderTime && (
            <span className="opacity-40">•</span>
          )}
          {habit.reminderTime && (
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">Alerts: {habit.reminderTime.split(",").join(", ")}</span>
            </span>
          )}
        </div>
      )}

      {/* Visual completion grid for past 5 days */}
      <div className="border-t border-border/50 pt-3">
        <p className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-widest mb-2 select-none">
          History Grid
        </p>
        <div className="flex justify-between items-center bg-muted/10 p-2.5 rounded-xl border border-border/40 select-none">
          {pastDays.map((day, idx) => {
            const dateStr = day.toISOString().split("T")[0]
            const val = habit.records[dateStr] || 0
            const goal = habit.goal || 1
            const isFullyCompleted = habit.goalType === "amount" ? val >= goal : val > 0
            const isPartiallyCompleted = habit.goalType === "amount" && val > 0 && val < goal
            const dayLabel = day.toLocaleDateString("en-US", { weekday: "narrow" })
            const isToday = dateStr === todayStr

            // Circular progress ring parameters
            const radius = 11
            const circumference = 2 * Math.PI * radius
            const percent = Math.min(1, val / goal)
            const strokeDashoffset = circumference * (1 - percent)

            return (
              <button
                key={idx}
                onClick={() => onToggleRecord(habit.id, dateStr)}
                className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
              >
                <span className={`text-[9px] font-black ${isToday ? "text-blue-600" : "text-muted-foreground/75"}`}>
                  {dayLabel}
                </span>
                <div className="relative h-7 w-7 flex items-center justify-center">
                  {/* Circular progress SVG */}
                  <svg className="absolute inset-0 h-full w-full -rotate-90 select-none pointer-events-none">
                    {/* Track circle */}
                    <circle
                      cx="14"
                      cy="14"
                      r={radius}
                      className="stroke-border/40 fill-none"
                      strokeWidth="2"
                    />
                    {/* Progress circle */}
                    {val > 0 && (
                      <circle
                        cx="14"
                        cy="14"
                        r={radius}
                        className="fill-none transition-all duration-300 ease-out"
                        stroke={habit.color || "#3b82f6"}
                        strokeWidth="2.2"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>

                  {/* Content inside the circular progress */}
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[8.5px] font-black transition-all ${
                      isFullyCompleted
                        ? "text-white scale-105"
                        : isPartiallyCompleted
                        ? "text-foreground font-black"
                        : "text-muted-foreground/20"
                    }`}
                    style={{
                      backgroundColor: isFullyCompleted ? (habit.color || undefined) : undefined,
                      color: isPartiallyCompleted ? (habit.color || undefined) : undefined,
                    }}
                  >
                    {isFullyCompleted && <Check className="h-3 w-3 stroke-[3px]" />}
                    {isPartiallyCompleted && <span>{val}</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
