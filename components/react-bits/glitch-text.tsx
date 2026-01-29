"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface GlitchTextProps {
  text: string
  className?: string
  trigger?: boolean
}

export function GlitchText({ text, className = "", trigger = false }: GlitchTextProps) {
  const [glitchText, setGlitchText] = useState(text)

  useEffect(() => {
    if (!trigger) return

    const glitchChars = "!<>-_\\/[]{}—=+*^?#________"
    let iteration = 0

    const interval = setInterval(() => {
      setGlitchText((prev) =>
        text
          .split("")
          .map((char, index) => {
            if (index < iteration) {
              return text[index]
            }
            return glitchChars[Math.floor(Math.random() * glitchChars.length)]
          })
          .join(""),
      )

      if (iteration >= text.length) {
        clearInterval(interval)
        setGlitchText(text)
      }

      iteration += 1 / 3
    }, 50)

    return () => clearInterval(interval)
  }, [text, trigger])

  return (
    <motion.span
      className={`font-mono ${className}`}
      animate={trigger ? { x: [-1, 1, -1, 1, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      {glitchText}
    </motion.span>
  )
}
