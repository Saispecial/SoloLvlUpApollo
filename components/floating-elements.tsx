"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface FloatingElementsProps {
  count?: number
  className?: string
}

export function FloatingElements({ count = 20, className = "" }: FloatingElementsProps) {
  const [elements, setElements] = useState<Array<{ id: number; left: number; top: number; delay: number; duration: number }>>([])

  useEffect(() => {
    setElements(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: Math.random() * 3 + 2,
      }))
    )
  }, [count])

  return (
    <div className={`fixed inset-0 pointer-events-none z-10 ${className}`}>
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
          style={{
            left: `${el.left}%`,
            top: `${el.top}%`,
          }}
          animate={{
            x: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200],
            y: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200],
            scale: [0.5, 1.5, 0.5],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: el.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: el.delay,
          }}
        />
      ))}
    </div>
  )
}
