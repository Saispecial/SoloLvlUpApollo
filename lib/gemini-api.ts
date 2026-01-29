import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

export type QuestGenerationResult = {
  quests: any[]
  suggestions: {
    focusArea: string
    motivation: string
    emotionalGuidance: string
  }
}

/**
 * Fetch quests from the API and guarantee {quests,suggestions} shape.
 */
export async function generateQuests(
  playerProfile: any,
  reflection?: any,
  diaryEntries?: any[],
  source?: "diary" | "reflection" | "general",
): Promise<QuestGenerationResult> {
  try {
    // Auto-detect source if not provided
    const detectedSource = source || 
      (diaryEntries && diaryEntries.length > 0 && !reflection ? "diary" : 
       reflection ? "reflection" : "general")
    
    const res = await fetch("/api/quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerProfile, reflection, diaryEntries, source: detectedSource }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()

    return {
      quests: data.quests ?? [],
      suggestions: data.suggestions ?? {
        focusArea: "General Growth",
        motivation: "Keep pushing forward—every quest completed levels you up!",
        emotionalGuidance: "Stay mindful of your feelings and celebrate small wins.",
      },
    }
  } catch (err) {
    console.error("Error generating quests:", err)

    // Fallback identical shape
    return {
      quests: getFallbackQuests(),
      suggestions: {
        focusArea: "Mind & Skill",
        motivation: "Offline right now, but consistency is your greatest ally!",
        emotionalGuidance: "Take a deep breath and keep moving—progress comes step by step.",
      },
    }
  }
}

export async function getGeminiInsight(message: string, playerProfile: any) {
  try {
    if (!genAI) {
      return getFallbackInsight(message)
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
    You are Arise, an AI companion helping ${playerProfile.name} with their personal development journey.
    Player stats: Level ${playerProfile.level}, IQ ${playerProfile.stats.IQ}, EQ ${playerProfile.stats.EQ}, Strength ${playerProfile.stats.Strength}
    
    Respond to this message in a supportive, motivational way (max 150 words): "${message}"
    
    Be encouraging, provide actionable advice, and reference their RPG journey when appropriate.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Gemini insight error:", error)
    return getFallbackInsight(message)
  }
}

export async function convertDiaryToReflection(diaryText: string) {
  if (!genAI) {
    return {
      mood: "neutral",
      emotionalState: "reflective",
      motivationLevel: 5,
      insights: ["Take time to reflect on your thoughts and feelings."],
      gratitude: ["I'm grateful for the opportunity to grow."],
      goals: ["Continue journaling regularly."],
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
    Analyze this diary entry and convert it to a structured emotional reflection:
    
    "${diaryText}"
    
    Return ONLY a valid JSON object with this structure:
    {
      "mood": "happy|sad|anxious|excited|neutral|frustrated|content|overwhelmed",
      "emotionalState": "brief description of emotional state",
      "motivationLevel": 1-10,
      "insights": ["insight 1", "insight 2"],
      "gratitude": ["gratitude 1", "gratitude 2"],
      "goals": ["goal 1", "goal 2"]
    }
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.warn("Failed to parse diary conversion response")
    }

    return {
      mood: "reflective",
      emotionalState: "processing thoughts and feelings",
      motivationLevel: 6,
      insights: ["Every diary entry is a step toward self-understanding."],
      gratitude: ["I'm grateful for the time to reflect."],
      goals: ["Continue exploring my thoughts through writing."],
    }
  } catch (error) {
    console.warn("Diary conversion error:", error)
    return {
      mood: "neutral",
      emotionalState: "reflective",
      motivationLevel: 5,
      insights: ["Take time to reflect on your thoughts and feelings."],
      gratitude: ["I'm grateful for the opportunity to grow."],
      goals: ["Continue journaling regularly."],
    }
  }
}

export function getFallbackQuests() {
  return [
    {
      id: `fallback-${Date.now()}-1`,
      title: "Morning Meditation",
      description:
        "Start your day with 10 minutes of mindfulness meditation to center yourself and set positive intentions.",
      type: "Daily",
      difficulty: "Easy",
      xp: 25,
      realm: "Mental",
      completed: false,
      statBoosts: { IQ: 1, EQ: 2, Strength: 0 },
    },
    {
      id: `fallback-${Date.now()}-2`,
      title: "Learn Something New",
      description: "Spend 30 minutes learning a new skill, reading an article, or watching an educational video.",
      type: "Normal",
      difficulty: "Medium",
      xp: 50,
      realm: "Mental",
      completed: false,
      statBoosts: { IQ: 3, EQ: 0, Strength: 0 },
    },
    {
      id: `fallback-${Date.now()}-3`,
      title: "Physical Activity",
      description: "Engage in 20-30 minutes of physical exercise, take a walk, or do some stretching.",
      type: "Daily",
      difficulty: "Easy",
      xp: 35,
      realm: "Physical",
      completed: false,
      statBoosts: { IQ: 0, EQ: 1, Strength: 3 },
    },
    {
      id: `fallback-${Date.now()}-4`,
      title: "Social Connection",
      description: "Reach out to a friend, family member, or colleague for a meaningful conversation.",
      type: "Weekly",
      difficulty: "Medium",
      xp: 40,
      realm: "Social",
      completed: false,
      statBoosts: { IQ: 0, EQ: 3, Strength: 0 },
    },
  ]
}

function getFallbackInsight(message: string) {
  const insights = [
    "That's a great question! Remember, every small step forward is progress in your personal development journey.",
    "I believe in your potential! Focus on consistent daily actions that align with your goals.",
    "Your growth mindset is your superpower. Keep challenging yourself and celebrating small wins!",
    "Remember, leveling up in real life takes time and patience. You're doing better than you think!",
    "Every quest you complete, no matter how small, is building the person you want to become.",
    "Progress isn't always linear, but persistence is key. Keep showing up for yourself!",
    "Your current level doesn't define your potential. Every expert was once a beginner.",
    "Small consistent actions compound over time. Trust the process and keep moving forward!",
  ]
  return insights[Math.floor(Math.random() * insights.length)]
}
