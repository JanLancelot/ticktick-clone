import React, { useState, useEffect, useRef } from "react"
import {
  X,
  Plus,
  Smile,
  HelpCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Circle,
  Sun,
  Sunrise,
  Moon,
  Clock,
  Trash2,
  SmilePlus,
} from "lucide-react"
import { Habit } from "../types"

interface CreateHabitModalProps {
  mode?: "create" | "edit"
  habit?: Habit | null
  onAddHabit?: (
    name: string,
    color: string,
    icon?: string | null,
    frequency?: "DAILY" | "WEEKLY" | "MONTHLY",
    repeatDays?: number[],
    goal?: number,
    unit?: string | null,
    reminderTime?: string | null,
    startDate?: string | null,
    goalDays?: string | null,
    section?: string | null,
    goalType?: string | null,
    checkingMode?: string | null,
    recordCount?: number | null,
    frequencyType?: string | null,
    frequencyValue?: number | null
  ) => Promise<void> | void
  onEditHabit?: (
    habitId: string,
    updates: Partial<Omit<Habit, "id" | "records" | "streak">>
  ) => Promise<void> | void
  onCancel: () => void
  existingSections?: string[]
}

const DEFAULT_EMOJIS = [
  "😊", "🧘", "🏃", "📚", "💧", "🍏", "🦷", "🛏️", "🚲", "🥗",
  "💪", "💊", "✍️", "🧹", "🥛", "🚶", "⏰", "🎨", "💻", "🌱"
]

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]

