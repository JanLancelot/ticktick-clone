import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PriorityDropdown, type Priority } from "@/components/ui/PriorityDropdown"
import { ListDropdown, type ListProject } from "@/components/ui/ListDropdown"
import { CalendarDropdown } from "@/components/ui/CalendarDropdown"
import { Plus, Tag, X } from "lucide-react"

interface Project {
  id: string
  name: string
  color: string
}

interface TaskAdderProps {
  projects: Project[]
  activeTab: string
  defaultDueDate?: string
  existingTags: string[]
  onAddTask: (
    title: string,
    priority: "NONE" | "LOW" | "MEDIUM" | "HIGH",
    dueDate: string,
    projectId: string,
    tag: string,
    duration: string | null
  ) => Promise<void> | void
}

export function TaskAdder({
  projects,
  activeTab,
  defaultDueDate = "",
  existingTags = [],
  onAddTask,
}: TaskAdderProps) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<Priority>("NONE")
  const [dueDate, setDueDate] = useState("")
  const [duration, setDuration] = useState<string | null>(null)
  const [projectId, setProjectId] = useState("inbox")
  const [tag, setTag] = useState("")
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [newTagInput, setNewTagInput] = useState("")

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

    await onAddTask(title, priority, dueDate, projectId, tag, duration)

    setTitle("")
    setPriority("NONE")
    setDueDate(defaultDueDate || (activeTab === "today" ? new Date().toISOString().split("T")[0] : ""))
    setTag("")
    setDuration(null)
  }

  const showProjectSelector = ["today", "upcoming", "inbox", "calendar"].includes(activeTab)

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3.5 relative"
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
          {/* Priority Dropdown */}
          <PriorityDropdown
            value={priority}
            onChange={(val) => setPriority(val)}
          />

          {/* Calendar Dropdown */}
          <CalendarDropdown
            value={dueDate || null}
            onChange={(date) => setDueDate(date || "")}
            duration={duration}
            onDurationChange={setDuration}
          />

          {/* List Dropdown */}
          {showProjectSelector && (
            <ListDropdown
              value={projectId}
              projects={projects as ListProject[]}
              onChange={(val) => setProjectId(val)}
              direction="down"
            />
          )}

          {/* Tag selector dropdown */}
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className="flex items-center gap-1.5 hover:bg-muted/80 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border border-border/40 bg-background/50 text-xs font-semibold text-foreground"
              title="Add tag"
            >
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{tag ? `#${tag}` : "Tag"}</span>
            </button>

            {tag && (
              <button
                type="button"
                onClick={() => setTag("")}
                className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors"
                title="Clear Tag"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {tagDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setTagDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto animate-fade-in select-none">
                  {/* TextInput to enter new tag */}
                  <div className="px-2 py-1.5 border-b border-border/50 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add/Search tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (newTagInput.trim()) {
                            setTag(newTagInput.trim().toLowerCase())
                            setNewTagInput("")
                            setTagDropdownOpen(false)
                          }
                        }
                      }}
                      className="w-full text-[11px] px-2 py-1 border border-border rounded-md bg-background focus:outline-none"
                      autoFocus
                    />
                    {newTagInput.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setTag(newTagInput.trim().toLowerCase())
                          setNewTagInput("")
                          setTagDropdownOpen(false)
                        }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        Add
                      </button>
                    )}
                  </div>

                  {/* List of existing tags */}
                  {existingTags.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto py-1">
                      {existingTags.map((t) => {
                        const isSelected = tag === t
                        return (
                          <button
                            type="button"
                            key={t}
                            onClick={() => {
                              setTag(isSelected ? "" : t)
                              setTagDropdownOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-muted/70 ${
                              isSelected ? "bg-primary/5 text-primary" : "text-foreground/80"
                            }`}
                          >
                            <span className="truncate">#{t}</span>
                            {isSelected && <span className="text-primary font-black">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground text-center py-3 font-semibold">
                      No tags yet
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
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
