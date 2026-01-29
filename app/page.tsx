"use client"

import React, { useRef, createContext } from "react"
import Dashboard from "@/components/dashboard"

export const DashboardRefContext = createContext<any>(null)

export default function Home() {
  const dashboardRef = useRef<any>(null)
  return (
    <DashboardRefContext.Provider value={dashboardRef}>
      <main className="min-h-screen bg-[#F0FDFA]">
        <Dashboard ref={dashboardRef} />
      </main>
    </DashboardRefContext.Provider>
  )
}
