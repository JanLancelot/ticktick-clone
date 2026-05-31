import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

interface Project {
  id: string
  name: string
  color: string
}

interface TaskAdderProps {
  projects: Project[]
  activeTab: string
  defaultDueDate?: string
  onAddTask: (
    title: string,
    priority: "NONE" | "LOW" | "MEDIUM" | "HIGH",
    dueDate: string,
    projectId: string,
    tag: string
  ) => Promise<void> | void
}

export function TaskAdder({
  projects,
  activeTab,
  defaultDueDate = "",
  onAddTask,
}: TaskAdderProps) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<"NONE" | "LOW" | "MEDIUM" | "HIGH">("NONE")
  const [dueDate, setDueDate] = useState("")
  const [projectId, setProjectId] = useState("inbox")
  const [tag, setTag] = useState("")

  // Prepopulate due date and project based on active tab / defaults
  useEffect(() => {
    if (defaultDueDate) {
      setDueDate(defaultDueDate)
    } else if (activeTab === "today") {
      setDueDate(new Date().toISOString().split("T")[0])
    } else {
      setDueDate("")
    }

    if (!["inbox", "today", "upcoming", "habits", "focus", "calendar"].includes(activeTab)) {
      setProjectId(activeTab)
    } else {
      setProjectId("inbox")
    }
  }, [activeTab, defaultDueDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    await onAddTask(title, priority, dueDate, projectId, tag)

    setTitle("")
    setPriority("NONE")
    setDueDate(defaultDueDate || (activeTab === "today" ? new Date().toISOString().split("T")[0] : ""))
    setTag("")
  }

  const showProjectSelector = ["today", "upcoming", "inbox", "calendar"].includes(activeTab)

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3.5 relative overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <Plus className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
        <Input
          type="text"
          placeholder="Add task to this list... (Press Enter)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-9 text-sm font-medium w-full placeholder:text-muted-foreground/60 placeholder:font-semibold bg-transparent"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Select */}
          <div className="flex items-center gap-1">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-muted-foreground cursor-pointer focus:outline-none hover:bg-muted/30"
            >
              <option value="NONE">Priority: None</option>
              <option value="LOW">Priority: Low</option>
              <option value="MEDIUM">Priority: Med</option>
              <option value="HIGH">Priority: High</option>
            </select>
          </div>

          {/* Due date picker */}
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-muted-foreground cursor-pointer focus:outline-none hover:bg-muted/30"
          />

          {/* Project List Selector */}
          {showProjectSelector && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-muted-foreground cursor-pointer focus:outline-none hover:bg-muted/30"
            >
              <option value="inbox">Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Tag input */}
          <Input
            placeholder="Add tag..."
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="h-8 text-[10px] max-w-[100px] border border-border bg-background/50 px-2.5 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <Button
          type="submit"
          disabled={!title.trim()}
          className="h-8 text-xs font-bold rounded-xl px-4 cursor-pointer select-none active:scale-[0.98]"
        >
          Add Task
        </Button>
      </div>
    </form>
  )
}
