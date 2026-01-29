"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  mobileClassName?: string
  desktopClassName?: string
  padding?: "sm" | "md" | "lg" | "none"
  hover?: boolean
}

export function ResponsiveCard({
  children,
  className = "",
  mobileClassName = "",
  desktopClassName = "",
  padding = "md",
  hover = false,
}: ResponsiveCardProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkDevice = () => {
      if (typeof window === 'undefined') return
      setIsMobile(window.innerWidth < 768)
    }

    checkDevice()
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", checkDevice)
      return () => window.removeEventListener("resize", checkDevice)
    }
  }, [])

  const paddingClasses = {
    none: "",
    sm: isMobile ? "p-3" : "p-4",
    md: isMobile ? "p-4" : "p-5",
    lg: isMobile ? "p-5" : "p-6",
  }

  const baseClasses = cn(
    "bg-white rounded-xl border border-gray-100 shadow-sm",
    paddingClasses[padding],
    hover && "transition-shadow hover:shadow-md",
    isMobile ? mobileClassName : desktopClassName,
    className
  )

  // Return a default card during SSR
  if (!mounted) {
    return (
      <motion.div
        className={cn(
          "bg-white rounded-xl border border-gray-100 shadow-sm p-5",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={baseClasses}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
