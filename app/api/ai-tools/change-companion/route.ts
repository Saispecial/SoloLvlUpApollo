import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY not found")
      return Response.json({ error: "API key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const body = await request.json()
    const { action, concern } = body

    if (action === "reappraise") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

      const prompt = `You are a supportive cognitive reappraisal coach for healthcare professionals dealing with interpersonal workplace challenges.

The user's interpersonal concern: "${concern}"

Provide TWO things in JSON format:

1. "reappraisal": A cognitive reappraisal that:
   - Validates their emotional experience without dismissing it
   - Offers an alternative interpretation of the other person's behavior
   - Separates facts from interpretations
   - Is warm, supportive, and non-preachy
   - Is 2-3 sentences max

2. "suggestedAction": A small, concrete next step that:
   - Is non-confrontational
   - Focuses on their own response, not changing the other person
   - Is actionable within the next interaction
   - Is 1-2 sentences max

Respond ONLY with valid JSON, no markdown:
{"reappraisal": "...", "suggestedAction": "..."}`

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      try {
        // Try to parse JSON response
        const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
        const parsed = JSON.parse(cleanedText)
        return Response.json(parsed)
      } catch {
        // Fallback if JSON parsing fails
        return Response.json({
          reappraisal:
            "It sounds like you're navigating a challenging interpersonal dynamic. Consider that the other person may be operating under their own pressures that you might not be fully aware of. Their behavior might be less about you personally and more about their own situation.",
          suggestedAction:
            "Before your next interaction, take a moment to consider one positive intention the other person might have, even if their delivery was imperfect.",
        })
      }
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Change Companion API error:", error)
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
