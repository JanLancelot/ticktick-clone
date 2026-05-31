import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddHabitFormProps {
  onAddHabit: (name: string, color: string) => Promise<void> | void
  onCancel: () => void
}

export function AddHabitForm({ onAddHabit, onCancel }: AddHabitFormProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#10b981")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAddHabit(name, color)
    setName("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border p-5 rounded-2xl max-w-md space-y-4 animate-fade-in"
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        New Daily Habit
      </h3>

      <div className="space-y-1.5">
        <Label htmlFor="habitName">Habit Name</Label>
        <Input
          id="habitName"
          placeholder="e.g. Meditate, Read, Walk..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl h-10"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Theme Color</Label>
        <div className="flex gap-2">
          {["#ef4444", "#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                color === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl h-9 cursor-pointer"
        >
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl h-9 cursor-pointer">
          Create Habit
        </Button>
      </div>
    </form>
  )
}
