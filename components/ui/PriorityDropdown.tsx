import React, { useState } from "react"
import { Flag } from "lucide-react"

export type Priority = "NONE" | "LOW" | "MEDIUM" | "HIGH"

interface PriorityDropdownProps {
  value: Priority
  onChange: (value: Priority) => void
}

const PRIORITY_OPTIONS: { value: Priority; label: string; colorClass: string }[] = [
  { value: "HIGH", label: "High", colorClass: "text-red-500 fill-current" },
  { value: "MEDIUM", label: "Medium", colorClass: "text-amber-500 fill-current" },
  { value: "LOW", label: "Low", colorClass: "text-blue-500 fill-current" },
  { value: "NONE", label: "None", colorClass: "text-gray-400" },
]

export function getPriorityColor(p: string) {
  switch (p) {
    case "HIGH":
      return "text-red-500 hover:text-red-600"
    case "MEDIUM":
      return "text-amber-500 hover:text-amber-600"
    case "LOW":
      return "text-blue-500 hover:text-blue-600"
    default:
      return "text-gray-400 hover:text-gray-500"
  }
}

export function PriorityDropdown({ value, onChange }: PriorityDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
        title="Change Priority"
      >
        <Flag className={`h-4.5 w-4.5 ${getPriorityColor(value)} ${value !== "NONE" ? "fill-current" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 flex flex-col gap-0.5 animate-fade-in select-none">
            {PRIORITY_OPTIONS.map((opt) => {
              const isSelected = value === opt.value
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-muted/70 ${
                    isSelected ? "bg-primary/5 text-primary" : "text-foreground/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Flag className={`h-4 w-4 shrink-0 ${opt.colorClass}`} />
                    <span>{opt.label}</span>
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
