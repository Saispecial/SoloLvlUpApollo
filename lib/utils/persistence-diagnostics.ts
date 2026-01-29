"use client"

/**
 * Diagnostic utilities for debugging localStorage persistence issues
 * Use this to verify that data is being saved and restored correctly
 */

export function diagnoseStoragePersistence() {
  if (typeof window === "undefined") {
    console.log("[PersistenceDiagnostics] Running on server - skipping diagnostics")
    return
  }

  console.group("[PersistenceDiagnostics] Storage Diagnosis")

  // 1. Check if localStorage is available
  const storageAvailable = checkStorageAvailable()
  console.log("✓ localStorage available:", storageAvailable)

  // 2. Check nurse-store data
  const nurseStoreData = getStorageData("nurse-store")
  console.log("✓ nurse-store key exists:", !!nurseStoreData)
  if (nurseStoreData) {
    console.log("  - Size:", formatBytes(JSON.stringify(nurseStoreData).length))
    console.log("  - Training modules:", nurseStoreData.state?.trainingModules?.length || 0)
    console.log("  - Completed modules:", nurseStoreData.state?.completedModules?.length || 0)
    console.log("  - Nurse name:", nurseStoreData.state?.nurse?.name || "Unknown")
  }

  // 3. Check for legacy player-store data
  const playerStoreData = getStorageData("player-store")
  console.log("✓ Legacy player-store exists:", !!playerStoreData)
  if (playerStoreData) {
    console.log("  - Size:", formatBytes(JSON.stringify(playerStoreData).length))
    console.log("  - Quests:", playerStoreData.state?.quests?.length || 0)
    console.log("  - Completed quests:", playerStoreData.state?.completedQuests?.length || 0)
  }

  // 4. Check other manual snapshots
  const manualSnapshot = getStorageData("nurse-store-manual-snapshot")
  console.log("✓ Manual snapshot exists:", !!manualSnapshot)
  if (manualSnapshot) {
    console.log("  - Timestamp:", manualSnapshot.at)
    console.log("  - Training modules:", manualSnapshot.trainingModules)
  }

  // 5. Check available localStorage keys
  const allKeys = getAllStorageKeys()
  console.log("✓ All localStorage keys:", allKeys.length)
  if (allKeys.length > 0) {
    allKeys.forEach((key) => {
      const data = localStorage.getItem(key)
      const size = data ? formatBytes(data.length) : "0 B"
      console.log(`  - ${key}: ${size}`)
    })
  }

  // 6. Check total storage usage
  const totalSize = calculateTotalStorageSize()
  console.log("✓ Total storage used:", formatBytes(totalSize))

  console.groupEnd()
}

/**
 * Test if localStorage is writable and readable
 */
export function testStorageWriteRead(): boolean {
  if (typeof window === "undefined") return false

  try {
    const testKey = "__persistence-test__"
    const testValue = { test: "data", timestamp: Date.now() }

    // Write
    localStorage.setItem(testKey, JSON.stringify(testValue))

    // Read
    const retrieved = localStorage.getItem(testKey)
    if (!retrieved) {
      console.error("[PersistenceDiagnostics] Failed to read test data")
      return false
    }

    // Verify
    const parsed = JSON.parse(retrieved)
    if (parsed.test !== "data") {
      console.error("[PersistenceDiagnostics] Data mismatch after write/read")
      return false
    }

    // Clean up
    localStorage.removeItem(testKey)

    console.log("[PersistenceDiagnostics] Storage write/read test: PASSED")
    return true
  } catch (error) {
    console.error("[PersistenceDiagnostics] Storage write/read test: FAILED", error)
    return false
  }
}

/**
 * Clear corrupted storage and preserve valid data
 */
export function clearCorruptedStorage() {
  if (typeof window === "undefined") return

  try {
    const nurseStoreData = getStorageData("nurse-store")

    if (!nurseStoreData) {
      console.log("[PersistenceDiagnostics] No nurse-store data to preserve")
    }

    // Try to load and validate the data
    if (nurseStoreData?.state) {
      console.log("[PersistenceDiagnostics] Nurse store data is valid, preserving...")
    } else {
      console.log("[PersistenceDiagnostics] Clearing corrupted nurse-store")
      localStorage.removeItem("nurse-store")
    }

    // Clear temp keys
    const tempKeys = ["nurse-store-manual-snapshot", "__persistence-test__"]
    tempKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log(`[PersistenceDiagnostics] Cleared temporary key: ${key}`)
      }
    })
  } catch (error) {
    console.error("[PersistenceDiagnostics] Error clearing storage:", error)
  }
}

/**
 * Migrate old player-store to new nurse-store manually
 */
export function migratePlayerStoreToNurseStore() {
  if (typeof window === "undefined") return false

  try {
    const playerStoreData = getStorageData("player-store")

    if (!playerStoreData) {
      console.log("[PersistenceDiagnostics] No player-store found to migrate")
      return false
    }

    // Check if nurse-store already exists
    const nurseStoreData = getStorageData("nurse-store")
    if (nurseStoreData?.state?.trainingModules?.length > 0) {
      console.log("[PersistenceDiagnostics] Nurse store already has data, skipping migration")
      return false
    }

    // Perform migration
    const migratedData = {
      state: {
        nurse: playerStoreData.state?.player || {},
        trainingModules: playerStoreData.state?.quests || [],
        completedModules: playerStoreData.state?.completedQuests || [],
        milestones: playerStoreData.state?.achievements || [],
        reflections: playerStoreData.state?.reflections || [],
        diaryEntries: playerStoreData.state?.diaryEntries || [],
        detailedTracking: playerStoreData.state?.detailedTracking || {},
      },
      version: 1,
    }

    localStorage.setItem("nurse-store", JSON.stringify(migratedData))
    console.log("[PersistenceDiagnostics] Migration complete!")
    console.log("  - Migrated modules:", migratedData.state.trainingModules.length)
    console.log("  - Migrated completed modules:", migratedData.state.completedModules.length)

    return true
  } catch (error) {
    console.error("[PersistenceDiagnostics] Migration failed:", error)
    return false
  }
}

// Helper functions

function checkStorageAvailable(): boolean {
  try {
    const test = "__storage-test__"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

function getStorageData(key: string) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error(`[PersistenceDiagnostics] Failed to parse ${key}:`, error)
    return null
  }
}

function getAllStorageKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) keys.push(key)
  }
  return keys
}

function calculateTotalStorageSize(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const item = localStorage.getItem(key)
      total += (item?.length || 0) + (key.length || 0)
    }
  }
  return total
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}
