"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Heart, Shield, Phone } from "lucide-react"
import type { BurnoutRisk } from "@/lib/types"

interface BurnoutDetectorProps {
  emotionalState?: string
  motivationLevel?: number
  recentReflections?: any[]
  shiftContext?: any
}

export function BurnoutDetector({
  emotionalState = "",
  motivationLevel = 5,
  recentReflections = [],
  shiftContext,
}: BurnoutDetectorProps) {
  const [burnoutRisk, setBurnoutRisk] = useState<BurnoutRisk | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    detectBurnout()
  }, [emotionalState, motivationLevel, recentReflections, shiftContext])

  const detectBurnout = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/burnout-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emotionalState,
          motivationLevel,
          recentReflections,
          shiftContext,
        }),
      })
      const risk = await response.json()
      setBurnoutRisk(risk)
    } catch (error) {
      console.error("Error detecting burnout:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !burnoutRisk) {
    return null
  }

  if (burnoutRisk.level === "low") {
    return null
  }

  const getRiskColor = () => {
    switch (burnoutRisk.level) {
      case "moderate":
        return "warning"
      case "high":
        return "error"
      case "critical":
        return "error"
      default:
        return "warning"
    }
  }

  const getRiskPercentage = () => {
    switch (burnoutRisk.level) {
      case "moderate":
        return 40
      case "high":
        return 70
      case "critical":
        return 90
      default:
        return 0
    }
  }

  return (
    <Card className={`border-2 border-${getRiskColor()}/50 bg-${getRiskColor()}/5`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${getRiskColor()}/20`}>
            <AlertTriangle className={`w-5 h-5 text-${getRiskColor()}`} />
          </div>
          <div className="flex-1">
            <CardTitle className={`text-${getRiskColor()}`}>
              Burnout Risk: {burnoutRisk.level.toUpperCase()}
            </CardTitle>
            <CardDescription>Based on your recent emotional patterns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Risk Level</span>
            <span className="font-semibold capitalize">{burnoutRisk.level}</span>
          </div>
          <Progress value={getRiskPercentage()} className="h-2" />
        </div>

        {burnoutRisk.indicators.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Detected Indicators:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/70">
              {burnoutRisk.indicators.map((indicator, idx) => (
                <li key={idx}>{indicator}</li>
              ))}
            </ul>
          </div>
        )}

        {burnoutRisk.recommendations.length > 0 && (
          <Alert className={`bg-${getRiskColor()}/10 border-${getRiskColor()}/30`}>
            <Heart className={`h-4 w-4 text-${getRiskColor()}`} />
            <AlertTitle>Recommendations</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {burnoutRisk.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {burnoutRisk.referralNeeded && (
          <Alert className="bg-error/10 border-error/30">
            <Shield className="h-4 w-4 text-error" />
            <AlertTitle className="text-error">Professional Support Recommended</AlertTitle>
            <AlertDescription>
              Consider reaching out to a counselor or mental health professional. You can contact:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your organization's Employee Assistance Program (EAP)</li>
                <li>A licensed mental health professional</li>
                <li>Crisis support: 988 (National Suicide Prevention Lifeline)</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
