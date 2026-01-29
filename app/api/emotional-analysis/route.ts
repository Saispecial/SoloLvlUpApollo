import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { text, playerProfile } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        mood: "neutral",
        emotionalState: "reflective",
        motivationLevel: 5,
        insights: ["Take time to reflect on your thoughts and feelings."],
        suggestions: ["Continue journaling to track your emotional patterns."],
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `Analyze the emotional content of this text and provide insights:

TEXT TO ANALYZE:
"${text}"

${
  playerProfile
    ? `
PLAYER CONTEXT:
- Name: ${playerProfile.name}
- Level: ${playerProfile.level}
- Current emotional streak: ${playerProfile.streak} days
`
    : ""
}

Return ONLY a valid JSON object with this structure:
{
  "mood": "happy|sad|anxious|excited|neutral|frustrated|content|overwhelmed|motivated|stressed",
  "emotionalState": "Brief description of the person's emotional state",
  "motivationLevel": 7,
  "insights": ["Key insight about their emotional patterns", "Another meaningful observation"],
  "suggestions": ["Actionable suggestion for emotional wellbeing", "Another helpful recommendation"]
}

Focus on being supportive, constructive, and encouraging in your analysis.`

    let result
    try {
      result = await model.generateContent(prompt)
    } catch (apiError: any) {
      const errorMessage = apiError?.message || String(apiError)
      if (errorMessage.includes("API key") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("400")) {
        console.warn("Invalid or missing API key, using fallback emotional analysis")
        return NextResponse.json({
          mood: "reflective",
          emotionalState: "processing thoughts and experiences",
          motivationLevel: 6,
          insights: ["Your willingness to reflect shows emotional intelligence and self-awareness."],
          suggestions: ["Continue this practice of self-reflection to better understand your emotional patterns."],
        })
      }
      throw apiError
    }

    const response = await result.response
    const responseText = response.text()

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0])
        return NextResponse.json(analysis)
      }
    } catch (parseError) {
      console.warn("Failed to parse emotional analysis response")
    }

    // Fallback response
    return NextResponse.json({
      mood: "reflective",
      emotionalState: "processing thoughts and experiences",
      motivationLevel: 6,
      insights: ["Your willingness to reflect shows emotional intelligence and self-awareness."],
      suggestions: ["Continue this practice of self-reflection to better understand your emotional patterns."],
    })
  } catch (error) {
    console.error("Emotional analysis error:", error)
    return NextResponse.json({
      mood: "neutral",
      emotionalState: "seeking understanding",
      motivationLevel: 5,
      insights: ["Every moment of reflection contributes to your emotional growth."],
      suggestions: ["Keep exploring your thoughts and feelings through writing and reflection."],
    })
  }
}
