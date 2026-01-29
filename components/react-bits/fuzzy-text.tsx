"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface FuzzyTextProps {
  text: string
  className?: string
  duration?: number
  trigger?: boolean
}

export function FuzzyText({ text, className = "", duration = 2000, trigger = true }: FuzzyTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isAnimating, setIsAnimating] = useState(false)

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"

  useEffect(() => {
    if (!trigger) return

    setIsAnimating(true)
    let iteration = 0
    const originalText = text

    const interval = setInterval(() => {
      setDisplayText((prev) =>
        originalText
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return originalText[index]
            }
            return characters[Math.floor(Math.random() * characters.length)]
          })
          .join(""),
      )

      if (iteration >= originalText.length) {
        clearInterval(interval)
        setIsAnimating(false)
      }

      iteration += 1 / 3
    }, 30)

    return () => clearInterval(interval)
  }, [text, trigger, characters])

  return (
    <motion.span
      className={`font-mono ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayText}
    </motion.span>
  )
}
