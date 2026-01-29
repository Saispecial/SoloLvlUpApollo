"use client"

import { useEffect, useState } from "react"
import { useNurseStore } from "@/stores/nurse-store"

/**
 * Hook to ensure store hydration from localStorage is complete
 * Prevents hydration mismatches and ensures data is available immediately
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const hydrateAsync = async () => {
      try {
        // Wait for any pending Zustand hydration to complete
        if (useNurseStore.persist?.rehydrate) {
          await useNurseStore.persist.rehydrate()
        }

        // Small delay to ensure store is fully updated
        await new Promise((resolve) => setTimeout(resolve, 50))

        // Verify data is actually in localStorage
        if (typeof window !== "undefined") {
          const storedData = localStorage.getItem("nurse-store")
          if (storedData) {
            const parsed = JSON.parse(storedData)
            console.log("[useHydration] Storage data found:", {
              modules: parsed.state?.trainingModules?.length || 0,
              completed: parsed.state?.completedModules?.length || 0,
            })
          }
        }

        // Verify store state
        const storeState = useNurseStore.getState()
        console.log("[useHydration] Store state verified:", {
          trainingModules: storeState.trainingModules?.length || 0,
          completedModules: storeState.completedModules?.length || 0,
        })

        setIsHydrated(true)
      } catch (error) {
        console.error("[useHydration] Hydration error:", error)
        setIsHydrated(true)
      }
    }

    hydrateAsync()
  }, [])

  return isHydrated
}

/**
 * Preload persisted state synchronously on app initialization
 * Call this in layout or before hydration to ensure storage is ready
 */
export function preloadStorageSync(): boolean {
  if (typeof window === "undefined") return false

  try {
    const storedData = localStorage.getItem("nurse-store")
    if (storedData) {
      console.log("[preloadStorageSync] Storage data preloaded")
      return true
    }
  } catch (error) {
    console.error("[preloadStorageSync] Error preloading storage:", error)
  }
  return false
}
