import React, { useState, useEffect, useRef } from "react"
import { Task } from "../types"
import { X, Calendar, Flag, Folder, CheckCircle2, Circle, FileText, Type, MessageSquare, MoreHorizontal, Inbox, ChevronLeft, ChevronRight, Sunrise, Sun, CalendarDays, Moon, Clock, AlarmClock, Repeat } from "lucide-react"

interface Project {
  id: string
  name: string
  color: string
}

interface TaskDetailsSidebarProps {
  task: Task
  projects: Project[]
  onUpdate: (
    taskId: string,
    updates: {
      title?: string
      content?: string | null
      priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH"
      dueDate?: string | null
      projectId?: string | null
    }
  ) => Promise<void> | void
  onToggleComplete: (taskId: string) => void
  onClose: () => void
}

export function TaskDetailsSidebar({
  task,
  projects,
  onUpdate,
  onToggleComplete,
  onClose,
}: TaskDetailsSidebarProps) {
  const [title, setTitle] = useState(task.title)
  const [content, setContent] = useState(task.content || "")
  const [dueDate, setDueDate] = useState(task.dueDate || "")
  const [priority, setPriority] = useState(task.priority)
  const [projectId, setProjectId] = useState(task.projectId)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tempSelectedDate, setTempSelectedDate] = useState<string | null>(task.dueDate || null)

  // Keep local state in sync when task selection changes
  useEffect(() => {
    setTitle(task.title)
    setContent(task.content || "")
    setDueDate(task.dueDate || "")
    setPriority(task.priority)
    setProjectId(task.projectId)
    setTempSelectedDate(task.dueDate || null)
  }, [task])

  const applyPreset = (preset: "today" | "tomorrow" | "nextWeek" | "nextMonth") => {
    const d = new Date()
    if (preset === "today") {
      // Keep today
    } else if (preset === "tomorrow") {
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
      const today = new Date()
      setCurrentMonth(today)
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

    // Previous month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i
      const date = new Date(year, month - 1, d)
      days.push({ date, isCurrentMonth: false, key: `prev-${d}` })
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d)
      days.push({ date, isCurrentMonth: true, key: `curr-${d}` })
    }

    // Next month leading days
    const remainingCells = 42 - days.length
    for (let d = 1; d <= remainingCells; d++) {
      const date = new Date(year, month + 1, d)
      days.push({ date, isCurrentMonth: false, key: `next-${d}` })
    }

    return days
  }

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== task.title) {
      onUpdate(task.id, { title: title.trim() })
    }
  }

  const handleContentBlur = () => {
    if (content !== (task.content || "")) {
      onUpdate(task.id, { content: content.trim() || null })
    }
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDueDate(val)
    onUpdate(task.id, { dueDate: val || null })
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "NONE" | "LOW" | "MEDIUM" | "HIGH"
    setPriority(val)
    onUpdate(task.id, { priority: val })
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setProjectId(val)
    onUpdate(task.id, { projectId: val })
  }

  // Get human-readable relative date string
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

    if (diffDays === 0) return `Today (${formatted})`
    if (diffDays === 1) return `Tomorrow (${formatted})`
    if (diffDays === -1) return `Yesterday (${formatted})`
    return `${formatted}`
  }

  const getPriorityColor = (p: string) => {
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

  return (
    <aside className="w-full md:w-[500px] bg-card border-l border-border h-full flex flex-col shadow-2xl relative overflow-hidden">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-neutral-50/50 select-none shrink-0">
        <div className="flex items-center gap-3">
          {/* Animated Toggle Completion checkbox */}
          <button
            onClick={() => onToggleComplete(task.id)}
            className="focus:outline-none cursor-pointer"
            title={task.completed ? "Mark Uncompleted" : "Mark Completed"}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 fill-green-500 text-card hover:scale-[0.98] transition-transform" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/60 hover:text-primary hover:scale-105 transition-all" />
            )}
          </button>

          {/* Subtle vertical separator */}
          <div className="w-px h-4 bg-border/80" />

          {/* Quick Date Display */}
          <div className="relative flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <button
              onClick={() => {
                setTempSelectedDate(dueDate || null)
                setCurrentMonth(dueDate ? new Date(dueDate) : new Date())
                setShowCalendarDropdown(!showCalendarDropdown)
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:text-foreground hover:bg-muted/50 px-2 py-1.5 rounded-lg border border-border/40 bg-background/50 transition-all text-xs font-bold"
              title="Change Due Date"
            >
              <Calendar className="h-4 w-4 text-muted-foreground/80 shrink-0" />
              <span>{getRelativeDateString(dueDate || null)}</span>
            </button>
            {dueDate && (
              <button
                onClick={() => {
                  setDueDate("")
                  setTempSelectedDate(null)
                  onUpdate(task.id, { dueDate: null })
                }}
                className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors"
                title="Clear Due Date"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Custom Premium Calendar Dropdown */}
            {showCalendarDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCalendarDropdown(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 animate-fade-in flex flex-col">
                  {/* Date / Duration Tabs */}
                  <div className="bg-muted/50 p-1 rounded-xl flex gap-1 select-none mb-4 text-[11px] font-extrabold text-muted-foreground">
                    <button className="flex-1 py-1.5 rounded-lg bg-card text-foreground shadow-xs cursor-pointer text-center font-black">
                      Date
                    </button>
                    <button
                      onClick={() => alert("Duration planning is a premium feature.")}
                      className="flex-1 py-1.5 rounded-lg hover:bg-muted cursor-pointer text-center text-muted-foreground/75 font-black transition-colors"
                    >
                      Duration
                    </button>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center justify-around border-b border-border/40 pb-3 mb-4 select-none">
                    <button
                      onClick={() => applyPreset("today")}
                      className="p-2 text-muted-foreground hover:bg-primary/5 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 group"
                      title="Today"
                    >
                      <Sun className="h-5 w-5 text-amber-500 fill-amber-500/20 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => applyPreset("tomorrow")}
                      className="p-2 text-muted-foreground hover:bg-primary/5 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 group"
                      title="Tomorrow"
                    >
                      <Sunrise className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => applyPreset("nextWeek")}
                      className="p-2 text-muted-foreground hover:bg-primary/5 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 group"
                      title="Next Week"
                    >
                      <CalendarDays className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
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
                        onClick={() => navigateMonth("prev")}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigateMonth("today")}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md cursor-pointer transition-colors"
                        title="Reset to Today"
                      >
                        <Circle className="h-2 w-2 fill-muted-foreground/30 text-muted-foreground" />
                      </button>
                      <button
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
                      onClick={() => {
                        setDueDate(tempSelectedDate || "")
                        onUpdate(task.id, { dueDate: tempSelectedDate || null })
                        setShowCalendarDropdown(false)
                      }}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer text-center shadow-md shadow-blue-500/15 transition-colors"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => {
                        setTempSelectedDate(null)
                        setDueDate("")
                        onUpdate(task.id, { dueDate: null })
                        setShowCalendarDropdown(false)
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
        </div>

        <div className="flex items-center gap-3">
          {/* Priority dropdown indicator - just a flag outline/filled, custom popover menu dropdown */}
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
              title="Change Priority"
            >
              <Flag className={`h-4.5 w-4.5 ${getPriorityColor(priority)} ${priority !== "NONE" ? "fill-current" : ""}`} />
            </button>

            {showPriorityDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPriorityDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 flex flex-col gap-0.5 animate-fade-in select-none">
                  {[
                    { value: "HIGH", label: "High", colorClass: "text-red-500 fill-current" },
                    { value: "MEDIUM", label: "Medium", colorClass: "text-amber-500 fill-current" },
                    { value: "LOW", label: "Low", colorClass: "text-blue-500 fill-current" },
                    { value: "NONE", label: "None", colorClass: "text-gray-400" },
                  ].map((opt) => {
                    const isSelected = priority === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setPriority(opt.value as any)
                          onUpdate(task.id, { priority: opt.value as any })
                          setShowPriorityDropdown(false)
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

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            title="Close Panel"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main Details Input Areas Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        {/* Task Title editable input */}
        <div className="space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur()
              }
            }}
            placeholder="Task title..."
            className="w-full text-xl md:text-2xl font-extrabold tracking-tight bg-transparent border-0 p-0 text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-0 focus-visible:ring-0 select-text"
          />
        </div>

        {/* Notes editor content area */}
        <div className="flex-1 flex flex-col min-h-[250px]">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2 select-none">
            <FileText className="h-3 w-3 text-muted-foreground/75" />
            <span>Notes</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
            placeholder="Add detailed markdown notes, checklists, or comments..."
            className="w-full flex-1 bg-muted/15 border border-border/40 p-4 rounded-2xl resize-none text-xs font-medium leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:bg-background focus:border-primary/40 focus:ring-0 focus-visible:ring-0 transition-all select-text"
          />
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="border-t border-border px-5 py-3 bg-neutral-50/50 flex items-center justify-between shrink-0 select-none">
        {/* Project Selector (Bottom Left) - custom popover dropdown */}
        <div className="relative flex items-center">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-1.5 hover:bg-muted/80 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border border-border/40 bg-background/50 text-xs font-semibold text-foreground"
            title="Move to List"
          >
            {projectId === "inbox" ? (
              <Inbox className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: projects.find((p) => p.id === projectId)?.color || "#ccc" }}
              />
            )}
            <span className="truncate max-w-[120px]">
              {projectId === "inbox" ? "Inbox" : projects.find((p) => p.id === projectId)?.name || "Inbox"}
            </span>
          </button>

          {showProjectDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProjectDropdown(false)}
              />
              <div className="absolute left-0 bottom-full mb-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto animate-fade-in select-none">
                {/* Inbox Option */}
                <button
                  onClick={() => {
                    setProjectId("inbox")
                    onUpdate(task.id, { projectId: "inbox" })
                    setShowProjectDropdown(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-muted/70 ${
                    projectId === "inbox" ? "bg-primary/5 text-primary" : "text-foreground/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="h-4 w-4 text-primary shrink-0" />
                    <span>Inbox</span>
                  </div>
                  {projectId === "inbox" && <span className="text-primary font-black">✓</span>}
                </button>

                {/* Projects Options */}
                {projects.map((proj) => {
                  const isSelected = projectId === proj.id
                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setProjectId(proj.id)
                        onUpdate(task.id, { projectId: proj.id })
                        setShowProjectDropdown(false)
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

        {/* Action icons (Bottom Right) */}
        <div className="flex items-center gap-1.5">
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
            title="Formatting Help"
          >
            <Type className="h-4.5 w-4.5" />
          </button>
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
            title="Task Comments"
          >
            <MessageSquare className="h-4.5 w-4.5" />
          </button>
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
            title="More Options"
          >
            <MoreHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
