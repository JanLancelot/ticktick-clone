import React from "react"
import { Habit } from "../types"
import { HabitCard } from "./HabitCard"
import { AddHabitForm } from "./AddHabitForm"
import { Button } from "@/components/ui/button"
import { Plus, Flame } from "lucide-react"

interface HabitsViewProps {
  habits: Habit[]
  showAddHabit: boolean
  setShowAddHabit: (show: boolean) => void
  onAddHabit: (name: string, color: string) => Promise<void> | void
  onToggleRecord: (habitId: string, dateStr: string) => void
}

export function HabitsView({
  habits,
  showAddHabit,
  setShowAddHabit,
  onAddHabit,
  onToggleRecord,
}: HabitsViewProps) {
  return (
    <div className="space-y-6 animate-fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Your Habits
        </h2>
        <Button
          onClick={() => setShowAddHabit(!showAddHabit)}
          className="h-8 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Habit
        </Button>
      </div>

      {/* Add Habit Form */}
      {showAddHabit && (
        <AddHabitForm
          onAddHabit={(name, color) => {
            onAddHabit(name, color)
            setShowAddHabit(false)
          }}
          onCancel={() => setShowAddHabit(false)}
        />
      )}

      {/* Habit Cards Grid */}
      {habits.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl">
          <Flame className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold text-muted-foreground">No habits created yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Consistency is key. Create your first habit!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onToggleRecord={onToggleRecord} />
          ))}
        </div>
      )}
    </div>
  )
}
