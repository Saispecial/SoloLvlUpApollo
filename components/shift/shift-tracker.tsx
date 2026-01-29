"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, Activity, AlertCircle } from "lucide-react"
import type { ShiftContext } from "@/lib/types"

interface ShiftTrackerProps {
  onShiftStart?: (context: ShiftContext) => void
  onShiftEnd?: (context: ShiftContext) => void
  currentShift?: ShiftContext | null
}

export function ShiftTracker({ onShiftStart, onShiftEnd, currentShift }: ShiftTrackerProps) {
  const [shiftContext, setShiftContext] = useState<Partial<ShiftContext>>({
    shiftType: "day",
    department: "General",
    workloadIntensity: "moderate",
    criticalIncidentOccurred: false,
    shiftStart: new Date(),
  })

  const handleStartShift = () => {
    const context: ShiftContext = {
      shiftType: shiftContext.shiftType ?? "day",
      department: shiftContext.department ?? "General",
      workloadIntensity: shiftContext.workloadIntensity ?? "moderate",
      criticalIncidentOccurred: shiftContext.criticalIncidentOccurred ?? false,
      shiftStart: new Date(),
    }

    if (onShiftStart) {
      onShiftStart(context)
    }

    // Store in localStorage
    localStorage.setItem("current-shift", JSON.stringify(context))
  }

  const handleEndShift = () => {
    if (!currentShift) return

    const endedShift: ShiftContext = {
      ...currentShift,
      shiftEnd: new Date(),
    }

    if (onShiftEnd) {
      onShiftEnd(endedShift)
    }

    // Save shift history
    const shiftHistory = JSON.parse(localStorage.getItem("shift-history") || "[]")
    shiftHistory.push(endedShift)
    localStorage.setItem("shift-history", JSON.stringify(shiftHistory))
    localStorage.removeItem("current-shift")
  }

  if (currentShift) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Current Shift Active</CardTitle>
                <CardDescription>
                  {currentShift.shiftType} shift • {currentShift.department}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleEndShift} variant="outline" size="sm">
              End Shift
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-foreground/60" />
            <span>
              Workload: <strong className="capitalize">{currentShift.workloadIntensity}</strong>
            </span>
          </div>
          {currentShift.criticalIncidentOccurred && (
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertCircle className="w-4 h-4" />
              <span>Critical incident occurred during this shift</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Start Your Shift
        </CardTitle>
        <CardDescription>
          Track your shift context to get personalized EI recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Shift Type</label>
          <Select
            value={shiftContext.shiftType}
            onValueChange={(value: any) =>
              setShiftContext({ ...shiftContext, shiftType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shift type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day Shift</SelectItem>
              <SelectItem value="night">Night Shift</SelectItem>
              <SelectItem value="ICU">ICU Shift</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Department
          </label>
          <Select
            value={shiftContext.department}
            onValueChange={(value: any) =>
              setShiftContext({ ...shiftContext, department: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ICU">ICU</SelectItem>
              <SelectItem value="Pediatrics">Pediatrics</SelectItem>
              <SelectItem value="ER">Emergency Room</SelectItem>
              <SelectItem value="Oncology">Oncology</SelectItem>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Expected Workload Intensity
          </label>
          <Select
            value={shiftContext.workloadIntensity}
            onValueChange={(value: any) =>
              setShiftContext({ ...shiftContext, workloadIntensity: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select workload" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleStartShift} className="w-full bg-warm-gradient-teal text-white">
          Start Shift Tracking
        </Button>
      </CardContent>
    </Card>
  )
}
