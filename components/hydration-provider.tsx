"use client"

import { useEffect, useState, ReactNode } from "react"
import { useAppStore } from "@/stores/app-store"

interface HydrationProviderProps {
  children: ReactNode
}

/**
 * HydrationProvider ensures that Zustand persist middleware is fully hydrated
 * before rendering child components. This prevents hydration mismatches and 
 * ensures localStorage data is immediately available.
 */
export function HydrationProvider({ children }: HydrationProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // On client mount, force hydration of persisted state
    const hydrateStore = async () => {
      try {
        // Check if data exists in localStorage first
        if (typeof window !== "undefined") {
          const storedData = localStorage.getItem("ei-nurse-app-storage")
          
          if (storedData) {
            try {
              const parsed = JSON.parse(storedData)
              console.log("[HydrationProvider] Data found in localStorage:", {
                hasState: !!parsed.state,
                modules: parsed.state?.trainingModules?.length || 0,
                completed: parsed.state?.completedModules?.length || 0,
                nurseName: parsed.state?.nurse?.name || "Unknown",
              })
            } catch (parseError) {
              console.error("[HydrationProvider] Failed to parse localStorage data:", parseError)
              // Clear corrupted data
              localStorage.removeItem("ei-nurse-app-storage")
            }
          } else {
            console.log("[HydrationProvider] No persisted data found in localStorage - store will use defaults")
          }
        }

        // Explicitly trigger Zustand's rehydration
        if (useAppStore.persist?.rehydrate) {
          await useAppStore.persist.rehydrate()
          console.log("[HydrationProvider] Zustand rehydration triggered")
        }

        // Wait for the store to be ready
        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify store state after hydration
        const state = useAppStore.getState()
        console.log("[HydrationProvider] Store state after hydration:", {
          modules: state.trainingModules?.length || 0,
          completed: state.completedModules?.length || 0,
          nurseName: state.nurse?.name || "Unknown",
        })

        // Mark as hydrated and ready
        setIsHydrated(true)
      } catch (error) {
        console.error("[HydrationProvider] Hydration error:", error)
        // Still mark as hydrated to unblock UI, but log the error
        setIsHydrated(true)
      }
    }

    hydrateStore()
  }, [])

  // Don't render children until hydration is complete to prevent data loss
  if (!isHydrated) {
    return null
  }

  return <>{children}</>
}
