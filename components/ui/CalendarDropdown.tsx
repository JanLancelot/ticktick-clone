import React, { useState } from "react"
import {
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Sun,
  CalendarDays,
  Moon,
  Clock,
  AlarmClock,
  Repeat,
  Circle,
} from "lucide-react"

interface CalendarDropdownProps {
  /** Current due date in "YYYY-MM-DD" format, or empty string / null for unset */
  value: string | null
  onChange: (date: string | null) => void
}

export function CalendarDropdown({ value, onChange }: CalendarDropdownProps) {
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date())
  const [tempSelectedDate, setTempSelectedDate] = useState<string | null>(value || null)

  // Re-sync when opened
  const handleOpen = () => {
    setTempSelectedDate(value || null)
    setCurrentMonth(value ? new Date(value) : new Date())
    setOpen(!open)
  }

  const applyPreset = (preset: "today" | "tomorrow" | "nextWeek" | "nextMonth") => {
    const d = new Date()
    if (preset === "tomorrow") {
      d.setDate(d.getDate() + 1)
    } else if (preset === "nextWeek") {
      d.setDate(d.getDate() + 7)
    } else if (preset === "nextMonth") {
      d.setMonth(d.getMonth() + 1)
    }
    const str = d.toISOString().split("T")[0]
    setTempSelectedDate(str)
    setCurrentMonth(d)
  }

  const navigateMonth = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setCurrentMonth(new Date())
    } else {
      const newMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + (direction === "next" ? 1 : -1),
        1
      )
      setCurrentMonth(newMonth)
    }
  }

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const startDayOfWeek = firstDay.getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const prevMonthTotalDays = new Date(year, month, 0).getDate()

    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = []

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i
      const date = new Date(year, month - 1, d)
      days.push({ date, isCurrentMonth: false, key: `prev-${d}` })
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d)
      days.push({ date, isCurrentMonth: true, key: `curr-${d}` })
    }

    const remainingCells = 42 - days.length
    for (let d = 1; d <= remainingCells; d++) {
      const date = new Date(year, month + 1, d)
      days.push({ date, isCurrentMonth: false, key: `next-${d}` })
    }

    return days
  }

  const getRelativeDateString = (dateStr: string | null) => {
    if (!dateStr) return "Set Due Date"
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(dateStr)
    checkDate.setHours(0, 0, 0, 0)

    const diffTime = checkDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    const formatted = checkDate.toLocaleDateString("en-US", options)

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays === -1) return "Yesterday"
    return `${formatted}`
  }

  return (
    <div className="relative flex items-center gap-1 text-xs font-bold text-muted-foreground">
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 cursor-pointer hover:text-foreground hover:bg-muted/50 px-2 py-1.5 rounded-lg border border-border/40 bg-background/50 transition-all text-xs font-bold"
        title="Change Due Date"
      >
        <Calendar className="h-4 w-4 text-muted-foreground/80 shrink-0" />
        <span>{getRelativeDateString(value || null)}</span>
      </button>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors"
          title="Clear Due Date"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 animate-fade-in flex flex-col">
            {/* Date / Duration Tabs */}
            <div className="bg-muted/50 p-1 rounded-xl flex gap-1 select-none mb-4 text-[11px] font-extrabold text-muted-foreground">
              <button
                type="button"
                className="flex-1 py-1.5 rounded-lg bg-card text-foreground shadow-xs cursor-pointer text-center font-black"
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => alert("Duration planning is a premium feature.")}
                className="flex-1 py-1.5 rounded-lg hover:bg-muted cursor-pointer text-center text-muted-foreground/75 font-black transition-colors"
              >
                Duration
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-around border-b border-border/40 pb-3 mb-4 select-none">
              <button
                type="button"
                onClick={() => applyPreset("today")}
                className="p-2 text-muted-foreground hover:bg-primary/5 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 group"
                title="Today"
              >
                <Sun className="h-5 w-5 text-amber-500 fill-amber-500/20 group-hover:scale-110 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => applyPreset("tomorrow")}
                className="p-2 text-muted-foreground hover:bg-primary/5 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 group"
                title="Tomorrow"
              >
                <Sunrise className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => applyPreset("nextWeek")}
                className="p-2 text-muted-foreground hover:bg-primary/5 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 group"
                title="Next Week"
              >
                <CalendarDays className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => applyPreset("nextMonth")}
                className="p-2 text-muted-foreground hover:bg-primary/5 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 group"
                title="Next Month / Someday"
              >
                <Moon className="h-5 w-5 text-purple-500 fill-purple-500/10 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between px-2 mb-4 select-none">
              <span className="font-extrabold text-foreground text-sm">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateMonth("prev")}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md cursor-pointer transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateMonth("today")}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md cursor-pointer transition-colors"
                  title="Reset to Today"
                >
                  <Circle className="h-2 w-2 fill-muted-foreground/30 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateMonth("next")}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md cursor-pointer transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                <span key={idx}>{d}</span>
              ))}
            </div>

            {/* Days grid cells */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs mb-4">
              {getCalendarDays().map((cell) => {
                const dateStr = cell.date.toISOString().split("T")[0]
                const isSelected = tempSelectedDate === dateStr
                const isToday = new Date().toISOString().split("T")[0] === dateStr
                return (
                  <button
                    type="button"
                    key={cell.key}
                    onClick={() => setTempSelectedDate(dateStr)}
                    className="flex items-center justify-center p-0.5 cursor-pointer relative"
                  >
                    <span
                      className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/20 scale-105"
                          : isToday
                          ? "border border-blue-500 text-blue-600 font-extrabold"
                          : cell.isCurrentMonth
                          ? "text-foreground font-bold hover:bg-muted"
                          : "text-muted-foreground/35 font-semibold hover:bg-muted/30"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Options list rows */}
            <div className="border-t border-border/40 py-2 mb-4 space-y-1 select-none">
              {[
                { label: "Time", icon: Clock, color: "text-blue-500" },
                { label: "Reminder", icon: AlarmClock, color: "text-amber-500" },
                { label: "Repeat", icon: Repeat, color: "text-indigo-500" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => alert(`${item.label} setting is a premium feature.`)}
                  className="w-full flex items-center justify-between py-2 px-2 hover:bg-muted/60 rounded-xl cursor-pointer text-xs font-bold text-muted-foreground/90 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </button>
              ))}
            </div>

            {/* Dropdown footer action buttons */}
            <div className="flex gap-3 mt-1 select-none border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={() => {
                  onChange(tempSelectedDate || null)
                  setOpen(false)
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer text-center shadow-md shadow-blue-500/15 transition-colors"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempSelectedDate(null)
                  onChange(null)
                  setOpen(false)
                }}
                className="flex-1 py-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-black rounded-xl cursor-pointer text-center transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
