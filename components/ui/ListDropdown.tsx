import React, { useState } from "react"
import { Inbox } from "lucide-react"

export interface ListProject {
  id: string
  name: string
  color: string
}

interface ListDropdownProps {
  value: string
  projects: ListProject[]
  onChange: (projectId: string) => void
}

export function ListDropdown({ value, projects, onChange }: ListDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:bg-muted/80 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border border-border/40 bg-background/50 text-xs font-semibold text-foreground"
        title="Move to List"
      >
        {value === "inbox" ? (
          <Inbox className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: projects.find((p) => p.id === value)?.color || "#ccc" }}
          />
        )}
        <span className="truncate max-w-[120px]">
          {value === "inbox" ? "Inbox" : projects.find((p) => p.id === value)?.name || "Inbox"}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto animate-fade-in select-none">
            {/* Inbox Option */}
            <button
              onClick={() => {
                onChange("inbox")
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-muted/70 ${
                value === "inbox" ? "bg-primary/5 text-primary" : "text-foreground/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="h-4 w-4 text-primary shrink-0" />
                <span>Inbox</span>
              </div>
              {value === "inbox" && <span className="text-primary font-black">✓</span>}
            </button>

            {/* Projects Options */}
            {projects.map((proj) => {
              const isSelected = value === proj.id
              return (
                <button
                  key={proj.id}
                  onClick={() => {
                    onChange(proj.id)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-muted/70 ${
                    isSelected ? "bg-primary/5 text-primary" : "text-foreground/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </div>
                  {isSelected && <span className="text-primary font-black">✓</span>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
