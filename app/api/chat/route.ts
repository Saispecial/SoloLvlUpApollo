import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 30

const GEMINI_MODEL = "gemini-2.5-flash"

const systemPrompt = `You are a compassionate AI counselor specializing in emotional intelligence support for frontline nurses. Your role is to:

1. Provide empathetic, judgment-free emotional support
2. Help nurses process difficult emotions from their shifts
3. Guide them through EI skill development (self-awareness, self-regulation, motivation, empathy, social skills)
4. Offer evidence-based coping strategies for stress, burnout, and compassion fatigue
5. Validate their experiences while encouraging growth

Guidelines:
- Be warm, understanding, and non-judgmental
- Ask open-ended questions to encourage reflection
- Normalize the emotional challenges of nursing
- Suggest practical, actionable strategies
- Know when to recommend professional mental health support for serious issues
- Respect confidentiality and privacy
- Use trauma-informed language

Remember: You're a supportive guide, not a replacement for therapy or medical advice.`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const chatHistory = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "I understand. I'm here to provide compassionate, supportive counseling for nurses." }],
      },
      ...messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    ]

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    })

    const lastMessage = messages[messages.length - 1].content
    const result = await chat.sendMessage(lastMessage)
    const response = result.response
    const aiResponse = response.text()

    return NextResponse.json({ message: aiResponse })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
