import { NextRequest, NextResponse } from "next/server"
import type { EIAssessment } from "@/lib/types"
import { scoreTEIQueSF } from "@/lib/assessments/teique-sf"

export async function POST(request: NextRequest) {
  try {
    const { tool, answers } = await request.json()

    let assessment: EIAssessment

    switch (tool) {
      case "TEIQue-SF":
        assessment = scoreTEIQueSF(answers)
        break
      case "SSEIT":
        // Placeholder - would implement SSEIT scoring
        assessment = {
          id: Math.random().toString(36).substr(2, 9),
          tool: "SSEIT",
          baselineScore: 55,
          domainScores: {
            selfAwareness: 52,
            selfManagement: 58,
            socialAwareness: 55,
            relationshipManagement: 54,
          },
          strengths: ["selfManagement"],
          gaps: ["selfAwareness"],
          assessmentDate: new Date(),
          completedAt: new Date(),
        }
        break
      case "HEIT":
        // Placeholder - would implement HEIT scoring
        assessment = {
          id: Math.random().toString(36).substr(2, 9),
          tool: "HEIT",
          baselineScore: 53,
          domainScores: {
            selfAwareness: 51,
            selfManagement: 55,
            socialAwareness: 54,
            relationshipManagement: 52,
          },
          strengths: ["selfManagement"],
          gaps: ["selfAwareness"],
          assessmentDate: new Date(),
          completedAt: new Date(),
        }
        break
      case "Nurse-EI":
        // Placeholder - would implement Nurse-EI scoring
        assessment = {
          id: Math.random().toString(36).substr(2, 9),
          tool: "Nurse-EI",
          baselineScore: 56,
          domainScores: {
            selfAwareness: 54,
            selfManagement: 58,
            socialAwareness: 57,
            relationshipManagement: 55,
          },
          strengths: ["selfManagement", "socialAwareness"],
          gaps: ["selfAwareness"],
          assessmentDate: new Date(),
          completedAt: new Date(),
        }
        break
      default:
        return NextResponse.json({ error: "Invalid assessment tool" }, { status: 400 })
    }

    // Store assessment (in production, would save to database)
    // For now, return the assessment

    return NextResponse.json(assessment)
  } catch (error) {
    console.error("Error processing assessment:", error)
    return NextResponse.json({ error: "Failed to process assessment" }, { status: 500 })
  }
}
