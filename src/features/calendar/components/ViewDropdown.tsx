import React, { useRef, useEffect } from "react"
import { Check } from "lucide-react"

export type CalendarViewType =
  | "day"
  | "week"
  | "month"
  | "year"
  | "agenda"
  | "multi-day"
  | "multi-week"

interface DropdownOption {
  label: string
  value: CalendarViewType
  detail: string
  isDivider?: boolean
}

const dropdownOptions: DropdownOption[] = [
  { label: "Day", value: "day", detail: "D/1" },
  { label: "Week", value: "week", detail: "W/2" },
  { label: "Month", value: "month", detail: "M/3" },
  { label: "Year", value: "year", detail: "Y/4" },
  { label: "Agenda", value: "agenda", detail: "A/5" },
  { label: "", value: "month", detail: "", isDivider: true }, // Placeholder for divider
  { label: "Multi-Day", value: "multi-day", detail: "5 days" },
  { label: "Multi-Week", value: "multi-week", detail: "2 weeks" },
]

interface ViewDropdownProps {
  currentView: CalendarViewType
  onViewChange: (view: CalendarViewType) => void
  onClose: () => void
}

export function ViewDropdown({
  currentView,
  onViewChange,
  onClose,
}: ViewDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  return (
    <div
      ref={containerRef}
      className="absolute right-0 mt-1 w-64 bg-background border border-border/80 rounded-2xl shadow-xl z-50 p-2 py-2.5 animate-fade-in select-none text-[13px] font-medium"
      style={{
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02)",
      }}
    >
      <div className="flex flex-col gap-0.5">
        {dropdownOptions.map((option, idx) => {
          if (option.isDivider) {
            return (
              <div
                key={`divider-${idx}`}
                className="my-1.5 border-t border-border/50"
              />
            )
          }

          const isSelected = currentView === option.value
          const isStandardShortcut = ["day", "week", "month", "year", "agenda"].includes(option.value)

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onViewChange(option.value)
                onClose()
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer select-none ${
                isSelected
                  ? "bg-blue-50/60 text-blue-600 font-bold"
                  : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4.5 flex items-center justify-center shrink-0">
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-500 stroke-[2.5]" />
                  )}
                </div>
                <span className="font-semibold">{option.label}</span>
              </div>
              <span
                className={`text-[10px] font-bold ${
                  isSelected
                    ? "text-blue-500/80"
                    : isStandardShortcut
                    ? "text-muted-foreground/45"
                    : "text-muted-foreground/60"
                }`}
              >
                {option.detail}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
