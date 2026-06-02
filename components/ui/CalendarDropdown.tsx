import React, { useState, useRef, useCallback } from "react"
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
  Timer,
} from "lucide-react"

interface CalendarDropdownProps {
  /** Current due date in "YYYY-MM-DD" format, or empty string / null for unset */
  value: string | null
  onChange: (date: string | null) => void
  duration?: string | null // duration string e.g. "11:30-15:00"
  onDurationChange?: (duration: string | null) => void
}

export function CalendarDropdown({
  value,
  onChange,
  duration = null,
  onDurationChange,
}: CalendarDropdownProps) {
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date())
  const [tempSelectedDate, setTempSelectedDate] = useState<string | null>(value || null)
  
  // Tabs and toggles
  const [activeTab, setActiveTab] = useState<"date" | "duration">("date")
  const [activeTarget, setActiveTarget] = useState<"start" | "end">("start")
  const [clockMode, setClockMode] = useState<"hours" | "minutes">("hours")
  const [isDragging, setIsDragging] = useState(false)
  const [editingTarget, setEditingTarget] = useState<"start" | "end" | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const timeInputRef = useRef<HTMLInputElement>(null)

  // Local Time Range States (24h values)
  const [startH, setStartH] = useState(9)
  const [startM, setStartM] = useState(0)
  const [endH, setEndH] = useState(17)
  const [endM, setEndM] = useState(0)
  const [isDurationSet, setIsDurationSet] = useState(duration !== null)

  // Sync / Parse duration when opened
  const handleOpen = () => {
    setTempSelectedDate(value || null)
    setCurrentMonth(value ? new Date(value) : new Date())
    setActiveTab("date")
    setActiveTarget("start")
    setClockMode("hours")

    if (duration) {
      try {
        const [start, end] = duration.split("-")
        const [sH, sM] = start.split(":").map(Number)
        const [eH, eM] = end.split(":").map(Number)
        
        if (!isNaN(sH) && !isNaN(sM) && !isNaN(eH) && !isNaN(eM)) {
          setStartH(sH)
          setStartM(sM)
          setEndH(eH)
          setEndM(eM)
        }
      } catch (err) {
        console.error("Error parsing duration range:", err)
      }
      setIsDurationSet(true)
    } else {
      // Defaults
      setStartH(9)
      setStartM(0)
      setEndH(17)
      setEndM(0)
      setIsDurationSet(false)
    }

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
    if (!dateStr) return "Set Date & Time"
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

  // 12-hour format converters
  const get12HourDetails = (hour24: number) => {
    const period = hour24 >= 12 ? "PM" : "AM"
    let hour12 = hour24 % 12
    if (hour12 === 0) hour12 = 12
    return { hour12, period }
  }

  const formatTimeRangeStr = (rawRange: string | null) => {
    if (!rawRange) return ""
    try {
      const [start, end] = rawRange.split("-")
      const [sH, sM] = start.split(":").map(Number)
      const [eH, eM] = end.split(":").map(Number)
      
      const sDetails = get12HourDetails(sH)
      const eDetails = get12HourDetails(eH)
      
      const sFormatted = `${sDetails.hour12}:${String(sM).padStart(2, "0")} ${sDetails.period}`
      const eFormatted = `${eDetails.hour12}:${String(eM).padStart(2, "0")} ${eDetails.period}`
      
      return ` (⏱️ ${sFormatted} - ${eFormatted})`
    } catch {
      return ""
    }
  }

  const start12 = get12HourDetails(startH)
  const end12 = get12HourDetails(endH)

  // Manual time input helpers
  const formatTimeFor12 = (h: number, m: number) => {
    const d = get12HourDetails(h)
    return `${d.hour12}:${String(m).padStart(2, "0")} ${d.period}`
  }

  const parseTimeInput = (raw: string): { hour24: number; minute: number } | null => {
    const cleaned = raw.trim().toUpperCase()
    // Match patterns like "2:30 PM", "2:30PM", "14:30", "2 PM", "2PM"
    const match12 = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/)
    if (match12) {
      let h = parseInt(match12[1], 10)
      const m = match12[2] ? parseInt(match12[2], 10) : 0
      const period = match12[3]
      if (h < 1 || h > 12 || m < 0 || m > 59) return null
      if (period === "AM" && h === 12) h = 0
      else if (period === "PM" && h !== 12) h += 12
      return { hour24: h, minute: m }
    }
    // Match 24h format like "14:30", "9:00"
    const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/)
    if (match24) {
      const h = parseInt(match24[1], 10)
      const m = parseInt(match24[2], 10)
      if (h < 0 || h > 23 || m < 0 || m > 59) return null
      return { hour24: h, minute: m }
    }
    return null
  }

  const startEditing = (target: "start" | "end") => {
    const h = target === "start" ? startH : endH
    const m = target === "start" ? startM : endM
    setEditingTarget(target)
    setEditingValue(formatTimeFor12(h, m))
    setTimeout(() => timeInputRef.current?.select(), 0)
  }

  const commitEditingTime = useCallback(() => {
    if (!editingTarget) return
    const parsed = parseTimeInput(editingValue)
    if (parsed) {
      if (editingTarget === "start") {
        setStartH(parsed.hour24)
        setStartM(parsed.minute)
      } else {
        setEndH(parsed.hour24)
        setEndM(parsed.minute)
      }
      setIsDurationSet(true)
    }
    setEditingTarget(null)
  }, [editingTarget, editingValue])

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitEditingTime()
    } else if (e.key === "Escape") {
      setEditingTarget(null)
    }
  }

  // Interactive Clock Physics
  const handleClockInteraction = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    
    const cx = 88
    const cy = 88
    const rx = clientX - rect.left - cx
    const ry = clientY - rect.top - cy
    
    const angle = Math.atan2(ry, rx) * (180 / Math.PI)
    const degrees = (angle + 90 + 360) % 360
    
    if (clockMode === "hours") {
      // 12 o'clock divisions
      let hourSelected = Math.round(degrees / 30)
      if (hourSelected === 0) hourSelected = 12
      
      if (activeTarget === "start") {
        const period = startH >= 12 ? "PM" : "AM"
        const new24H = period === "PM" ? (hourSelected === 12 ? 12 : hourSelected + 12) : (hourSelected === 12 ? 0 : hourSelected)
        setStartH(new24H)
      } else {
        const period = endH >= 12 ? "PM" : "AM"
        const new24H = period === "PM" ? (hourSelected === 12 ? 12 : hourSelected + 12) : (hourSelected === 12 ? 0 : hourSelected)
        setEndH(new24H)
      }
    } else {
      // 60 minutes divisions
      const minSelected = Math.round(degrees / 6) % 60
      // Snap to 5-minute ticks
      const snappedMin = Math.round(minSelected / 5) * 5 % 60
      if (activeTarget === "start") {
        setStartM(snappedMin)
      } else {
        setEndM(snappedMin)
      }
    }
    setIsDurationSet(true)
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true)
    handleClockInteraction(e)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleClockInteraction(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    setIsDragging(true)
    handleClockInteraction(e)
  }

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleClockInteraction(e)
    }
  }

  // Active Dial Hand Coordinates
  const getHandCoordinates = () => {
    const activeHour = activeTarget === "start" ? startH : endH
    const activeMinute = activeTarget === "start" ? startM : endM
    
    const activeVal = clockMode === "hours" ? (activeHour % 12 || 12) : activeMinute
    const divisions = clockMode === "hours" ? 12 : 60
    const angleDeg = (activeVal / divisions) * 360
    const angleRad = (angleDeg - 90) * (Math.PI / 180)
    
    const handX = 88 + 52 * Math.cos(angleRad)
    const handY = 88 + 52 * Math.sin(angleRad)
    return { handX, handY }
  }

  const { handX, handY } = getHandCoordinates()

  // Apply Duration Preset String (24h e.g., "09:00-17:00")
  const applyDurationPresetStr = (presetStr: string | null) => {
    if (presetStr) {
      const [start, end] = presetStr.split("-")
      const [sH, sM] = start.split(":").map(Number)
      const [eH, eM] = end.split(":").map(Number)
      setStartH(sH)
      setStartM(sM)
      setEndH(eH)
      setEndM(eM)
      setIsDurationSet(true)
    } else {
      setStartH(9)
      setStartM(0)
      setEndH(17)
      setEndM(0)
      setIsDurationSet(false)
    }
  }

  const getCombinedTimeRangeString = () => {
    const startStr = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`
    const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
    return `${startStr}-${endStr}`
  }



  return (
    <div className="relative flex items-center gap-1 text-xs font-bold text-muted-foreground">
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 cursor-pointer hover:text-foreground hover:bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border/40 bg-background/50 transition-all text-xs font-bold shadow-2xs"
        title="Change Date & Time Duration"
      >
        <Calendar className="h-4 w-4 text-muted-foreground/80 shrink-0" />
        <span>
          {getRelativeDateString(value || null)}
          {formatTimeRangeStr(duration)}
        </span>
      </button>

      {(value || duration) && (
        <button
          type="button"
          onClick={() => {
            onChange(null)
            if (onDurationChange) onDurationChange(null)
          }}
          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors"
          title="Clear Date & Time"
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
          <div className="absolute left-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 animate-fade-in flex flex-col select-none">
            {/* Date / Duration Tabs */}
            <div className="bg-muted/50 p-1 rounded-xl flex gap-1 mb-4 text-[11px] font-extrabold text-muted-foreground select-none">
              <button
                type="button"
                onClick={() => setActiveTab("date")}
                className={`flex-1 py-1.5 rounded-lg text-center font-black transition-all cursor-pointer ${
                  activeTab === "date"
                    ? "bg-card text-foreground shadow-xs scale-[1.01]"
                    : "hover:bg-muted/40 text-muted-foreground/75"
                }`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("duration")
                  setIsDurationSet(true)
                }}
                className={`flex-1 py-1.5 rounded-lg text-center font-black transition-all cursor-pointer ${
                  activeTab === "duration"
                    ? "bg-card text-foreground shadow-xs scale-[1.01]"
                    : "hover:bg-muted/40 text-muted-foreground/75"
                }`}
              >
                Duration
              </button>
            </div>

            {/* TAB CONTENT: DATE PICKER */}
            {activeTab === "date" && (
              <>
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
                <div className="border-t border-border/40 py-2 mb-2 space-y-1 select-none">
                  {[
                    { label: "Time", icon: Clock, color: "text-blue-500" },
                    { label: "Reminder", icon: AlarmClock, color: "text-amber-500" },
                    { label: "Repeat", icon: Repeat, color: "text-indigo-500" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => alert(`${item.label} setting is a premium feature.`)}
                      className="w-full flex items-center justify-between py-2 px-2 hover:bg-muted/60 rounded-xl cursor-pointer text-xs font-bold text-muted-foreground/90 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* TAB CONTENT: DAILY TIME RANGE CLOCK */}
            {activeTab === "duration" && (
              <div className="flex flex-col items-center select-none py-1 animate-fade-in">
                {/* Target Start vs End Toggles */}
                <div className="flex items-center justify-between w-full mb-3.5 px-1 bg-muted/40 p-2.5 rounded-2xl border border-border/30">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTarget("start")
                      setClockMode("hours")
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setActiveTarget("start")
                      startEditing("start")
                    }}
                    className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all cursor-pointer ${
                      activeTarget === "start"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02] font-black"
                        : "text-muted-foreground/85 hover:bg-muted/60 hover:text-foreground font-bold"
                    }`}
                  >
                    <span className="text-[8px] uppercase tracking-wider opacity-60 mb-0.5 font-bold">Start Time</span>
                    {editingTarget === "start" ? (
                      <input
                        ref={timeInputRef}
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={commitEditingTime}
                        onKeyDown={handleTimeInputKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-black bg-transparent border-b border-white/60 outline-none text-center w-20 py-0 placeholder:text-white/40"
                        placeholder="2:30 PM"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs font-black" title="Double-click to type">
                        {start12.hour12}:{String(startM).padStart(2, "0")} {start12.period}
                      </span>
                    )}
                  </button>
                  
                  <span className="text-muted-foreground/45 px-2 font-extrabold text-[10px]">to</span>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTarget("end")
                      setClockMode("hours")
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setActiveTarget("end")
                      startEditing("end")
                    }}
                    className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all cursor-pointer ${
                      activeTarget === "end"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02] font-black"
                        : "text-muted-foreground/85 hover:bg-muted/60 hover:text-foreground font-bold"
                    }`}
                  >
                    <span className="text-[8px] uppercase tracking-wider opacity-60 mb-0.5 font-bold">End Time</span>
                    {editingTarget === "end" ? (
                      <input
                        ref={timeInputRef}
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={commitEditingTime}
                        onKeyDown={handleTimeInputKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-black bg-transparent border-b border-white/60 outline-none text-center w-20 py-0 placeholder:text-white/40"
                        placeholder="5:00 PM"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs font-black" title="Double-click to type">
                        {end12.hour12}:{String(endM).padStart(2, "0")} {end12.period}
                      </span>
                    )}
                  </button>
                </div>

                {/* Unit Sub-selector and AM/PM Selector next to each other */}
                <div className="flex items-center justify-between w-full gap-2 mb-3.5 select-none px-1">
                  {/* Unit Toggles */}
                  <div className="flex bg-muted/40 p-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-muted-foreground flex-1">
                    <button
                      type="button"
                      onClick={() => setClockMode("hours")}
                      className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                        clockMode === "hours" ? "bg-card text-foreground shadow-xs" : "hover:text-foreground"
                      }`}
                    >
                      Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => setClockMode("minutes")}
                      className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                        clockMode === "minutes" ? "bg-card text-foreground shadow-xs" : "hover:text-foreground"
                      }`}
                    >
                      Min
                    </button>
                  </div>

                  {/* AM/PM switcher for active target */}
                  <div className="flex bg-muted/40 p-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-muted-foreground flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        const activeHour = activeTarget === "start" ? startH : endH
                        if (activeHour >= 12) {
                          if (activeTarget === "start") setStartH(activeHour - 12)
                          else setEndH(activeHour - 12)
                        }
                        setIsDurationSet(true)
                      }}
                      className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                        (activeTarget === "start" ? startH : endH) < 12 
                          ? "bg-card text-blue-600 shadow-xs font-black" 
                          : "hover:text-foreground"
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const activeHour = activeTarget === "start" ? startH : endH
                        if (activeHour < 12) {
                          if (activeTarget === "start") setStartH(activeHour + 12)
                          else setEndH(activeHour + 12)
                        }
                        setIsDurationSet(true)
                      }}
                      className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                        (activeTarget === "start" ? startH : endH) >= 12 
                          ? "bg-card text-blue-600 shadow-xs font-black" 
                          : "hover:text-foreground"
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* Circular Clock SVG Face */}
                <div className="relative w-44 h-44 mb-4 flex items-center justify-center bg-radial from-card via-background/40 to-muted/20 rounded-full border border-border/50 shadow-inner">
                  <svg
                    width="176"
                    height="176"
                    viewBox="0 0 176 176"
                    className="cursor-pointer overflow-visible select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                  >
                    <circle cx="88" cy="88" r="70" fill="none" stroke="currentColor" strokeWidth="1" className="text-border/25" />
                    
                    {/* glowing dial line */}
                    <line
                      x1="88"
                      y1="88"
                      x2={handX}
                      y2={handY}
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="text-blue-600 drop-shadow-[0_0_4px_rgba(37,99,235,0.6)] transition-all duration-75"
                    />
                    
                    <circle cx="88" cy="88" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" className="drop-shadow-sm" />
                    
                    {/* Hand Selector Glow Cap */}
                    <circle
                      cx={handX}
                      cy={handY}
                      r="12"
                      fill="#2563eb"
                      className="drop-shadow-[0_0_8px_rgba(37,99,235,0.7)] cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-75"
                    />

                    {/* Clock numbers placement */}
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const hourVal = idx === 0 ? 12 : idx
                      const minuteVal = idx * 5
                      
                      const angle = (idx * 30 - 90) * (Math.PI / 180)
                      const displayVal = clockMode === "hours" ? hourVal : minuteVal
                      
                      const activeHour = activeTarget === "start" ? startH : endH
                      const activeMinute = activeTarget === "start" ? startM : endM
                      
                      const isSelected = clockMode === "hours" 
                        ? (activeHour % 12 === 0 ? 12 : activeHour % 12) === hourVal
                        : activeMinute === minuteVal
                      
                      // Match the radius exactly to 52 for perfect alignment
                      const numX = 88 + 52 * Math.cos(angle)
                      const numY = 88 + 52 * Math.sin(angle)

                      return (
                        <text
                          key={idx}
                          x={numX}
                          y={numY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={`text-[10px] select-none font-extrabold transition-all duration-150 pointer-events-none ${
                            isSelected 
                              ? "fill-white font-black text-[11px]" 
                              : "fill-muted-foreground/80 hover:fill-foreground"
                          }`}
                        >
                          {displayVal}
                        </text>
                      )
                    })}
                  </svg>
                </div>

                {/* Presets Grid */}
                <div className="w-full space-y-2 border-t border-border/40 pt-4 pb-1">
                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                    <Timer className="h-3 w-3 text-muted-foreground/60" />
                    <span>Quick presets</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "9:00 AM - 5:00 PM", value: "09:00-17:00" },
                      { label: "11:30 AM - 3:00 PM", value: "11:30-15:00" },
                      { label: "12:00 PM - 1:00 PM", value: "12:00-13:00" },
                      { label: "1:00 PM - 2:00 PM", value: "13:00-14:00" },
                    ].map((p) => {
                      const isSelected = getCombinedTimeRangeString() === p.value
                      return (
                        <button
                          type="button"
                          key={p.value}
                          onClick={() => applyDurationPresetStr(p.value)}
                          className={`py-2 px-2 text-center rounded-xl text-[10px] font-black cursor-pointer transition-all border ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/15 scale-[1.02]"
                              : "bg-muted/10 border-border/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                  
                  {isDurationSet && (
                    <button
                      type="button"
                      onClick={() => {
                        applyDurationPresetStr(null)
                      }}
                      className="w-full py-2 mt-2 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 hover:border-red-500/25 text-[10px] font-black rounded-xl cursor-pointer text-center transition-colors select-none"
                    >
                      Remove Time Duration
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Dropdown footer action buttons */}
            <div className="flex gap-3 mt-1 select-none border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={() => {
                  onChange(tempSelectedDate || null)
                  if (onDurationChange) {
                    onDurationChange(isDurationSet ? getCombinedTimeRangeString() : null)
                  }
                  setOpen(false)
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer text-center shadow-md shadow-blue-500/15 transition-colors"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempSelectedDate(null)
                  onChange(null)
                  if (onDurationChange) onDurationChange(null)
                  setOpen(false)
                }}
                className="flex-1 py-2.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-black rounded-xl cursor-pointer text-center transition-colors"
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
