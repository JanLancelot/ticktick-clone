import React, { useState } from "react"
import { Layers } from "lucide-react"

export interface ListSection {
  id: string
  name: string
  projectId: string
}

interface SectionDropdownProps {
  value: string | null | undefined
  sections: ListSection[]
  projectId: string | null | undefined
  onChange: (sectionId: string | null) => void
  /** 'up' opens above the button, 'down' opens below. Default: 'up' */
  direction?: "up" | "down"
}

export function SectionDropdown({
  value,
  sections,
  projectId,
  onChange,
  direction = "up"
}: SectionDropdownProps) {
  const [open, setOpen] = useState(false)

  // Filter sections belonging to this project
  const projectSecs = sections.filter(s => s.projectId === projectId)

  if (!projectId || projectId === "inbox") {
    return null
  }

  const matchedSec = projectSecs.find((s) => s.id === value)

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:bg-muted/80 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border border-border/40 bg-background/50 text-xs font-semibold text-foreground"
        title="Assign Section"
      >
        <Layers className="h-4 w-4 text-primary shrink-0 opacity-80" />
        <span className="truncate max-w-[120px]">
          {value && matchedSec ? matchedSec.name : "No Section"}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className={`absolute left-0 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto animate-fade-in select-none ${direction === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}>
            {/* No Section Option */}
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-muted/70 ${
                !value ? "bg-primary/5 text-primary" : "text-foreground/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
                <span>No Section</span>
              </div>
              {!value && <span className="text-primary font-black">✓</span>}
            </button>

            {/* Sections Options */}
            {projectSecs.map((sec) => {
              const isSelected = value === sec.id
              return (
                <button
                  type="button"
                  key={sec.id}
                  onClick={() => {
                    onChange(sec.id)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-muted/70 ${
                    isSelected ? "bg-primary/5 text-primary" : "text-foreground/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Layers className="h-4 w-4 text-primary shrink-0 opacity-85" />
                    <span className="truncate">{sec.name}</span>
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
