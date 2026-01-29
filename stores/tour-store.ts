"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type TourStep = {
  id: string
  route: string
  text: string
  animation: string // e.g., 'talking', 'pointing', 'waving'
  duration?: number // duration in ms, or auto-calc based on text length
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    route: "/",
    text: "Welcome to your Dashboard! This is your central hub where you can see your daily progress, active quests, and quick stats. I'll be your guide, Nuusa.",
    animation: "talking"
  },
  {
    id: "quests",
    route: "/?tab=quests",
    text: "This is the Quest page. Here you can find daily challenges to improve your skills and earn rewards. Completing quests helps you level up!",
    animation: "talking"
  },
  {
    id: "assessment",
    route: "/assessment",
    text: "This is the Assessment page. Here you can take various assessments to track your emotional intelligence and professional growth.",
    animation: "talking"
  },
  {
    id: "journal",
    route: "/?tab=diary",
    text: "This is your Journal. It's a safe space to record your thoughts and feelings. I can help you analyze them later.",
    animation: "talking"
  },
  {
    id: "counselor",
    route: "/counselor",
    text: "This is the AI Counselor page. I'm here to listen and chat with you about anything on your mind. I can provide support and guidance.",
    animation: "talking"
  },
  {
    id: "ai-tools",
    route: "/ai-tools",
    text: "Here are the AI Tools. These specialized tools help with specific needs like burnout detection, emotional analysis, and more.",
    animation: "talking"
  },
  {
    id: "reflection",
    route: "/reflection",
    text: "This is the Reflection page. Take a moment to reflect on your day. Regular reflection boosts self-awareness.",
    animation: "talking"
  },
  {
    id: "stats",
    route: "/?tab=analytics",
    text: "These are your EI Stats and Analytics. Track your long-term progress and see how your emotional intelligence competencies are growing.",
    animation: "talking"
  },
  {
    id: "achievements",
    route: "/achievements", // Need to verify if this route exists, using /achievements based on user request "atchivments"
    text: "And finally, your Achievements! Celebrate your milestones and badges here as you progress in your journey.",
    animation: "talking"
  }
]

interface TourStore {
  isTourActive: boolean
  currentStepIndex: number
  showNewUserPopup: boolean
  hasSeenTour: boolean
  
  // Actions
  startTour: () => void
  endTour: () => void
  nextStep: () => void
  prevStep: () => void
  setShowNewUserPopup: (show: boolean) => void
  setHasSeenTour: (seen: boolean) => void
  resetTour: () => void
}

export const useTourStore = create<TourStore>()(
  persist(
    (set, get) => ({
      isTourActive: false,
      currentStepIndex: 0,
      showNewUserPopup: false,
      hasSeenTour: false,

      startTour: () => {
        set({ isTourActive: true, currentStepIndex: 0, showNewUserPopup: false })
      },

      endTour: () => {
        set({ isTourActive: false, currentStepIndex: 0, hasSeenTour: true })
      },

      nextStep: () => {
        const { currentStepIndex } = get()
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 })
        } else {
          get().endTour()
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get()
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 })
        }
      },

      setShowNewUserPopup: (show: boolean) => {
        set({ showNewUserPopup: show })
      },

      setHasSeenTour: (seen: boolean) => {
        set({ hasSeenTour: seen })
      },

      resetTour: () => {
        set({ isTourActive: false, currentStepIndex: 0, showNewUserPopup: false, hasSeenTour: false })
      },
    }),
    {
      name: "tour-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
