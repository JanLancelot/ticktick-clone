import React from "react"
import { Habit } from "../types"
import { Flame, Check, Trash2, CalendarRange, Clock } from "lucide-react"

interface HabitCardProps {
  habit: Habit
  onToggleRecord: (habitId: string, dateStr: string) => void
  onDeleteHabit?: (habitId: string) => Promise<void> | void
}

export function HabitCard({ habit, onToggleRecord, onDeleteHabit }: HabitCardProps) {
  const getTodayDateString = () => new Date().toISOString().split("T")[0]

  const todayStr = getTodayDateString()
  const isDoneToday = habit.records[todayStr] || false

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
      
      {/* Delete button (visible on hover) */}
      {onDeleteHabit && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
              onDeleteHabit(habit.id)
            }
          }}
          className="absolute right-3.5 top-3.5 p-1 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all opacity-0 group-hover:opacity-100"
          title="Delete Habit"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

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

        {/* Quick completion toggle */}
        <button
          onClick={() => onToggleRecord(habit.id, todayStr)}
          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer select-none active:scale-95 ${
            isDoneToday
              ? "bg-green-500/10 border-green-500/20 text-green-600 shadow-2xs font-extrabold"
              : "bg-muted/40 hover:bg-muted border-border/80 text-muted-foreground hover:text-foreground"
          }`}
        >
          {isDoneToday ? "Done Today" : "Log Completion"}
        </button>
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
            const isDayDone = habit.records[dateStr] || false
            const dayLabel = day.toLocaleDateString("en-US", { weekday: "narrow" })
            const isToday = dateStr === todayStr

            return (
              <button
                key={idx}
                onClick={() => onToggleRecord(habit.id, dateStr)}
                className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
              >
                <span className={`text-[9px] font-black ${isToday ? "text-blue-600" : "text-muted-foreground/75"}`}>
                  {dayLabel}
                </span>
                <div
                  className={`h-6.5 w-6.5 rounded-full flex items-center justify-center border transition-all ${
                    isDayDone
                      ? "border-transparent text-white scale-105 shadow-xs"
                      : "bg-background border-border/80 group-hover:bg-muted"
                  }`}
                  style={{ backgroundColor: isDayDone ? habit.color : undefined }}
                >
                  {isDayDone && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
