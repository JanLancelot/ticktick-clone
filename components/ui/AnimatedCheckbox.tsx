"use client"

import React from "react"

interface AnimatedCheckboxProps {
  completed: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  priority?: "HIGH" | "MEDIUM" | "LOW" | "NONE"
}

export function AnimatedCheckbox({ completed, onClick, priority = "NONE" }: AnimatedCheckboxProps) {
  const getCheckboxStyle = () => {
    if (completed) {
      return "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
    }
    
    switch (priority) {
      case "HIGH":
        return "border-red-500 hover:bg-red-500/10 hover:border-red-600 text-red-500"
      case "MEDIUM":
        return "border-amber-500 hover:bg-amber-500/10 hover:border-amber-600 text-amber-500"
      case "LOW":
        return "border-blue-500 hover:bg-blue-500/10 hover:border-blue-600 text-blue-500"
      default:
        return "border-neutral-300 dark:border-neutral-700 hover:border-primary hover:bg-primary/5 text-transparent hover:text-primary/30"
    }
  }

  return (
    <button
      onClick={onClick}
      className={`group flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-300 ease-out cursor-pointer outline-none focus:outline-none focus:ring-0 select-none active:scale-90 hover:scale-110 shrink-0 ${getCheckboxStyle()}`}
      title={completed ? "Mark Incomplete" : "Mark Complete"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-3 h-3 transition-transform duration-300 ${completed ? "scale-100" : "scale-75 group-hover:scale-90"}`}
      >
        <polyline
          points="20 6 9 17 4 12"
          style={{
            strokeDasharray: 22,
            strokeDashoffset: completed ? 0 : 22,
            transition: "stroke-dashoffset 0.25s cubic-bezier(0.4, 0, 0.2, 1) 0.05s",
          }}
        />
      </svg>
    </button>
  )
}