export function CreateHabitModal({
  mode = "create",
  habit = null,
  onAddHabit,
  onEditHabit,
  onCancel,
  existingSections = [],
}: CreateHabitModalProps) {
  const isEdit = mode === "edit" && !!habit

  const [name, setName] = useState(habit?.name || "")
  const [color, setColor] = useState(habit?.color || "#3b82f6")
  const [icon, setIcon] = useState(habit?.icon || "😊")
  
  // Custom Emoji Picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [customEmoji, setCustomEmoji] = useState("")
  
  // Frequency State
  const [frequencyType, setFrequencyType] = useState<"daily" | "weekly" | "interval">(
    (habit?.frequencyType as "daily" | "weekly" | "interval") || "daily"
  )
  const [repeatDays, setRepeatDays] = useState<number[]>(habit?.repeatDays || [0, 1, 2, 3, 4, 5, 6]) // Custom weekdays for daily
  const [weeklyDaysCount, setWeeklyDaysCount] = useState(
    habit?.frequencyType === "weekly" ? habit.frequencyValue || 1 : 1
  ) // Weekly 1-7 days
  const [intervalDays, setIntervalDays] = useState(
    habit?.frequencyType === "interval" ? habit.frequencyValue || 2 : 2
  ) // Every 2 days
  const [showFreqDropdown, setShowFreqDropdown] = useState(false)
  
  // Goal State
  const [goalType, setGoalType] = useState<"all" | "amount">(
    (habit?.goalType as "all" | "amount") || "all"
  )
  const [goalCount, setGoalCount] = useState(habit?.goal || 1)
  const [unit, setUnit] = useState(habit?.unit || "Count")
  const [checkingMode, setCheckingMode] = useState<"auto" | "manual">(
    (habit?.checkingMode as "auto" | "manual") || "auto"
  )
  const [recordCount, setRecordCount] = useState(habit?.recordCount || 1)
  const [showGoalDropdown, setShowGoalDropdown] = useState(false)

  // Start Date Calendar State
  const initialStartDate = habit?.startDate
    ? (habit.startDate.includes("T") 
        ? habit.startDate.split("T")[0] 
        : habit.startDate)
    : new Date().toISOString().split("T")[0]
  const [startDate, setStartDate] = useState(initialStartDate)
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date(initialStartDate))

  // Goal Days State
  const [goalDays, setGoalDays] = useState(habit?.goalDays || "Forever")
  const [showGoalDaysTooltip, setShowGoalDaysTooltip] = useState(false)

  // Section State
  const [section, setSection] = useState(habit?.section || "Others")
  const [customSection, setCustomSection] = useState("")
  const [showCustomSectionInput, setShowCustomSectionInput] = useState(false)
  const [sectionsList, setSectionsList] = useState(["Others", "Morning", "Afternoon", "Night"])

  // Reminders State
  const [reminders, setReminders] = useState<string[]>(
    habit?.reminderTime ? habit.reminderTime.split(",") : []
  )
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [pickerHour, setPickerHour] = useState("09")
  const [pickerMin, setPickerMin] = useState("00")

  const modalRef = useRef<HTMLDivElement>(null)

  // Sync any unique existing sections on mount
  useEffect(() => {
    const combined = Array.from(new Set([...sectionsList, ...existingSections]))
    setSectionsList(combined)
  }, [existingSections])

  // Click outside to close helper
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // do not close modal but close inner pickers
        setShowEmojiPicker(false)
        setShowFreqDropdown(false)
        setShowGoalDropdown(false)
        setShowCalendar(false)
        setShowTimePicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    // reminderTime is serialized as comma-separated string
    const reminderStr = reminders.length > 0 ? reminders.join(",") : null

    // Determine fallback standard frequency
    let fallbackFreq: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY"
    if (frequencyType === "weekly") fallbackFreq = "WEEKLY"

    // Determine custom frequency value
    let freqVal = 1
    if (frequencyType === "weekly") freqVal = weeklyDaysCount
    if (frequencyType === "interval") freqVal = intervalDays

    const targetSection = showCustomSectionInput && customSection.trim() ? customSection.trim() : section

    if (isEdit) {
      if (onEditHabit && habit) {
        onEditHabit(habit.id, {
          name: name.trim(),
          color,
          icon,
          frequency: fallbackFreq,
          repeatDays: frequencyType === "daily" ? repeatDays : [],
          goal: goalCount,
          unit: goalType === "amount" ? unit : null,
          reminderTime: reminderStr,
          startDate,
          goalDays,
          section: targetSection,
          goalType,
          checkingMode,
          recordCount,
          frequencyType,
          frequencyValue: freqVal,
        })
      }
    } else {
      if (onAddHabit) {
        onAddHabit(
          name.trim(),
          color,
          icon,
          fallbackFreq,
          frequencyType === "daily" ? repeatDays : [],
          goalCount,
          goalType === "amount" ? unit : null,
          reminderStr,
          startDate,
          goalDays,
          targetSection,
          goalType,
          checkingMode,
          recordCount,
          frequencyType,
          freqVal
        )
      }
    }
  }

  // Weekday togglers helper
  const toggleDay = (dayIndex: number) => {
    setRepeatDays(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => a - b)
    )
  }

  // Calendar dates math helper
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDayOfWeek = firstDay.getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const prevMonthTotalDays = new Date(year, month, 0).getDate()

    const days = []
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthTotalDays - i), isCurrentMonth: false })
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true })
    }
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
    }
    return days
  }

  const navigateMonth = (dir: "prev" | "next") => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + (dir === "next" ? 1 : -1), 1))
  }

  const addReminder = () => {
    const time = `${pickerHour}:${pickerMin}`
    if (!reminders.includes(time)) {
      setReminders(prev => [...prev, time].sort())
    }
    setShowTimePicker(false)
  }

  const removeReminder = (time: string) => {
    setReminders(prev => prev.filter(t => t !== time))
  }

  const getFrequencyText = () => {
    if (frequencyType === "daily") {
      if (repeatDays.length === 7) return "Daily"
      if (repeatDays.length === 0) return "No Days Selected"
      const daysAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      return `Custom: ${repeatDays.map(d => daysAbbr[d].slice(0, 1)).join(", ")}`
    }
    if (frequencyType === "weekly") {
      return `Weekly: ${weeklyDaysCount} days`
    }
    if (frequencyType === "interval") {
      return `Every ${intervalDays} days`
    }
    return "Daily"
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        ref={modalRef}
        className="bg-card w-full max-w-lg rounded-3xl border border-border/80 shadow-2xl p-6 relative overflow-visible flex flex-col space-y-5 animate-scale-in select-none text-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-foreground/90">
            {isEdit ? "Edit Habit" : "Create Habit"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Custom Icon & Name */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-12 w-12 rounded-2xl bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-2xl transition-all cursor-pointer relative shadow-inner group"
                title="Choose custom icon/emoji"
              >
                {icon}
                <SmilePlus className="absolute bottom-0 right-0 h-3.5 w-3.5 text-muted-foreground bg-card rounded-full p-0.5 border border-border translate-x-1 translate-y-1 scale-0 group-hover:scale-100 transition-transform" />
              </button>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl z-50 p-3 animate-fade-in space-y-3">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pb-1 border-b border-border/40">
                    Select Habit Emoji
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {DEFAULT_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setIcon(emoji)
                          setShowEmojiPicker(false)
                        }}
                        className="h-9 w-9 rounded-xl hover:bg-muted flex items-center justify-center text-xl cursor-pointer transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border/40 pt-2 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Paste custom emoji..."
                      maxLength={2}
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      className="flex-1 h-8 px-2 text-xs bg-muted rounded-xl border border-border focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customEmoji.trim()) {
                          setIcon(customEmoji.trim())
                          setCustomEmoji("")
                          setShowEmojiPicker(false)
                        }
                      }}
                      className="px-2.5 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Use
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="e.g. Daily check-in, Reading, Meditation..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 h-12 px-4 bg-muted/40 rounded-2xl border border-border focus:border-blue-500 focus:outline-none text-sm font-bold tracking-tight text-foreground transition-all shadow-inner"
              autoFocus
              required
            />
          </div>

          {/* Theme Colors */}
          <div className="flex gap-2.5 items-center bg-muted/20 p-2.5 rounded-2xl border border-border/30">
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest pl-1 shrink-0">Color</span>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6.5 w-6.5 rounded-full border-2 transition-all cursor-pointer ${
                    color === c ? "border-foreground scale-110 shadow-md" : "border-transparent opacity-85 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Frequency Selector */}
            <div className="relative">
              <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Frequency</label>
              <button
                type="button"
                onClick={() => {
                  setShowFreqDropdown(!showFreqDropdown)
                  setShowGoalDropdown(false)
                  setShowCalendar(false)
                }}
                className="w-full h-11 px-3 mt-1.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-xl flex items-center justify-between text-xs font-bold cursor-pointer transition-colors text-left"
              >
                <span>{getFrequencyText()}</span>
                <span className="text-muted-foreground/60 text-[10px]">▼</span>
              </button>

              {showFreqDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 animate-fade-in space-y-4">
                  <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl text-[10px] font-bold">
                    {[
                      { type: "daily", label: "Daily" },
                      { type: "weekly", label: "Weekly" },
                      { type: "interval", label: "Interval" }
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setFrequencyType(item.type as any)}
                        className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                          frequencyType === item.type
                            ? "bg-card text-foreground shadow-xs font-black"
                            : "text-muted-foreground hover:bg-card/50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {frequencyType === "daily" && (
                    <div className="space-y-2 select-none">
                      <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Pick Days</div>
                      <div className="flex justify-between gap-1">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => {
                          const isSelected = repeatDays.includes(idx)
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleDay(idx)}
                              className={`h-7 w-7 rounded-full text-[10px] font-black flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/15"
                                  : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                              }`}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {frequencyType === "weekly" && (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold py-1 select-none animate-fade-in">
                      <span>Weekly</span>
                      <select
                        value={weeklyDaysCount}
                        onChange={(e) => setWeeklyDaysCount(parseInt(e.target.value) || 1)}
                        className="bg-muted px-2.5 py-1.5 border border-border rounded-xl focus:outline-none font-black text-center cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <span>days</span>
                    </div>
                  )}

                  {frequencyType === "interval" && (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold py-1 select-none animate-fade-in">
                      <span>Every</span>
                      <input
                        type="number"
                        min={2}
                        max={365}
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(Math.max(2, parseInt(e.target.value) || 2))}
                        className="bg-muted w-14 px-2 py-1 border border-border rounded-xl focus:outline-none font-black text-center"
                      />
                      <span>days</span>
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-border/40 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowFreqDropdown(false)}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRepeatDays([0, 1, 2, 3, 4, 5, 6])
                        setFrequencyType("daily")
                        setShowFreqDropdown(false)
                      }}
                      className="flex-1 py-1.5 border border-border hover:bg-muted text-muted-foreground text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Goal Selector */}
            <div className="relative">
              <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Goal</label>
              <button
                type="button"
                onClick={() => {
                  setShowGoalDropdown(!showGoalDropdown)
                  setShowFreqDropdown(false)
                  setShowCalendar(false)
                }}
                className="w-full h-11 px-3 mt-1.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-xl flex items-center justify-between text-xs font-bold cursor-pointer transition-colors text-left"
              >
                <span>{goalType === "all" ? "Achieve it all" : `Reach ${goalCount} ${unit} daily`}</span>
                <span className="text-muted-foreground/60 text-[10px]">▼</span>
              </button>

              {showGoalDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 animate-fade-in space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={goalType === "all"}
                        onChange={() => setGoalType("all")}
                        className="h-4 w-4 rounded-md border-border text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Achieve it all</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={goalType === "amount"}
                        onChange={() => setGoalType("amount")}
                        className="h-4 w-4 rounded-md border-border text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Reach a certain amount</span>
                    </label>
                  </div>

                  {goalType === "amount" && (
                    <div className="space-y-3 p-3 bg-muted/20 border border-border/40 rounded-xl animate-fade-in text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-muted-foreground uppercase tracking-wider">Target:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={goalCount}
                            onChange={(e) => setGoalCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 h-7 px-1.5 text-center bg-card border border-border rounded-md focus:outline-none font-bold"
                          />
                          <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="h-7 px-1.5 bg-card border border-border rounded-md focus:outline-none font-bold cursor-pointer"
                          >
                            {["Count", "times", "glasses", "km", "minutes", "hours", "pages"].map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-muted-foreground uppercase tracking-wider">Log Mode:</span>
                        <select
                          value={checkingMode}
                          onChange={(e) => setCheckingMode(e.target.value as any)}
                          className="h-7 px-1.5 bg-card border border-border rounded-md focus:outline-none font-bold text-xs cursor-pointer"
                        >
                          <option value="auto">Auto pop-up</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-muted-foreground uppercase tracking-wider">Default Record:</span>
                        <input
                          type="number"
                          min={1}
                          value={recordCount}
                          onChange={(e) => setRecordCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 h-7 px-1.5 text-center bg-card border border-border rounded-md focus:outline-none font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-border/40 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowGoalDropdown(false)}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGoalType("all");
                        setGoalCount(1);
                        setShowGoalDropdown(false);
                      }}
                      className="flex-1 py-1.5 border border-border hover:bg-muted text-muted-foreground text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Start Date Datepicker */}
            <div className="relative">
              <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Start Date</label>
              <button
                type="button"
                onClick={() => {
                  setShowCalendar(!showCalendar)
                  setShowFreqDropdown(false)
                  setShowGoalDropdown(false)
                }}
                className="w-full h-11 px-3 mt-1.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-xl flex items-center justify-between text-xs font-bold cursor-pointer transition-colors text-left"
              >
                <span>{new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <Calendar className="h-4 w-4 text-muted-foreground/60" />
              </button>

              {showCalendar && (
                <div className="absolute left-0 right-0 top-full mt-1.5 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 animate-fade-in flex flex-col">
                  {/* Month Nav */}
                  <div className="flex items-center justify-between px-1 mb-3.5">
                    <span className="font-extrabold text-foreground text-xs">
                      {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigateMonth("prev")}
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateMonth("next")}
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-y-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/50 mb-1.5">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                      <span key={idx}>{d}</span>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                    {getCalendarDays().map((cell, idx) => {
                      const dateStr = cell.date.toISOString().split("T")[0]
                      const isSelected = startDate === dateStr
                      const isToday = new Date().toISOString().split("T")[0] === dateStr
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setStartDate(dateStr)
                            setShowCalendar(false)
                          }}
                          className="flex items-center justify-center p-0.5 cursor-pointer relative"
                        >
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-blue-600 text-white font-extrabold shadow-sm"
                                : isToday
                                ? "border border-blue-500 text-blue-600 font-extrabold"
                                : cell.isCurrentMonth
                                ? "text-foreground font-bold hover:bg-muted"
                                : "text-muted-foreground/35 hover:bg-muted/30"
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Goal Days with Tooltip */}
            <div className="relative">
              <div className="flex items-center gap-1">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Goal Days</label>
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onMouseEnter={() => setShowGoalDaysTooltip(true)}
                    onMouseLeave={() => setShowGoalDaysTooltip(false)}
                    onClick={() => setShowGoalDaysTooltip(!showGoalDaysTooltip)}
                    className="text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                  {showGoalDaysTooltip && (
                    <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 w-44 bg-neutral-900 text-white text-[9px] font-bold p-2.5 rounded-xl shadow-lg z-50 leading-relaxed animate-fade-in">
                      Set how long you want to practice this habit before completing it (e.g. 21 days for standard habit formation).
                    </div>
                  )}
                </div>
              </div>
              <select
                value={goalDays}
                onChange={(e) => setGoalDays(e.target.value)}
                className="w-full h-11 px-3 mt-1.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-xl flex items-center justify-between text-xs font-bold focus:outline-none cursor-pointer transition-colors"
              >
                {["Forever", "7 days", "21 days", "30 days", "100 days", "365 days"].map(d => (
                  <option key={d} value={d} className="bg-card font-bold">{d}</option>
                ))}
              </select>
            </div>

            {/* Section Picker */}
            <div className="relative">
              <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Section</label>
              {!showCustomSectionInput ? (
                <select
                  value={section}
                  onChange={(e) => {
                    if (e.target.value === "ADD_CUSTOM") {
                      setShowCustomSectionInput(true)
                    } else {
                      setSection(e.target.value)
                    }
                  }}
                  className="w-full h-11 px-3 mt-1.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-xl flex items-center justify-between text-xs font-bold focus:outline-none cursor-pointer transition-colors"
                >
                  {sectionsList.map(s => (
                    <option key={s} value={s} className="bg-card font-bold">{s}</option>
                  ))}
                  <option value="ADD_CUSTOM" className="bg-card text-blue-600 font-extrabold">+ Add Section...</option>
                </select>
              ) : (
                <div className="flex gap-1.5 mt-1.5 select-none items-center">
                  <input
                    type="text"
                    placeholder="New section name..."
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value)}
                    className="flex-1 h-11 px-3 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customSection.trim()) {
                        const newSec = customSection.trim()
                        if (!sectionsList.includes(newSec)) {
                          setSectionsList(prev => [...prev, newSec])
                        }
                        setSection(newSec)
                        setShowCustomSectionInput(false)
                        setCustomSection("")
                      }
                    }}
                    className="px-3 h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomSectionInput(false)
                      setCustomSection("")
                    }}
                    className="px-3 h-11 border border-border hover:bg-muted text-muted-foreground text-xs font-black rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Reminder hour selector */}
            <div className="relative">
              <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">Reminder</label>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 bg-muted/20 border border-border/30 p-2 rounded-xl min-h-[44px]">
                {reminders.map((time) => (
                  <span
                    key={time}
                    onClick={() => removeReminder(time)}
                    className="px-2.5 py-1 bg-blue-600/10 border border-blue-500/25 text-blue-600 text-[10px] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-500 transition-all select-none animate-scale-in"
                    title="Click to remove reminder"
                  >
                    <span>{time}</span>
                    <span className="text-[8px] opacity-75">✕</span>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setShowTimePicker(!showTimePicker)
                    setShowFreqDropdown(false)
                    setShowGoalDropdown(false)
                    setShowCalendar(false)
                  }}
                  className="h-7 w-7 rounded-lg border border-dashed border-border hover:border-muted-foreground/50 hover:bg-muted/40 flex items-center justify-center text-muted-foreground/60 hover:text-foreground cursor-pointer transition-all"
                  title="Add reminder time"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {showTimePicker && (
                  <div className="absolute right-0 top-full mt-1.5 bg-card border border-border rounded-2xl shadow-xl z-50 p-3.5 animate-fade-in flex flex-col space-y-3.5 w-44">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center border-b border-border/30 pb-1">
                      Set Reminder Time
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <select
                        value={pickerHour}
                        onChange={(e) => setPickerHour(e.target.value)}
                        className="bg-muted p-1 border border-border rounded-lg text-xs font-bold text-center w-12"
                      >
                        {Array.from({ length: 24 }).map((_, i) => {
                          const h = i.toString().padStart(2, "0")
                          return <option key={h} value={h}>{h}</option>
                        })}
                      </select>
                      <span className="font-extrabold text-xs text-muted-foreground">:</span>
                      <select
                        value={pickerMin}
                        onChange={(e) => setPickerMin(e.target.value)}
                        className="bg-muted p-1 border border-border rounded-lg text-xs font-bold text-center w-12"
                      >
                        {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-1.5 border-t border-border/30 pt-3">
                      <button
                        type="button"
                        onClick={addReminder}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-lg cursor-pointer text-center"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTimePicker(false)}
                        className="flex-1 py-1.5 border border-border hover:bg-muted text-muted-foreground text-[10px] font-black rounded-lg cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border/40 select-none">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-black rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-blue-500/15 transition-all active:translate-y-px"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
