import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddProjectFormProps {
  onAddProject: (name: string) => Promise<void> | void
  onCancel: () => void
}

export function AddProjectForm({ onAddProject, onCancel }: AddProjectFormProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAddProject(name)
    setName("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-4 p-2 border border-border/80 bg-muted/20 rounded-xl space-y-2 animate-fade-in duration-200"
    >
      <Input
        type="text"
        placeholder="List name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 text-xs px-2.5 rounded-lg"
        autoFocus
      />
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="h-7 text-[10px] px-2.5 rounded-lg border border-border bg-background hover:bg-muted cursor-pointer font-bold text-muted-foreground"
        >
          Cancel
        </button>
        <Button
          type="submit"
          className="h-7 text-[10px] px-2.5 rounded-lg cursor-pointer"
        >
          Save
        </Button>
      </div>
    </form>
  )
}
