import React from "react"
import { Habit } from "../types"
import { Flame, Check } from "lucide-react"

interface HabitCardProps {
  habit: Habit
  onToggleRecord: (habitId: string, dateStr: string) => void
}

export function HabitCard({ habit, onToggleRecord }: HabitCardProps) {
  const getTodayDateString = () => new Date().toISOString().split("T")[0]

  const todayStr = getTodayDateString()
  const isDoneToday = habit.records[todayStr] || false

  // Simple last 5 days record row
  const pastDays = []
  for (let i = 4; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    pastDays.push(d)
  }

  return (
    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
          >
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold truncate max-w-[200px]">{habit.name}</h4>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
              Streak: 🔥 {habit.streak} days
            </p>
          </div>
        </div>

        {/* Quick completion toggle */}
        <button
          onClick={() => onToggleRecord(habit.id, todayStr)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            isDoneToday
              ? "bg-green-500/10 border-green-500/20 text-green-600"
              : "bg-muted/30 hover:bg-muted border-border text-muted-foreground"
          }`}
        >
          {isDoneToday ? "Done Today" : "Log Completion"}
        </button>
      </div>

      {/* Visual completion grid for past 5 days */}
      <div className="border-t border-border/60 pt-3">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          History Grid
        </p>
        <div className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl border border-border/40">
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
                <span className={`text-[9px] font-black ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {dayLabel}
                </span>
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${
                    isDayDone
                      ? "border-transparent text-white"
                      : "bg-background border-border group-hover:bg-muted"
                  }`}
                  style={{ backgroundColor: isDayDone ? habit.color : undefined }}
                >
                  {isDayDone && <Check className="h-3 w-3" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
