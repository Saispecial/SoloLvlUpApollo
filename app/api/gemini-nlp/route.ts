import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_MODEL = "gemini-2.5-flash"

// Retry logic with exponential backoff
async function retryWithBackoff<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Gemini NLP attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, mode = "Beyond" } = body

    console.log("Gemini NLP API called:", {
      message: message?.substring(0, 50) + "...",
      mode,
      model: GEMINI_MODEL,
    })

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found, using fallback response")
      const fallbackResponse =
        mode === "Hunter"
          ? "I'm here to support your growth journey, Hunter! Keep pushing forward! 💪"
          : "I'd love to help with that! What would you like to know?"

      return NextResponse.json({
        response: fallbackResponse,
        usingFallback: true,
      })
    }

    // Handle simple math directly
    const mathMatch = message.match(/^(\d+)\s*[+\-*/]\s*(\d+)$/)
    if (mathMatch) {
      try {
        const result = eval(message)
        return NextResponse.json({
          response: `${message} = ${result}`,
          usingFallback: false,
          directMath: true,
        })
      } catch {
        // Fall through to AI if eval fails
      }
    }

    // Handle farewells
    const farewellWords = ["bye", "goodbye", "see you", "farewell", "later", "cya"]
    if (farewellWords.some((word) => message.toLowerCase().includes(word))) {
      const farewellResponse =
        mode === "Hunter"
          ? "Farewell, brave Hunter! May your quests bring you strength and wisdom. Until we meet again! ⚔️✨"
          : "Goodbye! Take care, and feel free to ask me anything anytime! 👋😊"

      return NextResponse.json({
        response: farewellResponse,
        usingFallback: false,
        directResponse: true,
      })
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const systemPrompt =
      mode === "Hunter"
        ? `You are Arise, a wise and encouraging RPG companion for a Hunter on their personal development journey. You speak with warmth, wisdom, and motivation. Use RPG terminology naturally (quests, levels, stats, experience). Be supportive but not overly dramatic. Keep responses conversational and encouraging. Avoid repetitive introductions.`
        : `You are Arise, a friendly and knowledgeable AI assistant. You're helpful, conversational, and direct. Answer questions clearly and naturally. Avoid repetitive introductions or overly formal language. Be warm but concise.`

    const prompt = `${systemPrompt}

User message: "${message}"

Respond naturally and directly. No need for introductions or "I'm Arise" unless it's the first interaction.`

    // Use retry logic for the API call with API key error handling
    let result
    try {
      result = await retryWithBackoff(
        async () => {
          console.log(`Sending request to ${GEMINI_MODEL}...`)
          return await model.generateContent(prompt)
        },
        3,
        1000,
      )
    } catch (apiError: any) {
      const errorMessage = apiError?.message || String(apiError)
      if (errorMessage.includes("API key") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("400")) {
        console.warn("Invalid or missing API key in gemini-nlp, using fallback response")
        return NextResponse.json({
          response: "I'm here to support you. Please add a valid GEMINI_API_KEY to your environment variables for AI-powered responses.",
        })
      }
      throw apiError
    }

    const response = await result.response
    let text = response.text()

    console.log("Gemini response received:", text.substring(0, 200) + "...")

    // Clean up repetitive responses and introductions
    const cleanupPatterns = [
      /^(Hello[!,]?\s*)?(I am|I'm)\s+Arise[,.]?\s*/i,
      /^(Alright[,!]?\s*)?(I am|I'm)\s+Arise[,.]?\s*/i,
      /ready to assist you with.*?questions.*?!/i,
      /Ask away[!,]?\s*/i,
      /Let's explore.*?together[!.]?\s*/i,
      /Just ask away[!.]?\s*/i,
      /Feel free to ask.*?anytime[!.]?\s*/i,
      /^Understood[.]?\s*/i,
      /^Yes[.]?\s*$/i,
    ]

    for (const pattern of cleanupPatterns) {
      text = text.replace(pattern, "").trim()
    }

    // If response is too short after cleanup, provide a better response
    if (text.length < 10) {
      text =
        mode === "Hunter"
          ? "I'm here to support your journey, Hunter! What can I help you with?"
          : "How can I help you today?"
    }

    // Ensure response ends properly
    if (text && !text.match(/[.!?]$/)) {
      text += "."
    }

    console.log("Cleaned response:", text.substring(0, 100) + "...")

    return NextResponse.json({
      response: text,
      usingFallback: false,
      model: GEMINI_MODEL,
    })
  } catch (error) {
    console.error("Error in Gemini NLP API:", error)

    // Return mode-appropriate fallback
    const { mode = "Beyond" } = await request.json().catch(() => ({ mode: "Beyond" }))
    const fallbackResponse =
      mode === "Hunter"
        ? "I'm experiencing some technical difficulties, but I'm still here to support your growth journey! 💪"
        : "I'm having some technical issues right now, but I'm still here to help however I can!"

    return NextResponse.json({
      response: fallbackResponse,
      usingFallback: true,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Gemini NLP API is running",
    status: "healthy",
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString(),
  })
}
