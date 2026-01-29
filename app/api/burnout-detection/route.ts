import { NextRequest, NextResponse } from "next/server"
import type { BurnoutRisk } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { emotionalState, motivationLevel, recentReflections, shiftContext } = await request.json()

    // Analyze burnout indicators
    const indicators: string[] = []
    let level: BurnoutRisk["level"] = "low"

    // Check motivation level
    if (motivationLevel <= 2) {
      indicators.push("Very low motivation (1-2)")
      level = "critical"
    } else if (motivationLevel <= 4) {
      indicators.push("Low motivation (3-4)")
      if (level !== "critical") level = "high"
    }

    // Check emotional state for burnout keywords
    const burnoutKeywords = [
      "exhausted",
      "burnout",
      "depleted",
      "overwhelmed",
      "cynical",
      "detached",
      "ineffective",
      "hopeless",
    ]

    const emotionalStateLower = (emotionalState || "").toLowerCase()
    const hasBurnoutKeywords = burnoutKeywords.some((keyword) => emotionalStateLower.includes(keyword))

    if (hasBurnoutKeywords) {
      indicators.push("Burnout-related language detected")
      if (level === "low") level = "moderate"
      if (level === "moderate") level = "high"
    }

    // Check recent reflection patterns
    if (recentReflections && recentReflections.length > 0) {
      const lowMotivationCount = recentReflections.filter(
        (r: any) => Number.parseInt(r.motivationLevel || "5") <= 3
      ).length

      if (lowMotivationCount >= 3) {
        indicators.push("Sustained low motivation over multiple days")
        if (level !== "critical") level = "high"
      }
    }

    // Shift context considerations
    if (shiftContext) {
      if (shiftContext.workloadIntensity === "critical") {
        indicators.push("Critical workload intensity")
        if (level === "low") level = "moderate"
      }

      if (shiftContext.criticalIncidentOccurred) {
        indicators.push("Critical incident occurred")
        if (level === "low") level = "moderate"
      }
    }

    // Generate recommendations
    const recommendations: string[] = []
    const referralNeeded = level === "high" || level === "critical"

    if (level === "critical") {
      recommendations.push("Immediate professional support recommended")
      recommendations.push("Consider speaking with a counselor or mental health professional")
      recommendations.push("Take time off if possible")
    } else if (level === "high") {
      recommendations.push("Schedule a wellness check-in")
      recommendations.push("Practice daily grounding exercises")
      recommendations.push("Consider reducing workload if possible")
    } else if (level === "moderate") {
      recommendations.push("Increase self-care activities")
      recommendations.push("Practice stress management techniques")
      recommendations.push("Monitor your emotional state")
    } else {
      recommendations.push("Continue current self-care practices")
      recommendations.push("Maintain awareness of your emotional wellbeing")
    }

    const burnoutRisk: BurnoutRisk = {
      level,
      indicators,
      recommendations,
      referralNeeded,
      detectedAt: new Date(),
      lastUpdated: new Date(),
    }

    return NextResponse.json(burnoutRisk)
  } catch (error) {
    console.error("Error detecting burnout:", error)
    return NextResponse.json(
      {
        level: "low",
        indicators: [],
        recommendations: ["Continue monitoring your emotional wellbeing"],
        referralNeeded: false,
        detectedAt: new Date(),
        lastUpdated: new Date(),
      },
      { status: 500 }
    )
  }
}
