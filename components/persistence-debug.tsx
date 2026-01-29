"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNurseStore } from "@/stores/nurse-store"
import {
  diagnoseStoragePersistence,
  testStorageWriteRead,
  clearCorruptedStorage,
  migratePlayerStoreToNurseStore,
} from "@/lib/utils/persistence-diagnostics"

export function PersistenceDebug() {
  const { trainingModules, completedModules, nurse, forceSave, verifyPersistence } = useNurseStore()
  const [persistenceData, setPersistenceData] = useState<any>(null)
  const [rawStorage, setRawStorage] = useState<{ hasKey: boolean; rawLength: number; preview: string } | null>(null)
  const [manualStorage, setManualStorage] = useState<{ hasKey: boolean; rawLength: number } | null>(null)
  const [storageTest, setStorageTest] = useState<boolean | null>(null)
  
  useEffect(() => {
    // Verify persistence on component mount
    const data = verifyPersistence()
    setPersistenceData(data)

    // Test if storage is working
    const canWrite = testStorageWriteRead()
    setStorageTest(canWrite)

    // Also inspect raw localStorage payload
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("nurse-store")
      setRawStorage({
        hasKey: raw != null,
        rawLength: raw?.length ?? 0,
        preview: raw ? raw.slice(0, 160) : "",
      })

      const manual = localStorage.getItem("nurse-store-manual-snapshot")
      setManualStorage({
        hasKey: manual != null,
        rawLength: manual?.length ?? 0,
      })
    }
  }, [verifyPersistence])

  // Manual snapshot fallback: proves whether localStorage is writable + state is changing
  useEffect(() => {
    if (typeof window === "undefined") return

    const unsub = useNurseStore.subscribe((state) => {
      try {
        const snapshot = {
          at: new Date().toISOString(),
          trainingModules: state.trainingModules?.length ?? 0,
          completedModules: state.completedModules?.length ?? 0,
          nurseName: state.nurse?.name ?? "",
        }
        localStorage.setItem("nurse-store-manual-snapshot", JSON.stringify(snapshot))
        setManualStorage({ hasKey: true, rawLength: JSON.stringify(snapshot).length })
      } catch (e) {
        console.error("[PersistenceDebug] manual snapshot failed:", e)
      }
    })

    return () => unsub()
  }, [])
  
  const handleVerifyPersistence = () => {
    const data = verifyPersistence()
    setPersistenceData(data)
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("nurse-store")
      setRawStorage({
        hasKey: raw != null,
        rawLength: raw?.length ?? 0,
        preview: raw ? raw.slice(0, 160) : "",
      })
      const manual = localStorage.getItem("nurse-store-manual-snapshot")
      setManualStorage({
        hasKey: manual != null,
        rawLength: manual?.length ?? 0,
      })
    }
  }
  
  const handleForceSave = () => {
    forceSave()
    setTimeout(() => {
      const data = verifyPersistence()
      setPersistenceData(data)
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("nurse-store")
        setRawStorage({
          hasKey: raw != null,
          rawLength: raw?.length ?? 0,
          preview: raw ? raw.slice(0, 160) : "",
        })
        const manual = localStorage.getItem("nurse-store-manual-snapshot")
        setManualStorage({
          hasKey: manual != null,
          rawLength: manual?.length ?? 0,
        })
      }
    }, 100)
  }
  
  const handleClearStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nurse-store")
      setPersistenceData(null)
      window.location.reload()
    }
  }

  const handleDiagnose = () => {
    console.clear()
    diagnoseStoragePersistence()
  }

  const handleMigration = () => {
    const success = migratePlayerStoreToNurseStore()
    if (success) {
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      alert("No legacy data to migrate")
    }
  }

  const handleClearCorrupted = () => {
    clearCorruptedStorage()
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
  
  return (
    <Card className="mb-4 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm text-blue-800">🔧 Persistence Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Current State:</strong>
            <div>Training Modules: {trainingModules.length}</div>
            <div>Completed Modules: {completedModules.length}</div>
            <div>Nurse: {nurse.name}</div>
            <div>Program: {nurse.activeProgramId || "None"}</div>
          </div>
          <div>
            <strong>Persisted State:</strong>
            <div>Training Modules: {persistenceData?.trainingModules?.length || 0}</div>
            <div>Completed Modules: {persistenceData?.completedModules?.length || 0}</div>
            <div>Nurse: {persistenceData?.nurse?.name || "Unknown"}</div>
            <div>Program: {persistenceData?.nurse?.activeProgramId || "None"}</div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleVerifyPersistence}>
            Check Storage
          </Button>
          <Button size="sm" onClick={handleForceSave}>
            Force Save
          </Button>
          <Button size="sm" onClick={handleDiagnose}>
            Full Diagnosis
          </Button>
          <Button size="sm" onClick={handleMigration} variant="outline">
            Migrate Legacy
          </Button>
          <Button size="sm" variant="destructive" onClick={handleClearStorage}>
            Clear Storage
          </Button>
          <Button size="sm" variant="outline" onClick={handleClearCorrupted}>
            Clear Corrupted
          </Button>
        </div>

        {storageTest !== null && (
          <div className={`text-xs p-2 rounded ${storageTest ? "bg-green-100" : "bg-red-100"}`}>
            <strong>Storage Test:</strong> {storageTest ? "✅ PASS - localStorage working" : "❌ FAIL - localStorage issue detected"}
          </div>
        )}
        
        {persistenceData && (
          <div className="text-xs bg-gray-100 p-2 rounded">
            <strong>Storage Status:</strong> {persistenceData ? "✅ Data Found" : "❌ No Data"}
          </div>
        )}

        {rawStorage && (
          <div className="text-xs bg-gray-50 p-2 rounded border">
            <div>
              <strong>Raw localStorage:</strong>{" "}
              {rawStorage.hasKey ? `✅ nurse-store present (${rawStorage.rawLength} chars)` : "❌ nurse-store key missing"}
            </div>
            {rawStorage.hasKey && (
              <div className="mt-1 font-mono break-all opacity-80">
                {rawStorage.preview}
                {rawStorage.rawLength > 160 ? "…" : ""}
              </div>
            )}
          </div>
        )}

        {manualStorage && (
          <div className="text-xs bg-gray-50 p-2 rounded border">
            <div>
              <strong>Manual snapshot:</strong>{" "}
              {manualStorage.hasKey
                ? `✅ nurse-store-manual-snapshot present (${manualStorage.rawLength} chars)`
                : "❌ nurse-store-manual-snapshot missing"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
