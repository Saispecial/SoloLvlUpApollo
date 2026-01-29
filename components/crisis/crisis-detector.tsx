"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Heart, Shield, Phone, Users, X } from "lucide-react"
import type { CrisisState } from "@/lib/types"

interface CrisisDetectorProps {
  emotionalState?: string
  motivationLevel?: number
  recentReflections?: any[]
  onCrisisDetected?: (crisis: CrisisState) => void
}

export function CrisisDetector({
  emotionalState = "",
  motivationLevel = 5,
  recentReflections = [],
  onCrisisDetected,
}: CrisisDetectorProps) {
  const [crisisLevel, setCrisisLevel] = useState<CrisisState["level"] | null>(null)
  const [indicators, setIndicators] = useState<string[]>([])
  const [showGrounding, setShowGrounding] = useState(false)

  useEffect(() => {
    detectCrisis()
  }, [emotionalState, motivationLevel, recentReflections])

  const detectCrisis = () => {
    const detectedIndicators: string[] = []
    let level: CrisisState["level"] = "low"

    // Check motivation level
    if (motivationLevel <= 2) {
      detectedIndicators.push("Very low motivation (1-2)")
      level = "critical"
    } else if (motivationLevel <= 4) {
      detectedIndicators.push("Low motivation (3-4)")
      if (level !== "critical") level = "high"
    }

    // Check emotional state keywords
    const crisisKeywords = [
      "hopeless",
      "overwhelmed",
      "suicidal",
      "self-harm",
      "can't cope",
      "breaking down",
      "shutdown",
      "numb",
      "trauma",
      "panic",
    ]

    const emotionalStateLower = emotionalState.toLowerCase()
    const hasCrisisKeywords = crisisKeywords.some((keyword) => emotionalStateLower.includes(keyword))

    if (hasCrisisKeywords) {
      detectedIndicators.push("Crisis-related language detected in emotional state")
      if (level === "low") level = "moderate"
      if (level === "moderate") level = "high"
      if (level === "high") level = "critical"
    }

    // Check recent reflections for patterns
    if (recentReflections.length > 0) {
      const recentLowMotivation = recentReflections.filter(
        (r) => Number.parseInt(r.motivationLevel || "5") <= 3
      ).length

      if (recentLowMotivation >= 3) {
        detectedIndicators.push("Sustained low motivation over multiple days")
        if (level !== "critical") level = "high"
      }
    }

    // Physical symptoms mentioned
    const physicalSymptoms = ["pain", "ache", "swollen", "symptoms", "physical"]
    if (physicalSymptoms.some((symptom) => emotionalStateLower.includes(symptom))) {
      detectedIndicators.push("Physical symptoms from emotional distress")
      if (level === "low") level = "moderate"
    }

    if (detectedIndicators.length > 0) {
      setCrisisLevel(level)
      setIndicators(detectedIndicators)

      const crisisState: CrisisState = {
        level,
        detectedAt: new Date(),
        indicators: detectedIndicators,
        groundingExercisesCompleted: false,
        escalationTriggered: false,
      }

      if (onCrisisDetected) {
        onCrisisDetected(crisisState)
      }

      // Auto-trigger grounding for high/critical
      if (level === "high" || level === "critical") {
        setShowGrounding(true)
      }
    } else {
      setCrisisLevel(null)
      setIndicators([])
    }
  }

  if (!crisisLevel || crisisLevel === "low") {
    return null
  }

  const getCrisisColor = () => {
    switch (crisisLevel) {
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

  const getCrisisMessage = () => {
    switch (crisisLevel) {
      case "moderate":
        return "We've noticed some signs of emotional distress. Let's take a moment to ground yourself."
      case "high":
        return "You're experiencing significant emotional distress. Please take immediate steps to care for yourself."
      case "critical":
        return "You're in a crisis state. Please use the grounding exercises below, and consider reaching out for professional support."
      default:
        return ""
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowGrounding(false)}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-2xl w-full"
        >
          <Card className={`border-2 border-${getCrisisColor()}/50 shadow-2xl`}>
            <CardHeader className="bg-gradient-to-r from-error/10 to-warning/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-${getCrisisColor()}/20`}>
                    <AlertTriangle className={`w-6 h-6 text-${getCrisisColor()}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Crisis State Detected</CardTitle>
                    <CardDescription className="mt-1">
                      Level: <span className="font-semibold capitalize">{crisisLevel}</span>
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGrounding(false)}
                  className="text-foreground/70"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Crisis Message */}
              <Alert className={`border-${getCrisisColor()}/30 bg-${getCrisisColor()}/5`}>
                <Heart className={`h-4 w-4 text-${getCrisisColor()}`} />
                <AlertTitle>We're Here to Support You</AlertTitle>
                <AlertDescription className="text-foreground/80">{getCrisisMessage()}</AlertDescription>
              </Alert>

              {/* Detected Indicators */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Detected Indicators:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground/70">
                  {indicators.map((indicator, idx) => (
                    <li key={idx}>{indicator}</li>
                  ))}
                </ul>
              </div>

              {/* AI Support Boundaries */}
              <Alert className="bg-primary/5 border-primary/20">
                <Shield className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Important: AI Support Boundaries</AlertTitle>
                <AlertDescription className="text-foreground/80 text-sm">
                  This platform provides supportive tools, but it is not a replacement for professional
                  mental health care. If you're experiencing a mental health emergency, please contact:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Emergency Services: 911 (or your local emergency number)</li>
                    <li>Crisis Text Line: Text HOME to 741741</li>
                    <li>National Suicide Prevention Lifeline: 988</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => setShowGrounding(true)}
                  className="flex-1 bg-warm-gradient-teal text-white"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Start Grounding Exercise
                </Button>
                {crisisLevel === "high" || crisisLevel === "critical" ? (
                  <Button
                    onClick={() => {
                      // Trigger escalation
                      const escalation = {
                        type: "crisis",
                        target: "counselor",
                        message: `Crisis detected: ${crisisLevel} level. Indicators: ${indicators.join(", ")}`,
                      }
                      // In production, this would send to API
                      console.log("Escalation triggered:", escalation)
                      alert("Your manager and wellness team have been notified (in production)")
                    }}
                    variant="outline"
                    className="flex-1 border-error text-error hover:bg-error/10"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
