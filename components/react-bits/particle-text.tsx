"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface ParticleTextProps {
  text: string
  className?: string
  particleCount?: number
}

export function ParticleText({ text, className = "", particleCount = 50 }: ParticleTextProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
    setParticles(newParticles)
  }, [particleCount])

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: particle.id * 0.1,
            }}
          />
        ))}
      </div>
      <span className="relative z-10">{text}</span>
    </div>
  )
}
