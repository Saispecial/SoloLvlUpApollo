import { type NextRequest, NextResponse } from "next/server"
import { parentAgent, type AssessmentToProgramResponse } from "@/lib/agents/parentAgent"
import type { EIAssessment } from "@/lib/types"

const GEMINI_MODEL = "gemini-2.5-flash"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assessment, nurseProfile } = body

    if (!assessment) {
      return NextResponse.json({ error: "Assessment results are required" }, { status: 400 })
    }

    console.log("Roadmap API called with assessment:", {
      tool: assessment.tool,
      baselineScore: assessment.baselineScore,
      gaps: assessment.gaps,
      strengths: assessment.strengths,
    })

    // Use Parent Agent to orchestrate assessment → program → roadmap flow
    const response = await parentAgent.orchestrate({
      type: 'assessment-to-program',
      assessment: assessment as EIAssessment,
      nurseProfile,
    }) as AssessmentToProgramResponse

    if (!response.success) {
      return NextResponse.json({
        success: false,
        error: response.error || "Failed to generate roadmap",
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      modules: response.modules,
      roadmap: response.roadmap,
      program: {
        id: response.program.id,
        name: response.program.name,
        duration: response.program.duration,
        rationale: response.programRecommendation.rationale,
      },
      usingFallback: response.fallbackUsed,
      model: GEMINI_MODEL,
    })
  } catch (error) {
    console.error("Error in roadmap API:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
