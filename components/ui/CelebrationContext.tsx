"use client"

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react"

interface CelebrationContextType {
  triggerCelebration: (x?: number, y?: number) => void
}

const CelebrationContext = createContext<CelebrationContextType | null>(null)

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  shape: "circle" | "square" | "triangle"
  rotation: number
  rotationSpeed: number
  opacity: number
  decay: number
}

const PALETTE = [
  "#10B981", // Emerald Green
  "#F59E0B", // Amber Orange
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EF4444", // Red
  "#14B8A6", // Teal
]

export function playCompleteSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    
    // Resume context if suspended (browser security)
    if (ctx.state === "suspended") {
      ctx.resume()
    }

    const now = ctx.currentTime

    // First oscillator - High harmonic bell chime (D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(587.33, now) // D5
    
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.02)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    
    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    // Second oscillator - Perfect fifth chime (A5), slightly delayed and louder for a rich ring
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(880.00, now + 0.06) // A5
    
    gain2.gain.setValueAtTime(0, now + 0.06)
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
    
    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    // Playback control
    osc1.start(now)
    osc1.stop(now + 0.35)
    
    osc2.start(now + 0.06)
    osc2.stop(now + 0.55)
  } catch (err) {
    console.warn("Failed to play task completion chime:", err)
  }
}

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameIdRef = useRef<number | null>(null)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [resizeCanvas])

  const createBurst = (x: number, y: number, count = 35) => {
    const particles = particlesRef.current
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 8
      const size = 6 + Math.random() * 8
      const shape = ["circle", "square", "triangle"][Math.floor(Math.random() * 3)] as Particle["shape"]
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1 + Math.random() * 3), // slight upward bias
        size,
        color,
        shape,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        decay: 0.015 + Math.random() * 0.015,
      })
    }
  }

  const createCornerShowers = () => {
    const particles = particlesRef.current
    const w = window.innerWidth
    const h = window.innerHeight

    // Left Corner shooting right-up
    for (let i = 0; i < 40; i++) {
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.3
      const speed = 12 + Math.random() * 10
      const size = 6 + Math.random() * 10
      const shape = ["circle", "square", "triangle"][Math.floor(Math.random() * 3)] as Particle["shape"]
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]

      particles.push({
        x: 0,
        y: h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        shape,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        decay: 0.01 + Math.random() * 0.01,
      })
    }

    // Right Corner shooting left-up
    for (let i = 0; i < 40; i++) {
      const angle = -Math.PI * 3 / 4 + (Math.random() - 0.5) * 0.3
      const speed = 12 + Math.random() * 10
      const size = 6 + Math.random() * 10
      const shape = ["circle", "square", "triangle"][Math.floor(Math.random() * 3)] as Particle["shape"]
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]

      particles.push({
        x: w,
        y: h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        shape,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        decay: 0.01 + Math.random() * 0.01,
      })
    }
  }

  const animationLoop = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const particles = particlesRef.current
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]

      // Apply physics
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.28 // Gravity
      p.vx *= 0.985 // Air drag
      p.vy *= 0.985
      p.rotation += p.rotationSpeed
      p.opacity -= p.decay

      // Remove dead particles
      if (p.opacity <= 0 || p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
        particles.splice(i, 1)
        continue
      }

      // Draw particle
      ctx.save()
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.strokeStyle = p.color
      ctx.lineWidth = 1.5
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)

      if (p.shape === "circle") {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.shape === "triangle") {
        ctx.beginPath()
        ctx.moveTo(0, -p.size / 2)
        ctx.lineTo(p.size / 2, p.size / 2)
        ctx.lineTo(-p.size / 2, p.size / 2)
        ctx.closePath()
        ctx.fill()
      } else {
        // Square
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      }

      ctx.restore()
    }

    if (particles.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animationLoop)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      animationFrameIdRef.current = null
    }
  }

  const triggerCelebration = useCallback((x?: number, y?: number) => {
    // 1. Play synthesized double chime chime sound
    playCompleteSound()

    // 2. Trigger appropriate canvas particle physics burst
    if (x !== undefined && y !== undefined) {
      // Localized pop at coordinates
      createBurst(x, y, 40)
    } else {
      // General full-screen corner showers
      createCornerShowers()
    }

    // 3. Kickoff animation loop if not already running
    if (!animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animationLoop)
    }
  }, [])

  return (
    <CelebrationContext.Provider value={{ triggerCelebration }}>
      {children}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    </CelebrationContext.Provider>
  )
}

export function useCelebration() {
  const context = useContext(CelebrationContext)
  if (!context) {
    throw new Error("useCelebration must be used within a CelebrationProvider")
  }
  return context
}
