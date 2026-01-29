"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface StarBorderProps {
  children: ReactNode
  className?: string
  speed?: number
  starColor?: string
}

export function StarBorder({ children, className = "", speed = 2, starColor = "#00ffff" }: StarBorderProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${starColor}, transparent)`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: speed,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <div className="absolute inset-[2px] rounded-lg bg-gray-900/90 backdrop-blur-sm" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
