import React from "react"
import { Habit } from "../types"
import { HabitCard } from "./HabitCard"
import { CreateHabitModal } from "./CreateHabitModal"
import { Button } from "@/components/ui/button"
import { Plus, Flame, Sunrise, Sun, Moon, CalendarRange } from "lucide-react"

interface HabitsViewProps {
  habits: Habit[]
  showAddHabit: boolean
  setShowAddHabit: (show: boolean) => void
  onAddHabit: (
    name: string,
    color: string,
    icon?: string | null,
    frequency?: "DAILY" | "WEEKLY" | "MONTHLY",
    repeatDays?: number[],
    goal?: number,
    unit?: string | null,
    reminderTime?: string | null,
    startDate?: string | null,
    goalDays?: string | null,
    section?: string | null,
    goalType?: string | null,
    checkingMode?: string | null,
    recordCount?: number | null,
    frequencyType?: string | null,
    frequencyValue?: number | null
  ) => Promise<void> | void
  onToggleRecord: (habitId: string, dateStr: string) => void
  onDeleteHabit?: (habitId: string) => Promise<void> | void
}

export function HabitsView({
  habits,
  showAddHabit,
  setShowAddHabit,
  onAddHabit,
  onToggleRecord,
  onDeleteHabit,
}: HabitsViewProps) {
  // Extract all unique sections from habits or use defaults
  const existingSections = Array.from(new Set(habits.map((h) => h.section || "Others")))
  
  // Group habits by section
  const groupedHabits: Record<string, Habit[]> = {}
  habits.forEach((habit) => {
    const sec = habit.section || "Others"
    if (!groupedHabits[sec]) {
      groupedHabits[sec] = []
    }
    groupedHabits[sec].push(habit)
  })

  // Helper to render section headers with nice icons
  const getSectionIcon = (secName: string) => {
    const lower = secName.toLowerCase()
    if (lower.includes("morning") || lower.includes("sunrise")) {
      return <Sunrise className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10" />
    }
    if (lower.includes("afternoon") || lower.includes("day") || lower.includes("lunch")) {
      return <Sun className="h-4.5 w-4.5 text-orange-500 fill-orange-500/10" />
    }
    if (lower.includes("night") || lower.includes("evening") || lower.includes("sleep")) {
      return <Moon className="h-4.5 w-4.5 text-indigo-500 fill-indigo-500/10" />
    }
    return <CalendarRange className="h-4.5 w-4.5 text-muted-foreground/80" />
  }

  // Pre-sort sections so Morning -> Afternoon -> Night -> Others -> Custom sections
  const sectionOrder = ["morning", "afternoon", "night", "others"]
  const sortedSections = Object.keys(groupedHabits).sort((a, b) => {
    const aIdx = sectionOrder.indexOf(a.toLowerCase())
    const bIdx = sectionOrder.indexOf(b.toLowerCase())
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-8 animate-fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Your Habits
        </h2>
        <Button
          onClick={() => setShowAddHabit(true)}
          className="h-8.5 px-4 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] transition-all bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" /> Add Habit
        </Button>
      </div>

      {/* Create Habit Modal Popup */}
      {showAddHabit && (
        <CreateHabitModal
          onAddHabit={async (...args) => {
            await onAddHabit(...args)
            setShowAddHabit(false)
          }}
          onCancel={() => setShowAddHabit(false)}
          existingSections={existingSections}
        />
      )}

      {/* Habits grouped by section */}
      {habits.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl p-6 shadow-inner select-none animate-fade-in">
          <Flame className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
          <p className="text-sm font-bold text-muted-foreground">No habits created yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto leading-relaxed">
            Consistent small actions create massive long-term habits. Let's create your first goal!
          </p>
        </div>
      ) : (
        <div className="space-y-8 select-none">
          {sortedSections.map((secName) => {
            const secHabits = groupedHabits[secName]
            if (secHabits.length === 0) return null

            return (
              <div key={secName} className="space-y-3.5 animate-fade-in">
                <div className="flex items-center gap-2 px-1">
                  {getSectionIcon(secName)}
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground/80">
                    {secName}
                  </h3>
                  <span className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full font-black border border-border/30">
                    {secHabits.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {secHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onToggleRecord={onToggleRecord}
                      onDeleteHabit={onDeleteHabit}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
