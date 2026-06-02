import React, { useState, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  ChevronDown,
  Calendar,
  Clock,
  Check,
  Grid,
  ListTodo,
  Sun,
  LayoutGrid,
} from "lucide-react"
import { ViewDropdown, CalendarViewType } from "./ViewDropdown"

interface Task {
  id: string
  title: string
  completed: boolean
  priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null
  duration?: string | null
}

interface CalendarViewProps {
  tasks: Task[]
  calendarDate: Date
  setCalendarDate: (date: Date) => void
  onToggleTaskCompletion: (id: string) => void
  onQuickAddTask: (dateStr: string) => void
}

export function CalendarView({
  tasks,
  calendarDate,
  setCalendarDate,
  onToggleTaskCompletion,
  onQuickAddTask,
}: CalendarViewProps) {
  const [viewMode, setViewModeState] = useState<CalendarViewType>("month")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const savedView = localStorage.getItem("zoc_calendar_view_mode") as CalendarViewType
    if (savedView) {
      setViewModeState(savedView)
    }
  }, [])

  const setViewMode = (mode: CalendarViewType) => {
    setViewModeState(mode)
    localStorage.setItem("zoc_calendar_view_mode", mode)
  }

  // Keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return
      }

      const key = e.key.toLowerCase()
      if (key === "d" || key === "1") setViewMode("day")
      else if (key === "w" || key === "2") setViewMode("week")
      else if (key === "m" || key === "3") setViewMode("month")
      else if (key === "y" || key === "4") setViewMode("year")
      else if (key === "a" || key === "5") setViewMode("agenda")
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return "border-l-4 border-red-500 bg-red-50/40 text-red-700 hover:bg-red-50/60"
      case "MEDIUM":
        return "border-l-4 border-orange-500 bg-orange-50/40 text-orange-700 hover:bg-orange-50/60"
      case "LOW":
        return "border-l-4 border-blue-500 bg-blue-50/40 text-blue-700 hover:bg-blue-50/60"
      default:
        return "border-l-4 border-zinc-300 bg-zinc-50/40 text-zinc-700 hover:bg-zinc-50/60"
    }
  }

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-700 border-red-200"
      case "MEDIUM":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "LOW":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200"
    }
  }

  const formatDuration12h = (durationStr?: string | null): string => {
    if (!durationStr) return ""
    try {
      const [start, end] = durationStr.split("-")
      const [sH, sM] = start.split(":").map(Number)
      const [eH, eM] = end.split(":").map(Number)

      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? "PM" : "AM"
        let h12 = h % 12
        if (h12 === 0) h12 = 12
        return `${h12}:${String(m).padStart(2, "0")} ${period}`
      }

      return `${formatTime(sH, sM)} - ${formatTime(eH, eM)}`
    } catch {
      return durationStr
    }
  }

  const getShortDuration = (durationStr?: string | null): string => {
    if (!durationStr) return ""
    try {
      const [start] = durationStr.split("-")
      const [sH, sM] = start.split(":").map(Number)
      const period = sH >= 12 ? "PM" : "AM"
      let h12 = sH % 12
      if (h12 === 0) h12 = 12
      return `${h12}:${String(sM).padStart(2, "0")} ${period}`
    } catch {
      return durationStr || ""
    }
  }

  const getHeaderTitle = () => {
    switch (viewMode) {
      case "day":
        return calendarDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      case "week": {
        const start = new Date(calendarDate)
        start.setDate(start.getDate() - start.getDay())
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        
        const startMonth = start.toLocaleDateString("en-US", { month: "short" })
        const endMonth = end.toLocaleDateString("en-US", { month: "short" })
        const startYear = start.getFullYear()
        const endYear = end.getFullYear()
        
        if (startYear !== endYear) {
          return `${startMonth} ${start.getDate()}, ${startYear} - ${endMonth} ${end.getDate()}, ${endYear}`
        }
        if (startMonth !== endMonth) {
          return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${startYear}`
        }
        return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${startYear}`
      }
      case "multi-day": {
        const end = new Date(calendarDate)
        end.setDate(end.getDate() + 4)
        const startMonth = calendarDate.toLocaleDateString("en-US", { month: "short" })
        const endMonth = end.toLocaleDateString("en-US", { month: "short" })
        
        if (calendarDate.getFullYear() !== end.getFullYear()) {
          return `${startMonth} ${calendarDate.getDate()}, ${calendarDate.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
        }
        if (startMonth !== endMonth) {
          return `${startMonth} ${calendarDate.getDate()} - ${endMonth} ${end.getDate()}, ${calendarDate.getFullYear()}`
        }
        return `${startMonth} ${calendarDate.getDate()} - ${end.getDate()}, ${calendarDate.getFullYear()}`
      }
      case "multi-week": {
        const start = new Date(calendarDate)
        start.setDate(start.getDate() - start.getDay())
        const end = new Date(start)
        end.setDate(end.getDate() + 13)
        const startMonth = start.toLocaleDateString("en-US", { month: "short" })
        const endMonth = end.toLocaleDateString("en-US", { month: "short" })
        
        if (start.getFullYear() !== end.getFullYear()) {
          return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
        }
        if (startMonth !== endMonth) {
          return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`
        }
        return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
      }
      case "month":
        return calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      case "year":
        return `${calendarDate.getFullYear()}`
      case "agenda":
        return "Agenda"
    }
  }

  const handleNavigate = (direction: "prev" | "next") => {
    const amount = direction === "next" ? 1 : -1
    const newDate = new Date(calendarDate)

    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() + amount)
        break
      case "week":
        newDate.setDate(newDate.getDate() + amount * 7)
        break
      case "multi-day":
        newDate.setDate(newDate.getDate() + amount * 5)
        break
      case "multi-week":
        newDate.setDate(newDate.getDate() + amount * 14)
        break
      case "month":
        newDate.setMonth(newDate.getMonth() + amount)
        break
      case "year":
        newDate.setFullYear(newDate.getFullYear() + amount)
        break
      case "agenda":
        newDate.setMonth(newDate.getMonth() + amount)
        break
    }
    setCalendarDate(newDate)
  }

  const getViewLabel = () => {
    switch (viewMode) {
      case "day":
        return "Day"
      case "week":
        return "Week"
      case "month":
        return "Month"
      case "year":
        return "Year"
      case "agenda":
        return "Agenda"
      case "multi-day":
        return "Multi-Day"
      case "multi-week":
        return "Multi-Week"
    }
  }

  /* ----------------------------------------------------
     VIEW RENDERERS
     ---------------------------------------------------- */

  // 1. MONTH VIEW
  const renderMonthView = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const prevTotalDays = new Date(year, month, 0).getDate()

    const cells = []

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevTotalDays - i
      const prevDate = new Date(year, month - 1, dayNum)
      const dateStr = prevDate.toISOString().split("T")[0]
      cells.push({
        dayNum,
        isCurrentMonth: false,
        date: prevDate,
        dateStr,
        dayTasks: tasks.filter((t) => t.dueDate === dateStr),
      })
    }

    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i)
      const dateStr = currDate.toISOString().split("T")[0]
      cells.push({
        dayNum: i,
        isCurrentMonth: true,
        date: currDate,
        dateStr,
        dayTasks: tasks.filter((t) => t.dueDate === dateStr),
      })
    }

    const totalCells = cells.length
    const remainingCells = 42 - totalCells
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i)
      const dateStr = nextDate.toISOString().split("T")[0]
      cells.push({
        dayNum: i,
        isCurrentMonth: false,
        date: nextDate,
        dateStr,
        dayTasks: tasks.filter((t) => t.dueDate === dateStr),
      })
    }

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground select-none">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 bg-muted/20 border border-border/40 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, idx) => {
            const isToday = cell.date.toDateString() === new Date().toDateString()
            return (
              <div
                key={idx}
                className={`min-h-[100px] md:min-h-[120px] p-2 bg-card border rounded-2xl flex flex-col justify-between group hover:border-primary/45 hover:shadow-xs transition-all relative overflow-hidden ${
                  cell.isCurrentMonth ? "border-border" : "border-border/40 opacity-40 bg-muted/5"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-xs font-black h-6 w-6 rounded-full flex items-center justify-center cursor-pointer ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 scale-105"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      setCalendarDate(cell.date)
                      setViewMode("day")
                    }}
                  >
                    {cell.dayNum}
                  </span>

                  <button
                    onClick={() => onQuickAddTask(cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                    title="Add task for this day"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 mt-2 max-h-[60px] md:max-h-[80px] scrollbar-thin select-none">
                  {cell.dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTaskCompletion(task.id)
                      }}
                      title={task.title + (task.duration ? ` (${formatDuration12h(task.duration)})` : "")}
                      className={`text-[9px] font-bold p-1 px-1.5 rounded-lg border truncate cursor-pointer hover:scale-[1.02] transition-transform select-none flex items-center gap-1 ${
                        task.completed
                          ? "bg-muted/30 border-border/40 text-muted-foreground/60 line-through"
                          : getPriorityColor(task.priority)
                      }`}
                    >
                      <span>{task.completed ? "✓" : "•"}</span>
                      {task.duration && (
                        <span className="text-[7.5px] font-black opacity-75 shrink-0 bg-white/60 px-0.5 rounded">
                          {getShortDuration(task.duration)}
                        </span>
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 2. DAY VIEW (Hourly grid timeline with vertical stretching tasks)
  const renderDayView = () => {
    const dateStr = calendarDate.toISOString().split("T")[0]
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr)

    const allDayTasks = dayTasks.filter((t) => !t.duration)
    const timedTasks = dayTasks.filter((t) => t.duration)

    const startHour = 7 // Timeline starts at 7:00 AM
    const endHour = 21 // Timeline ends at 9:00 PM
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
    const hourHeight = 60 // 60px height per hour block (1px = 1 minute)

    // Position overlapping timed tasks on the layout
    const buildTimelineLayout = () => {
      const parsed = timedTasks.map((t) => {
        try {
          const [startStr, endStr] = t.duration!.split("-")
          const [sH, sM] = startStr.split(":").map(Number)
          const [eH, eM] = endStr.split(":").map(Number)
          
          const startMin = sH * 60 + sM
          const endMin = eH * 60 + eM
          
          const top = Math.max(0, (startMin - startHour * 60))
          const height = Math.max(45, endMin - startMin) // Ensure a minimum height of 45px so title and duration are legible
          
          return {
            task: t,
            top,
            height,
            startMin,
            endMin,
            column: 0,
            totalColumns: 1
          }
        } catch {
          return null
        }
      }).filter((x): x is NonNullable<typeof x> => x !== null)

      // Sort by start time first, then by duration
      parsed.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin))

      // Column placement algorithm
      const columns: typeof parsed[] = []
      parsed.forEach((item) => {
        let placed = false
        for (let c = 0; c < columns.length; c++) {
          const hasOverlap = columns[c].some(
            (existing) => item.startMin < existing.endMin && item.endMin > existing.startMin
          )
          if (!hasOverlap) {
            columns[c].push(item)
            item.column = c
            placed = true
            break
          }
        }
        if (!placed) {
          columns.push([item])
          item.column = columns.length - 1
        }
      })

      // Sync overlapping task clusters to calculate correct width splits
      parsed.forEach((item) => {
        const overlapping = parsed.filter(
          (other) => item.startMin < other.endMin && item.endMin > other.startMin
        )
        const maxCol = Math.max(...overlapping.map(o => o.column))
        overlapping.forEach(o => {
          o.totalColumns = Math.max(o.totalColumns, maxCol + 1)
        })
      })

      return parsed
    }

    const positionedTasks = buildTimelineLayout()

    return (
      <div className="space-y-6 animate-fade-in select-none">
        {/* Anytime / All-Day Tasks section */}
        <div className="bg-muted/20 border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-border/30 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" /> Anytime / All-Day
            </h3>
            <button
              onClick={() => onQuickAddTask(dateStr)}
              className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 hover:scale-102 transition-transform cursor-pointer"
            >
              <Plus className="h-3 w-3" /> Quick Add
            </button>
          </div>

          {allDayTasks.length === 0 ? (
            <p className="text-[11px] font-semibold text-muted-foreground/60 italic py-2 pl-1">
              No anytime tasks scheduled.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allDayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTaskCompletion(task.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between hover:scale-[1.01] transition-all cursor-pointer ${
                    task.completed
                      ? "bg-muted/30 border-border/40 text-muted-foreground/50 line-through"
                      : getPriorityColor(task.priority)
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-muted-foreground/35 hover:border-blue-500 bg-white"
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <span className="text-xs font-bold truncate">{task.title}</span>
                  </div>
                  {task.priority && task.priority !== "NONE" && (
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 ${getPriorityBadgeColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timed schedule vertical grid */}
        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-3 mb-2">
            <Clock className="h-4 w-4 text-blue-500" /> Timeline Schedule
          </h3>

          <div className="relative flex select-none pl-4">
            {/* Timeline vertical bullet line */}
            <div className="absolute left-[7px] top-2.5 bottom-2 w-[1.5px] bg-border/60" />

            <div className="w-full pl-6 flex flex-col relative" style={{ height: `${hours.length * hourHeight}px` }}>
              {/* Hour rows and markers */}
              {hours.map((hour) => {
                const displayHour = hour === 12 ? "12:00 PM" : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`
                const isCurrentHour = new Date().getHours() === hour && calendarDate.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={hour}
                    style={{ height: `${hourHeight}px` }}
                    className="relative flex items-start group"
                  >
                    {/* Timeline bullet dot */}
                    <div
                      className={`absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background transition-all ${
                        isCurrentHour
                          ? "bg-blue-600 scale-120 ring-4 ring-blue-500/10"
                          : "bg-border/80 group-hover:bg-blue-400"
                      }`}
                    />

                    {/* Hour text label */}
                    <span
                      className={`text-[9.5px] font-extrabold w-20 shrink-0 select-none leading-none pt-1 transition-colors ${
                        isCurrentHour ? "text-blue-600 font-black" : "text-muted-foreground/60 group-hover:text-foreground"
                      }`}
                    >
                      {displayHour}
                    </span>

                    {/* Timeline horizontal dashed grid lines */}
                    <div className="flex-1 border-t border-dashed border-border/30 mt-2.5 ml-4" />
                  </div>
                )
              })}

              {/* Absolute Overlay Stretching Task Cards Container */}
              <div
                className="absolute right-0 top-0 left-28 select-none"
                style={{ height: `${hours.length * hourHeight}px` }}
              >
                {positionedTasks.map(({ task, top, height, column, totalColumns }) => {
                  const gap = 6
                  const width = `calc(${100 / totalColumns}% - ${gap}px)`
                  const left = `calc(${column * (100 / totalColumns)}% + ${gap / 2}px)`
                  const isCompleted = task.completed

                  return (
                    <div
                      key={task.id}
                      onClick={() => onToggleTaskCompletion(task.id)}
                      style={{
                        top: `${top}px`,
                        height: `${height - 3}px`,
                        left: left,
                        width: width,
                      }}
                      className="absolute transition-all duration-200 select-none cursor-pointer group"
                    >
                      <div
                        className={`h-full w-full rounded-2xl border flex flex-col justify-between p-3.5 hover:shadow-lg hover:scale-[1.005] transition-all overflow-hidden ${
                          isCompleted
                            ? "bg-zinc-50 border-zinc-200 text-zinc-400 line-through"
                            : getPriorityColor(task.priority)
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 min-w-0 h-full">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span
                              className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isCompleted
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-muted-foreground/35 hover:border-blue-500 bg-white"
                              }`}
                            >
                              {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </span>
                            
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className={`text-[12px] font-bold leading-tight truncate ${isCompleted ? 'text-zinc-400' : 'text-zinc-700'}`}>
                                {task.title}
                              </span>
                              <span className="text-[9.5px] font-black text-muted-foreground/75 flex items-center gap-1 mt-0.5">
                                ⏱️ {formatDuration12h(task.duration)}
                              </span>
                            </div>
                          </div>

                          {task.priority && task.priority !== "NONE" && (
                            <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${getPriorityBadgeColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 3. WEEK VIEW
  const renderWeekView = () => {
    const start = new Date(calendarDate)
    start.setDate(start.getDate() - start.getDay())

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr)

      const sortedTasks = [...dayTasks].sort((a, b) => {
        if (a.duration && !b.duration) return -1
        if (!a.duration && b.duration) return 1
        if (a.duration && b.duration) return a.duration.localeCompare(b.duration)
        return 0
      })

      return {
        date: d,
        dateStr,
        tasks: sortedTasks,
      }
    })

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 select-none animate-fade-in">
        {days.map((day, idx) => {
          const isToday = day.date.toDateString() === new Date().toDateString()
          const dayName = day.date.toLocaleDateString("en-US", { weekday: "short" })

          return (
            <div
              key={idx}
              className={`flex flex-col min-h-[350px] p-2 bg-card border rounded-2xl hover:border-primary/30 transition-all ${
                isToday ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md shadow-blue-500/5 bg-blue-50/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3 px-1 select-none">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                    {dayName}
                  </span>
                  <span
                    className={`text-sm font-black mt-0.5 h-6.5 w-6.5 rounded-full flex items-center justify-center cursor-pointer ${
                      isToday ? "bg-blue-600 text-white font-black" : "text-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      setCalendarDate(day.date)
                      setViewMode("day")
                    }}
                  >
                    {day.date.getDate()}
                  </span>
                </div>

                <button
                  onClick={() => onQuickAddTask(day.dateStr)}
                  className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"
                  title={`Add task for ${dayName}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[320px] scrollbar-none pb-2 select-none">
                {day.tasks.length === 0 ? (
                  <div className="text-[9px] font-semibold text-muted-foreground/35 italic text-center py-8">
                    Empty
                  </div>
                ) : (
                  day.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onToggleTaskCompletion(task.id)}
                      className={`p-2 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer hover:scale-[1.02] ${
                        task.completed
                          ? "bg-muted/30 border-border/40 text-muted-foreground/50 line-through"
                          : getPriorityColor(task.priority)
                      }`}
                    >
                      <div className="flex items-start gap-1.5 truncate">
                        <span className="text-[10px] font-black mt-0.5 shrink-0">
                          {task.completed ? "✓" : "•"}
                        </span>
                        <span className="text-[10px] font-bold leading-tight truncate">
                          {task.title}
                        </span>
                      </div>
                      {task.duration && (
                        <span className="text-[7.5px] font-black text-muted-foreground/80 flex items-center gap-0.5 pl-2.5">
                          ⏱️ {getShortDuration(task.duration)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 4. YEAR VIEW
  const renderYearView = () => {
    const year = calendarDate.getFullYear()
    const months = Array.from({ length: 12 }, (_, i) => i)

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 select-none animate-fade-in">
        {months.map((monthIdx) => {
          const tempDate = new Date(year, monthIdx, 1)
          const monthName = tempDate.toLocaleDateString("en-US", { month: "long" })
          
          const firstDay = tempDate.getDay()
          const totalDays = new Date(year, monthIdx + 1, 0).getDate()

          const cells = []
          for (let i = 0; i < firstDay; i++) {
            cells.push(null)
          }
          for (let i = 1; i <= totalDays; i++) {
            cells.push(new Date(year, monthIdx, i))
          }

          return (
            <div
              key={monthIdx}
              className="bg-card border border-border/80 rounded-2xl p-3 hover:border-primary/25 transition-colors flex flex-col justify-between select-none"
            >
              <h3 className="text-xs font-black text-foreground mb-2 text-center">
                {monthName}
              </h3>

              <div className="grid grid-cols-7 gap-y-1 text-center text-[7.5px] font-black uppercase text-muted-foreground/50 tracking-wider mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                  <span key={idx}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1 text-center text-[8.5px] font-bold">
                {cells.map((dayDate, idx) => {
                  if (!dayDate) return <span key={`empty-${idx}`} />

                  const dateStr = dayDate.toISOString().split("T")[0]
                  const hasTasks = tasks.some((t) => t.dueDate === dateStr)
                  const isSelected = calendarDate.toDateString() === dayDate.toDateString()
                  const isToday = dayDate.toDateString() === new Date().toDateString()

                  return (
                    <button
                      key={`day-${idx}`}
                      onClick={() => {
                        setCalendarDate(dayDate)
                        setViewMode("day")
                      }}
                      className={`h-4.5 w-4.5 rounded-full flex flex-col items-center justify-center relative cursor-pointer hover:bg-muted select-none ${
                        isSelected
                          ? "bg-blue-600 text-white font-black"
                          : isToday
                          ? "border border-blue-500 text-blue-600 font-extrabold"
                          : "text-foreground/90 font-bold"
                      }`}
                    >
                      <span>{dayDate.getDate()}</span>
                      {hasTasks && !isSelected && (
                        <span className="absolute bottom-0 h-0.7 w-0.7 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 5. AGENDA VIEW
  const renderAgendaView = () => {
    const agendaTasks = tasks.filter((t) => t.dueDate)
    const sorted = [...agendaTasks].sort((a, b) => {
      const cmp = (a.dueDate || "").localeCompare(b.dueDate || "")
      if (cmp !== 0) return cmp
      if (a.duration && !b.duration) return -1
      if (!a.duration && b.duration) return 1
      if (a.duration && b.duration) return a.duration.localeCompare(b.duration)
      return 0
    })

    const groups: { [dateStr: string]: Task[] } = {}
    sorted.forEach((t) => {
      const d = t.dueDate!
      if (!groups[d]) groups[d] = []
      groups[d].push(t)
    })

    const groupKeys = Object.keys(groups).sort()

    if (groupKeys.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-2xl select-none animate-fade-in">
          <ListTodo className="h-10 w-10 text-muted-foreground/35 mb-3" />
          <h3 className="text-xs font-black text-muted-foreground/85 uppercase tracking-wider">
            No Agenda Items
          </h3>
          <p className="text-[10px] font-semibold text-muted-foreground/50 mt-1 max-w-[240px]">
            Add due dates to your tasks to see them scheduled beautifully in agenda list view.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6 select-none animate-fade-in">
        {groupKeys.map((dateStr) => {
          const dateObj = new Date(dateStr)
          const dateTitle = dateObj.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
          const isToday = dateStr === new Date().toISOString().split("T")[0]
          const isTomorrow = dateStr === new Date(Date.now() + 86400000).toISOString().split("T")[0]
          const dayBadge = isToday ? "Today" : isTomorrow ? "Tomorrow" : ""

          return (
            <div
              key={dateStr}
              className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-start gap-4"
            >
              <div className="md:w-48 shrink-0 flex items-center justify-between md:flex-col md:items-start border-b md:border-b-0 md:border-r border-border/50 pb-2.5 md:pb-0 md:pr-4">
                <div className="flex flex-col">
                  {dayBadge && (
                    <span className="text-[8px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 w-max mb-1">
                      {dayBadge}
                    </span>
                  )}
                  <h4 className="text-xs font-black text-foreground">{dateTitle}</h4>
                </div>
                
                <button
                  onClick={() => onQuickAddTask(dateStr)}
                  className="p-1 text-muted-foreground hover:text-blue-600 hover:bg-muted rounded-md transition-colors cursor-pointer mt-1"
                  title="Add task for this day"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                {groups[dateStr].map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTaskCompletion(task.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between hover:scale-[1.01] transition-all cursor-pointer ${
                      task.completed
                        ? "bg-muted/30 border-border/40 text-muted-foreground/50 line-through"
                        : getPriorityColor(task.priority)
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          task.completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-muted-foreground/35 hover:border-blue-500 bg-white"
                        }`}
                      >
                        {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      <div className="flex flex-col gap-0.5 truncate">
                        <span className="text-xs font-bold truncate">{task.title}</span>
                        {task.duration && (
                          <span className="text-[9px] font-black text-muted-foreground/75 flex items-center gap-1">
                            ⏱️ {formatDuration12h(task.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    {task.priority && task.priority !== "NONE" && (
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 ${getPriorityBadgeColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 6. MULTI-DAY VIEW
  const renderMultiDayView = () => {
    const days = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(calendarDate)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr)

      const sortedTasks = [...dayTasks].sort((a, b) => {
        if (a.duration && !b.duration) return -1
        if (!a.duration && b.duration) return 1
        if (a.duration && b.duration) return a.duration.localeCompare(b.duration)
        return 0
      })

      return {
        date: d,
        dateStr,
        tasks: sortedTasks,
      }
    })

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 select-none animate-fade-in">
        {days.map((day, idx) => {
          const isToday = day.date.toDateString() === new Date().toDateString()
          const dayName = day.date.toLocaleDateString("en-US", { weekday: "short" })

          return (
            <div
              key={idx}
              className={`flex flex-col min-h-[350px] p-2 bg-card border rounded-2xl hover:border-primary/30 transition-all ${
                isToday ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md shadow-blue-500/5 bg-blue-50/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3 px-1 select-none">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                    {dayName}
                  </span>
                  <span
                    className={`text-sm font-black mt-0.5 h-6.5 w-6.5 rounded-full flex items-center justify-center cursor-pointer ${
                      isToday ? "bg-blue-600 text-white font-black" : "text-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      setCalendarDate(day.date)
                      setViewMode("day")
                    }}
                  >
                    {day.date.getDate()}
                  </span>
                </div>

                <button
                  onClick={() => onQuickAddTask(day.dateStr)}
                  className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"
                  title={`Add task for ${dayName}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[320px] scrollbar-none pb-2 select-none">
                {day.tasks.length === 0 ? (
                  <div className="text-[9px] font-semibold text-muted-foreground/35 italic text-center py-8">
                    Empty
                  </div>
                ) : (
                  day.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onToggleTaskCompletion(task.id)}
                      className={`p-2 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer hover:scale-[1.02] ${
                        task.completed
                          ? "bg-muted/30 border-border/40 text-muted-foreground/50 line-through"
                          : getPriorityColor(task.priority)
                      }`}
                    >
                      <div className="flex items-start gap-1.5 truncate">
                        <span className="text-[10px] font-black mt-0.5 shrink-0">
                          {task.completed ? "✓" : "•"}
                        </span>
                        <span className="text-[10px] font-bold leading-tight truncate">
                          {task.title}
                        </span>
                      </div>
                      {task.duration && (
                        <span className="text-[7.5px] font-black text-muted-foreground/80 flex items-center gap-0.5 pl-2.5">
                          ⏱️ {getShortDuration(task.duration)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 7. MULTI-WEEK VIEW
  const renderMultiWeekView = () => {
    const start = new Date(calendarDate)
    start.setDate(start.getDate() - start.getDay())

    const cells = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      cells.push({
        date: d,
        dateStr,
        dayTasks: tasks.filter((t) => t.dueDate === dateStr),
      })
    }

    return (
      <div className="space-y-4 animate-fade-in select-none">
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground select-none">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 bg-muted/20 border border-border/40 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, idx) => {
            const isToday = cell.date.toDateString() === new Date().toDateString()
            return (
              <div
                key={idx}
                className="min-h-[120px] md:min-h-[140px] p-2 bg-card border border-border rounded-2xl flex flex-col justify-between group hover:border-primary/45 hover:shadow-xs transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-xs font-black h-6 w-6 rounded-full flex items-center justify-center cursor-pointer ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 scale-105"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      setCalendarDate(cell.date)
                      setViewMode("day")
                    }}
                  >
                    {cell.date.getDate()}
                  </span>

                  <button
                    onClick={() => onQuickAddTask(cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                    title="Add task for this day"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 mt-2 max-h-[80px] md:max-h-[100px] scrollbar-thin select-none">
                  {cell.dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTaskCompletion(task.id)
                      }}
                      className={`text-[9px] font-bold p-1 px-1.5 rounded-lg border truncate cursor-pointer hover:scale-[1.02] transition-transform select-none flex items-center gap-1 ${
                        task.completed
                          ? "bg-muted/30 border-border/40 text-muted-foreground/60 line-through"
                          : getPriorityColor(task.priority)
                      }`}
                    >
                      <span>{task.completed ? "✓" : "•"}</span>
                      {task.duration && (
                        <span className="text-[7.5px] font-black opacity-75 shrink-0 bg-white/60 px-0.5 rounded">
                          {getShortDuration(task.duration)}
                        </span>
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderActiveView = () => {
    switch (viewMode) {
      case "day":
        return renderDayView()
      case "week":
        return renderWeekView()
      case "multi-day":
        return renderMultiDayView()
      case "multi-week":
        return renderMultiWeekView()
      case "year":
        return renderYearView()
      case "agenda":
        return renderAgendaView()
      case "month":
      default:
        return renderMonthView()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black tracking-tight text-foreground select-none">
            {getHeaderTitle()}
          </h2>
          
          <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 border border-border select-none">
            <button
              onClick={() => handleNavigate("prev")}
              className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setCalendarDate(new Date())}
              className="text-[10px] font-extrabold px-2 py-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              Today
            </button>
            
            <button
              onClick={() => handleNavigate("next")}
              className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="relative select-none">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted/50 border border-border/80 rounded-xl text-[10.5px] font-black text-muted-foreground hover:text-foreground cursor-pointer transition-all shadow-3xs"
            >
              <span>{getViewLabel()}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/80 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <ViewDropdown
                currentView={viewMode}
                onViewChange={setViewMode}
                onClose={() => setDropdownOpen(false)}
              />
            )}
          </div>
        </div>

        <span className="text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 flex items-center gap-1.5 select-none hover:scale-102 transition-transform cursor-default">
          <Sparkles className="h-3 w-3 text-blue-500" /> Interactive Scheduler
        </span>
      </div>

      <div className="w-full">
        {renderActiveView()}
      </div>
    </div>
  )
}
