"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Home, 
  Target, 
  Brain, 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  Award, 
  Settings, 
  Menu, 
  X, 
  ChevronLeft,
  Sparkles,
  GraduationCap
} from "lucide-react"

interface MobileNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "quests", label: "Quests", icon: Target },
    { id: "assessment", label: "Assessment", icon: Brain },
    { id: "diary", label: "Journal", icon: BookOpen },
    { id: "training", label: "EI Course", icon: GraduationCap, href: "/training" },
    { id: "ai-tools", label: "AI Tools", icon: Sparkles, href: "/ai-tools" },
    { id: "reflection", label: "Reflection", icon: Brain, href: "/reflection" },
    { id: "counselor", label: "AI Counselor", icon: MessageSquare, href: "/counselor" },
    { id: "stats", label: "EI Stats", icon: Brain },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "achievements", label: "Achievements", icon: Award, href: "/achievements" },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  // Primary tabs for bottom nav (4 most used)
  const primaryTabs = tabs.slice(0, 4)

  useEffect(() => {
    setMounted(true)

    const checkMobile = () => {
      if (typeof window === "undefined") return
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [])

  const handleTabChange = (tabId: string) => {
    // Check if this tab has an external href
    const tab = tabs.find(t => t.id === tabId)
    if (tab && 'href' in tab && tab.href) {
      window.location.href = tab.href
      return
    }
    
    onTabChange(tabId)
    setIsMenuOpen(false)

    // Haptic feedback for mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  // Desktop tabs to show (expanded to include EI Stats and Analytics)
  const desktopTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "quests", label: "Quests" },
    { id: "assessment", label: "Assessment" },
    { id: "diary", label: "Journal" },
    { id: "training", label: "EI Course", href: "/training" },
    { id: "ai-tools", label: "AI Tools", href: "/ai-tools" },
    { id: "reflection", label: "Reflection", href: "/reflection" },
    { id: "counselor", label: "AI Counselor", href: "/counselor" },
    { id: "achievements", label: "Achievements", href: "/achievements" },
    { id: "stats", label: "EI Stats" },
    { id: "analytics", label: "Analytics" },
    { id: "settings", label: "Settings" },
  ]

  // Return desktop layout during SSR
  if (!mounted) {
    return (
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <span className="text-xl font-bold text-teal-600">SoloLvlUp</span>
            <div className="flex items-center gap-6">
              {desktopTabs.map(({ id, label, href }) => (
                <button
                  key={id}
                  onClick={() => href ? window.location.href = href : handleTabChange(id)}
                  className={`text-sm font-medium transition-colors ${
                    activeTab === id
                      ? "text-teal-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Desktop navigation - Clean top navbar like reference
  if (!isMobile) {
    return (
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <span className="text-xl font-bold text-teal-600">SoloLvlUp</span>
            <div className="flex items-center gap-6">
              {desktopTabs.map(({ id, label, href }) => (
                <button
                  key={id}
                  onClick={() => href ? window.location.href = href : handleTabChange(id)}
                  className={`text-sm font-medium transition-colors ${
                    activeTab === id
                      ? "text-teal-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Mobile navigation
  const currentTab = tabs.find((tab) => tab.id === activeTab)

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          {activeTab !== "dashboard" ? (
            <button
              onClick={() => handleTabChange("dashboard")}
              className="flex items-center gap-1 text-teal-600 text-sm font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          ) : (
            <span className="text-lg font-bold text-teal-600">SoloLvlUp</span>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Mobile Slide-Out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-72 z-50 bg-white shadow-xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-teal-600">Menu</span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === id
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-pb">
        <div className="grid grid-cols-4 h-16">
          {primaryTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === id
                  ? "text-teal-600"
                  : "text-gray-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
