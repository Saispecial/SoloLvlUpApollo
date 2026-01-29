"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SplashCursorProps {
  color?: string
  size?: number
}

interface Splash {
  id: number
  x: number
  y: number
}

export function SplashCursor({ color = "#00ffff", size = 20 }: SplashCursorProps) {
  const [splashes, setSplashes] = useState<Splash[]>([])

  useEffect(() => {
    let splashId = 0

    const handleClick = (e: MouseEvent) => {
      const newSplash: Splash = {
        id: splashId++,
        x: e.clientX,
        y: e.clientY,
      }

      setSplashes((prev) => [...prev, newSplash])

      // Remove splash after animation
      setTimeout(() => {
        setSplashes((prev) => prev.filter((splash) => splash.id !== newSplash.id))
      }, 600)
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {splashes.map((splash) => (
          <motion.div
            key={splash.id}
            className="absolute rounded-full"
            style={{
              left: splash.x - size / 2,
              top: splash.y - size / 2,
              width: size,
              height: size,
              backgroundColor: color,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
