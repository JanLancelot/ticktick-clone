import React from "react"
import { ChevronLeft, ChevronRight, Sparkles, Plus, ChevronDown } from "lucide-react"

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate: string | null
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
  // Generate standard 42-cell calendar days array
  const renderCalendarDays = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const prevTotalDays = new Date(year, month, 0).getDate()

    const cells = []

    // Previous Month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevTotalDays - i
      const prevMonthDate = new Date(year, month - 1, dayNum)
      const dateStr = prevMonthDate.toISOString().split("T")[0]
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr)
      cells.push({
        dayNum,
        isCurrentMonth: false,
        date: prevMonthDate,
        dateStr,
        tasks: dayTasks,
      })
    }

    // Current Month days
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i)
      const dateStr = currDate.toISOString().split("T")[0]
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr)
      cells.push({
        dayNum: i,
        isCurrentMonth: true,
        date: currDate,
        dateStr,
        tasks: dayTasks,
      })
    }

    // Next Month padding days
    const totalCells = cells.length
    const remainingCells = 42 - totalCells
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDate = new Date(year, month + 1, i)
      const dateStr = nextMonthDate.toISOString().split("T")[0]
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr)
      cells.push({
        dayNum: i,
        isCurrentMonth: false,
        date: nextMonthDate,
        dateStr,
        tasks: dayTasks,
      })
    }

    return cells
  }

  const cells = renderCalendarDays()

  return (
    <div className="space-y-6 animate-fade-in duration-300">
      {/* Calendar Header with navigation controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold tracking-tight">
            {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 border border-border">
            <button
              onClick={() => {
                const prev = new Date(calendarDate)
                prev.setMonth(prev.getMonth() - 1)
                setCalendarDate(prev)
              }}
              className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCalendarDate(new Date())}
              className="text-[10px] font-bold px-2 py-1 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => {
                const next = new Date(calendarDate)
                next.setMonth(next.getMonth() + 1)
                setCalendarDate(next)
              }}
              className="p-1.5 hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5 animate-pulse">
          <Sparkles className="h-3 w-3" /> Interactive Scheduler
        </span>
      </div>

      {/* Weekdays indicator row */}
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground select-none">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2 bg-muted/20 border border-border/40 rounded-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, idx) => {
          const isToday = cell.date.toDateString() === new Date().toDateString()
          return (
            <div
              key={idx}
              className={`min-h-[100px] md:min-h-[120px] p-2 bg-card border rounded-2xl flex flex-col justify-between group hover:border-primary/50 hover:shadow-xs transition-all relative overflow-hidden ${
                cell.isCurrentMonth ? "border-border" : "border-border/40 opacity-40 bg-muted/5"
              }`}
            >
              {/* Header row inside day cell */}
              <div className="flex justify-between items-start">
                <span
                  className={`text-xs font-black h-6 w-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105"
                      : "text-muted-foreground"
                  }`}
                >
                  {cell.dayNum}
                </span>

                {/* Quick Plus button */}
                <button
                  onClick={() => onQuickAddTask(cell.dateStr)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                  title="Add task for this day"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Task items list scrollable */}
              <div className="flex-1 overflow-y-auto space-y-1 mt-2 max-h-[60px] md:max-h-[80px] scrollbar-thin select-none">
                {cell.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleTaskCompletion(task.id)
                    }}
                    title={task.title}
                    className={`text-[9px] font-bold p-1 px-1.5 rounded-lg border truncate cursor-pointer hover:scale-[1.02] transition-transform select-none ${
                      task.completed
                        ? "bg-muted/30 border-border/40 text-muted-foreground/60 line-through"
                        : "bg-primary/5 border-primary/20 text-primary"
                    }`}
                  >
                    {task.completed ? "✓ " : "• "}
                    {task.title}
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
