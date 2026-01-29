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
    const { thought } = body

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `You are providing rapid emotional first aid to a healthcare professional. This is NOT deep therapy - it's quick, warm support.

The user expressed: "${thought}"

Provide FOUR things in JSON format:

1. "emotion": Detect the primary emotion (ONE word, lowercase). Common ones: frustrated, anxious, sad, overwhelmed, angry, disappointed, worried, stressed

2. "validation": Validate their feeling in 1-2 sentences. Be warm, not clinical. Don't minimize or dismiss.

3. "perspective": Offer ONE gentle alternative perspective in 2 sentences max. Don't give advice. Don't be preachy. Just offer a different lens.

4. "reflectionPrompt": A tiny, actionable micro-reflection for the next hour or so. One sentence. Start with an action verb.

Keep everything SHORT and WARM. This is emotional first aid, not analysis.

Respond ONLY with valid JSON, no markdown:
{"emotion": "...", "validation": "...", "perspective": "...", "reflectionPrompt": "..."}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleanedText)
      return Response.json(parsed)
    } catch {
      return Response.json({
        emotion: "stressed",
        validation: "It makes complete sense that you're feeling this way. These feelings are valid responses to a challenging situation.",
        perspective: "Consider that this moment, as difficult as it is, is temporary. You've navigated hard moments before, and you have more resources than you might realize right now.",
        reflectionPrompt: "In the next hour, notice one small thing that goes well, even if it's minor.",
      })
    }
  } catch (error) {
    console.error("Reframe API error:", error)
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
