"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function ResponsiveLayout({ children, sidebar, header, footer }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (typeof window === 'undefined') return

    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  // Return a default layout during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F0FDFA]">
        {header}
        <div className="flex">
          {sidebar && (
            <aside className="w-64 bg-white border-r border-gray-100 hidden lg:block">
              {sidebar}
            </aside>
          )}
          <main className="flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto px-4 py-6"
            >
              {children}
            </motion.div>
          </main>
        </div>
        {footer}
      </div>
    )
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#F0FDFA]">
        {header}
        <main className="pb-20">
          {children}
        </main>
        {footer}
      </div>
    )
  }

  // Tablet layout
  if (isTablet) {
    return (
      <div className="min-h-screen bg-[#F0FDFA]">
        {header}
        <div className="flex">
          {sidebar && (
            <aside className="w-56 bg-white border-r border-gray-100 shrink-0">
              {sidebar}
            </aside>
          )}
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
        {footer}
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {header}
      <div className="flex">
        {sidebar && (
          <aside className="w-64 bg-white border-r border-gray-100 shrink-0 min-h-[calc(100vh-56px)]">
            {sidebar}
          </aside>
        )}
        <main className="flex-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto px-6 py-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
      {footer}
    </div>
  )
}
