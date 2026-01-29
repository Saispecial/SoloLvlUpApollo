import { type NextRequest, NextResponse } from "next/server"
import { parentAgent, type ReflectionToQuestResponse } from "@/lib/agents/parentAgent"

const GEMINI_MODEL = "gemini-2.5-flash"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerProfile, reflection, diaryEntries, source } = body

    // Determine the primary source for quest generation
    const questSource = source || (diaryEntries && diaryEntries.length > 0 && !reflection ? "diary" : reflection ? "reflection" : "general")
    
    console.log("Quest API called with:", {
      playerProfile: playerProfile?.name,
      level: playerProfile?.level,
      hasReflection: !!reflection,
      hasDiaryEntries: diaryEntries?.length || 0,
      questSource,
      model: GEMINI_MODEL,
    })

    // Use Parent Agent to orchestrate reflection → quest flow
    const response = await parentAgent.orchestrate({
      type: 'reflection-to-quest',
      reflection,
      nurseProfile: playerProfile,
      diaryEntries,
    }) as ReflectionToQuestResponse

    if (!response.success) {
      return NextResponse.json({
        success: false,
        error: response.error || "Failed to generate quests",
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      quests: response.quests,
      suggestions: response.suggestions,
      usingFallback: response.fallbackUsed,
      model: GEMINI_MODEL,
      source: questSource,
    })
  } catch (error) {
    console.error("Error in quests API:", error)
    // Return error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Quest API is running",
    status: "healthy",
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString(),
  })
}
