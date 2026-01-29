import type { PlayerStats } from "./types"
import type { PersonalReflection, DiaryEntry } from "./types"

export const getSuggestedStatsFromAI = async (title: string, description: string): Promise<Partial<PlayerStats>> => {
  console.log("Analyzing quest for stat suggestions:", title, description)

  // Return empty object for now - this function needs to be rewritten to use correct PlayerStats
  // Old implementation used IQ, EQ, Strength which don't exist in PlayerStats
  // TODO: Rewrite to use: "Self-Awareness", "Self-Management", "Social Awareness", 
  // "Relationship Management", "Clinical Competence", "Resilience"
  await new Promise((resolve) => setTimeout(resolve, 800))
  return {}
}

export async function convertDiaryToReflection(diaryEntry: DiaryEntry): Promise<Omit<PersonalReflection, "timestamp">> {
  try {
    const { nurse } = await import("@/stores/app-store").then((m) => m.useAppStore.getState())
    const res = await fetch("/api/diary-conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diaryText: diaryEntry.content,
        playerProfile: nurse,
      }),
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    const data = await res.json()
    return {
      mood: data.mood,
      emotionalState: data.emotionalState,
      currentChallenges: data.currentChallenges,
      motivationLevel: data.motivationLevel,
      diaryContent: diaryEntry.content,
      source: "diary" as const,
    }
  } catch (error) {
    console.error("Error converting diary to reflection:", error)
    // Fallback to basic analysis
    return {
      mood: "neutral",
      emotionalState: "balanced",
      currentChallenges: "general life challenges",
      motivationLevel: "5",
      diaryContent: diaryEntry.content,
      source: "diary" as const,
    }
  }
}

export async function analyzeEmotionalTone(text: string): Promise<{
  emotionalTone: string
  sentiment: "positive" | "negative" | "neutral"
  keyEmotions: string[]
  stressLevel: number // 1-10
}> {
  try {
    const res = await fetch("/api/emotional-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    return await res.json()
  } catch (error) {
    console.error("Error analyzing emotional tone:", error)
    return {
      emotionalTone: "neutral",
      sentiment: "neutral",
      keyEmotions: [],
      stressLevel: 5,
    }
  }
}
