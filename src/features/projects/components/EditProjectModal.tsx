import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, AlertTriangle, Smile, Palette, Edit3, PlusCircle, X } from "lucide-react"

interface Project {
  id: string
  name: string
  color: string
  icon?: string | null
}

interface EditProjectModalProps {
  mode?: "create" | "edit"
  project?: Project | null
  onSave: (id: string, name: string, color: string, icon: string | null) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
  onClose: () => void
}

const PRESET_EMOJIS = [
  "📁", "📝", "🎯", "🚀", "💡", "🎨", "💻", "📚", "✍️", "🧠",
  "🏃‍♂️", "🥗", "🧘‍♂️", "🛒", "🛍️", "✈️", "🏠", "💼", "🎓", "💵",
  "📈", "💬", "🎵", "🍿", "🎮", "🍕", "🐾", "🌱", "❤️", "🔥",
  "⭐", "⏰"
]

const PRESET_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
]

export function EditProjectModal({ 
  mode = "edit", 
  project, 
  onSave, 
  onDelete, 
  onClose 
}: EditProjectModalProps) {
  const isCreate = mode === "create"
  
  const [name, setName] = useState(project?.name || "")
  const [color, setColor] = useState(project?.color || PRESET_COLORS[7]) // Default Blue
  const [icon, setIcon] = useState<string | null>(project?.icon || null)
  const [customEmoji, setCustomEmoji] = useState("")
  const [customColor, setCustomColor] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(project?.id || "", name.trim(), color, icon)
    onClose()
  }

  const handleDelete = () => {
    if (onDelete && project) {
      onDelete(project.id)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-up z-10 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            {isCreate ? (
              <PlusCircle className="h-5 w-5 text-primary" />
            ) : (
              <Edit3 className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-extrabold text-sm tracking-tight text-foreground">
              {isCreate ? "Create List" : "List Settings"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showDeleteConfirm ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-xs font-black">Delete this List?</p>
                  <p className="text-[11px] font-semibold opacity-90 mt-0.5">
                    Are you sure you want to delete <span className="underline font-bold">"{project?.name}"</span>?
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                All tasks in this list will remain in your workspace but will be moved back to the default <span className="font-bold text-foreground">Inbox</span> list. This action cannot be undone.
              </p>
              
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-9 px-4 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-9 px-4 rounded-xl bg-destructive text-white hover:bg-destructive/90 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-destructive/15 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  Confirm Delete
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* List Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">
                  List Name
                </label>
                <div className="relative flex items-center">
                  {icon && (
                    <span className="absolute left-3 text-lg leading-none select-none">
                      {icon}
                    </span>
                  )}
                  <Input
                    type="text"
                    placeholder="Enter list name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`h-10 text-xs font-bold rounded-xl border border-border shadow-2xs focus:ring-primary ${
                      icon ? "pl-10" : "pl-3"
                    }`}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Icon Picker (Emojis) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">
                    <Smile className="h-3.5 w-3.5" />
                    Select Emoji Icon
                  </span>
                  {icon && (
                    <button
                      type="button"
                      onClick={() => setIcon(null)}
                      className="text-[9px] text-destructive hover:underline font-bold"
                    >
                      Remove Icon
                    </button>
                  )}
                </div>

                {/* Preset Emojis Grid */}
                <div className="grid grid-cols-8 gap-1.5 p-2.5 rounded-xl border border-border bg-muted/10 max-h-32 overflow-y-auto">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`h-8 w-8 text-base rounded-lg flex items-center justify-center hover:bg-muted cursor-pointer transition-all active:scale-90 ${
                        icon === emoji ? "bg-primary/10 border border-primary/30 scale-105" : "border border-transparent"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Custom Emoji Input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Or enter a custom emoji..."
                    value={customEmoji}
                    onChange={(e) => {
                      const val = e.target.value
                      setCustomEmoji(val)
                      // If it's a valid non-empty string, set it as icon
                      if (val.trim()) {
                        setIcon(val.trim().slice(0, 4)) // grab up to 4 characters (for complex compound emojis)
                      }
                    }}
                    className="h-8 text-[11px] rounded-lg"
                  />
                </div>
              </div>

              {/* Dot Color Picker */}
              <div className="space-y-2">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">
                  <Palette className="h-3.5 w-3.5" />
                  Customize Dot Color
                </span>

                {/* Preset Colors Grid */}
                <div className="grid grid-cols-6 gap-2.5 p-3 rounded-xl border border-border bg-muted/10">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      onClick={() => setColor(presetColor)}
                      className={`h-7 w-7 rounded-full cursor-pointer transition-all relative flex items-center justify-center hover:scale-105 active:scale-95`}
                      style={{ backgroundColor: presetColor }}
                    >
                      {color.toLowerCase() === presetColor.toLowerCase() && (
                        <span className="absolute h-2 w-2 rounded-full bg-white shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Color Hex Input */}
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg border border-border shrink-0 shadow-2xs"
                    style={{ backgroundColor: color }}
                  />
                  <Input
                    type="text"
                    placeholder="Or enter custom HEX (e.g. #FF0000)..."
                    value={customColor}
                    onChange={(e) => {
                      const val = e.target.value
                      setCustomColor(val)
                      if (val.match(/^#[0-9A-Fa-f]{6}$/) || val.match(/^#[0-9A-Fa-f]{3}$/)) {
                        setColor(val)
                      }
                    }}
                    className="h-8 text-[11px] rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Form Controls */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                {!isCreate ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-9 px-3 rounded-xl text-destructive hover:bg-destructive/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete List
                  </button>
                ) : (
                  <div /> /* Empty placeholder for alignment */
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    className="h-9 px-4 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isCreate ? "Create List" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
