import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { playerProfile, completedQuests, recentReflections } = await request.json()

    if (!playerProfile) {
      return NextResponse.json({ error: "Player profile is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        suggestions: {
          primaryFocus: "Balanced Growth",
          statRecommendations: {
            IQ: "Continue learning new skills and challenging yourself intellectually",
            EQ: "Practice empathy and emotional awareness in daily interactions",
            Strength: "Maintain physical activity and build healthy habits",
          },
          nextLevelGoals: ["Complete daily quests consistently", "Reflect on progress weekly"],
          motivationalMessage: "Keep building your stats through consistent daily actions!",
        },
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `Analyze this player's RPG profile and provide personalized stat development suggestions:

PLAYER PROFILE:
- Name: ${playerProfile.name}
- Level: ${playerProfile.level}
- Current Stats: IQ ${playerProfile.stats.IQ}, EQ ${playerProfile.stats.EQ}, Strength ${playerProfile.stats.Strength}
- Total XP: ${playerProfile.totalXp}
- Current Streak: ${playerProfile.streak} days

${
  completedQuests && completedQuests.length > 0
    ? `
RECENTLY COMPLETED QUESTS:
${completedQuests
  .slice(0, 3)
  .map((quest: any) => `- ${quest.title} (${quest.realm}, +${quest.xp} XP)`)
  .join("\n")}
`
    : ""
}

${
  recentReflections && recentReflections.length > 0
    ? `
RECENT REFLECTIONS:
${recentReflections
  .slice(0, 2)
  .map((reflection: any) => `- Mood: ${reflection.mood}, Motivation: ${reflection.motivationLevel}/10`)
  .join("\n")}
`
    : ""
}

Based on their current stats, progress, and patterns, provide development suggestions.

Return ONLY a valid JSON object with this structure:
{
  "suggestions": {
    "primaryFocus": "The main area they should focus on for growth",
    "statRecommendations": {
      "IQ": "Specific advice for developing intellectual abilities",
      "EQ": "Specific advice for developing emotional intelligence", 
      "Strength": "Specific advice for developing physical and mental strength"
    },
    "nextLevelGoals": ["Specific goal to reach next level", "Another actionable goal"],
    "motivationalMessage": "Personalized encouraging message about their progress"
  }
}

Make recommendations specific, actionable, and encouraging based on their current level and stat distribution.`

    let result
    try {
      result = await model.generateContent(prompt)
    } catch (apiError: any) {
      const errorMessage = apiError?.message || String(apiError)
      if (errorMessage.includes("API key") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("400")) {
        console.warn("Invalid or missing API key, using fallback stat suggestions")
        return NextResponse.json({
          suggestedStats: {},
          reasoning: "AI suggestions unavailable. Continue with your current development path.",
        })
      }
      throw apiError
    }
    const response = await result.response
    const responseText = response.text()

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        return NextResponse.json(suggestions)
      }
    } catch (parseError) {
      console.warn("Failed to parse stat suggestions response")
    }

    // Fallback response
    return NextResponse.json({
      suggestions: {
        primaryFocus: "Balanced Development",
        statRecommendations: {
          IQ: "Challenge yourself with new learning opportunities and problem-solving activities",
          EQ: "Practice mindfulness and work on understanding others' perspectives",
          Strength: "Build physical and mental resilience through consistent healthy habits",
        },
        nextLevelGoals: [
          `Reach level ${playerProfile.level + 1} by completing daily quests`,
          "Maintain your current streak and aim for longer consistency",
        ],
        motivationalMessage: `You're doing great at level ${playerProfile.level}! Keep building your stats through consistent daily actions.`,
      },
    })
  } catch (error) {
    console.error("Stat suggestions error:", error)
    return NextResponse.json({
      suggestions: {
        primaryFocus: "Consistent Growth",
        statRecommendations: {
          IQ: "Focus on learning something new each day",
          EQ: "Practice emotional awareness and empathy",
          Strength: "Build physical and mental resilience",
        },
        nextLevelGoals: ["Complete quests consistently", "Reflect on your progress regularly"],
        motivationalMessage: "Every small step forward is progress in your personal development journey!",
      },
    })
  }
}
