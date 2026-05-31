import React, { useState } from "react"
import { Inbox } from "lucide-react"

export interface ListProject {
  id: string
  name: string
  color: string
  icon?: string | null
}

interface ListDropdownProps {
  value: string
  projects: ListProject[]
  onChange: (projectId: string) => void
  /** 'up' opens above the button, 'down' opens below. Default: 'up' */
  direction?: "up" | "down"
}

export function ListDropdown({ value, projects, onChange, direction = "up" }: ListDropdownProps) {
  const [open, setOpen] = useState(false)

  const matchedProj = projects.find((p) => p.id === value)

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:bg-muted/80 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border border-border/40 bg-background/50 text-xs font-semibold text-foreground"
        title="Move to List"
      >
        {value === "inbox" ? (
          <Inbox className="h-4 w-4 text-primary shrink-0" />
        ) : matchedProj?.icon ? (
          <span className="text-xs shrink-0 select-none">{matchedProj.icon}</span>
        ) : (
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: matchedProj?.color || "#ccc" }}
          />
        )}
        <span className="truncate max-w-[120px]">
          {value === "inbox" ? "Inbox" : matchedProj?.name || "Inbox"}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className={`absolute left-0 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto animate-fade-in select-none ${direction === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}>
            {/* Inbox Option */}
            <button
              type="button"
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
                  type="button"
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
                    {proj.icon ? (
                      <span className="text-xs shrink-0 select-none">{proj.icon}</span>
                    ) : (
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color }}
                      />
                    )}
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
