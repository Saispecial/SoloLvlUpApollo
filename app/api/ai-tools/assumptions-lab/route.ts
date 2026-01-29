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
    const { action, assumption } = body

    if (action === "counter-frame") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

      const prompt = `You are a cognitive behavioral therapy expert helping a healthcare professional challenge a limiting belief or assumption.

The user's assumption: "${assumption}"

Your task:
1. Acknowledge the assumption without dismissing it
2. Offer ONE powerful counter-frame or alternative perspective
3. Keep it concise (2-3 sentences max)
4. Make it specific to their assumption, not generic
5. End with a thought-provoking question or observation

Do NOT:
- Give advice
- Be preachy or condescending
- Use bullet points
- Be overly positive or dismissive of their concern

Respond with just the counter-frame text, nothing else.`

      const result = await model.generateContent(prompt)
      const counterFrame = result.response.text()

      return Response.json({ counterFrame })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Assumptions Lab API error:", error)
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
