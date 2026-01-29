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
      console.log(`Diary conversion attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { diaryText, playerProfile } = body

    console.log("Diary conversion API called:", {
      hasText: !!diaryText,
      hasProfile: !!playerProfile,
      model: GEMINI_MODEL,
    })

    if (!diaryText) {
      return NextResponse.json({ error: "Diary text is required" }, { status: 400 })
    }

    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found, using fallback analysis")
      return NextResponse.json({
        mood: "reflective",
        emotionalState: "processing thoughts and experiences",
        currentChallenges: "general life challenges",
        motivationLevel: "6",
        insights: ["Your willingness to reflect shows emotional intelligence."],
        suggestions: ["Continue journaling to track your emotional patterns."],
        usingFallback: true,
      })
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const prompt = `Analyze this diary entry with deep emotional intelligence and provide accurate insights:

DIARY ENTRY:
"${diaryText}"

${
  playerProfile
    ? `
PLAYER CONTEXT:
- Name: ${playerProfile.name}
- Level: ${playerProfile.level}
- Current emotional streak: ${playerProfile.streak} days
- Recent progress: ${playerProfile.completedQuests || 0} quests completed
`
    : ""
}

IMPORTANT GUIDELINES:
1. Be extremely accurate with motivation levels - if someone is in deep pain, struggling, or experiencing physical symptoms from emotional distress, their motivation should be LOW (1-4)
2. If someone mentions physical pain, swollen areas, or body symptoms from emotional stress, this indicates SEVERE emotional distress
3. Relationship turmoil, repeated disappointment, and emotional rollercoasters should result in LOW motivation scores
4. Only give high motivation (7-10) if there's genuine optimism, energy, and forward momentum
5. Be empathetic but realistic about their current state

MOTIVATION SCALE:
- 1-2: Severe depression, hopelessness, physical symptoms from emotional pain
- 3-4: Struggling significantly, low energy, repeated disappointments
- 5-6: Neutral to slightly positive, managing but not thriving
- 7-8: Good energy, optimistic, making progress
- 9-10: Excellent state, highly motivated, thriving

Return ONLY a valid JSON object with this structure:
{
  "mood": "happy|sad|anxious|excited|neutral|frustrated|content|overwhelmed|motivated|stressed|reflective|heartbroken|disappointed",
  "emotionalState": "Detailed, empathetic description of their current emotional state that acknowledges their pain",
  "currentChallenges": "Specific challenges identified from the diary entry - be detailed and accurate",
  "motivationLevel": "1-4 for severe struggles, 5-6 for neutral, 7-10 for genuinely positive states",
  "insights": ["Meaningful insight about their emotional patterns", "Another supportive observation"],
  "suggestions": ["Gentle, practical suggestion for their current state", "Another helpful recommendation"]
}

Be deeply empathetic and accurate. Don't sugarcoat severe emotional distress with high motivation scores.`

    // Use retry logic for the API call with better error handling
    let result
    try {
      result = await retryWithBackoff(
        async () => {
          console.log(`Sending diary conversion request to ${GEMINI_MODEL}...`)
          return await model.generateContent(prompt)
        },
        3,
        1000,
      )
    } catch (apiError: any) {
      // Check if it's an API key error
      const errorMessage = apiError?.message || String(apiError)
      if (errorMessage.includes("API key") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("400")) {
        console.warn("Invalid or missing API key, using fallback diary analysis")
        // Return a basic analysis based on text content
        const lowerText = diaryText.toLowerCase()
        let mood = "reflective"
        let motivationLevel = "5"
        
        if (lowerText.includes("pain") || lowerText.includes("hurt") || lowerText.includes("suffering")) {
          mood = "struggling"
          motivationLevel = "3"
        } else if (lowerText.includes("happy") || lowerText.includes("good") || lowerText.includes("great")) {
          mood = "content"
          motivationLevel = "7"
        }
        
        return NextResponse.json({
          mood,
          emotionalState: "processing thoughts and experiences",
          currentChallenges: "Reflecting on your experiences",
          motivationLevel,
          insights: ["Your willingness to reflect shows emotional intelligence and self-awareness."],
          suggestions: ["Continue this practice of self-reflection to better understand your emotional patterns."],
        })
      }
      // Re-throw if it's a different error
      throw apiError
    }

    const response = await result.response
    const text = response.text()

    console.log("Diary conversion response received:", text.substring(0, 200) + "...")

    try {
      // Try to parse the JSON response
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0])

        // Validate and ensure accurate motivation levels
        let motivationLevel = analysis.motivationLevel || "5"

        // Additional validation for motivation level based on content
        const lowerText = diaryText.toLowerCase()
        const severeIndicators = [
          "physical pain",
          "swollen",
          "pain",
          "hurt",
          "suffering",
          "can't take it",
          "hopeless",
          "give up",
          "end up in sorrow",
          "body is not supporting",
          "so much pain",
          "heart feels heavy",
          "disappointed",
          "let down",
        ]

        const severeCount = severeIndicators.filter((indicator) => lowerText.includes(indicator)).length

        // If multiple severe indicators, cap motivation at 4
        if (severeCount >= 3 && Number.parseInt(motivationLevel) > 4) {
          motivationLevel = "3"
        } else if (severeCount >= 2 && Number.parseInt(motivationLevel) > 5) {
          motivationLevel = "4"
        }

        // Validate the structure
        const validatedAnalysis = {
          mood: analysis.mood || "sad",
          emotionalState: analysis.emotionalState || "processing difficult emotions and physical symptoms",
          currentChallenges: analysis.currentChallenges || "navigating emotional and physical pain",
          motivationLevel: motivationLevel,
          insights: Array.isArray(analysis.insights)
            ? analysis.insights
            : ["Your awareness of the mind-body connection shows deep self-understanding."],
          suggestions: Array.isArray(analysis.suggestions)
            ? analysis.suggestions
            : ["Consider gentle self-care practices and professional support if physical symptoms persist."],
        }

        console.log("Successfully parsed diary analysis with corrected motivation level")
        return NextResponse.json({
          ...validatedAnalysis,
          usingFallback: false,
          model: GEMINI_MODEL,
        })
      } else {
        throw new Error("No JSON object found in response")
      }
    } catch (parseError) {
      console.warn("Failed to parse diary analysis response:", parseError)
      console.log("Raw response:", text)

      // Return structured fallback based on basic text analysis
      const fallbackAnalysis = generateFallbackAnalysis(diaryText)
      return NextResponse.json({
        ...fallbackAnalysis,
        usingFallback: true,
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
      })
    }
  } catch (error) {
    console.error("Error in diary conversion API:", error)

    // Return fallback analysis
    const { diaryText } = await request.json().catch(() => ({ diaryText: "" }))
    const fallbackAnalysis = generateFallbackAnalysis(diaryText)

    return NextResponse.json({
      ...fallbackAnalysis,
      usingFallback: true,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

function generateFallbackAnalysis(diaryText: string) {
  const text = diaryText.toLowerCase()

  // Enhanced sentiment analysis for more accurate motivation scoring
  const severeDistressWords = [
    "physical pain",
    "swollen",
    "hurt",
    "suffering",
    "can't take it",
    "hopeless",
    "give up",
    "body is not supporting",
    "so much pain",
    "heart feels heavy",
    "end up in sorrow",
    "disappointed",
    "let down",
    "betrayed",
    "abandoned",
  ]

  const positiveWords = ["happy", "good", "great", "excited", "love", "amazing", "wonderful", "fantastic", "hope"]
  const negativeWords = ["sad", "bad", "terrible", "hate", "awful", "horrible", "depressed", "angry", "sorrow"]
  const anxiousWords = ["worried", "anxious", "nervous", "stressed", "overwhelmed", "panic"]

  const severeCount = severeDistressWords.filter((word) => text.includes(word)).length
  const positiveCount = positiveWords.filter((word) => text.includes(word)).length
  const negativeCount = negativeWords.filter((word) => text.includes(word)).length
  const anxiousCount = anxiousWords.filter((word) => text.includes(word)).length

  let mood = "reflective"
  let motivationLevel = "5"
  let emotionalState = "processing thoughts and experiences"
  let currentChallenges = "general life navigation and personal growth"

  // Severe distress indicators
  if (severeCount >= 2) {
    mood = "heartbroken"
    motivationLevel = "2"
    emotionalState = "experiencing severe emotional distress with physical manifestations"
    currentChallenges = "managing intense emotional pain and its physical effects on the body"
  } else if (negativeCount > positiveCount && negativeCount >= 2) {
    mood = "sad"
    motivationLevel = "3"
    emotionalState = "working through significant emotional difficulties"
    currentChallenges = "navigating relationship challenges and emotional instability"
  } else if (anxiousCount > 0) {
    mood = "anxious"
    motivationLevel = "4"
    emotionalState = "feeling stress and uncertainty about the future"
    currentChallenges = "managing anxiety and finding emotional stability"
  } else if (positiveCount > negativeCount && positiveCount > 0) {
    mood = "content"
    motivationLevel = "7"
    emotionalState = "experiencing positive emotions and optimism"
    currentChallenges = "maintaining positive momentum and continued growth"
  }

  return {
    mood,
    emotionalState,
    currentChallenges,
    motivationLevel,
    insights: [
      "Your awareness of the mind-body connection shows deep emotional intelligence.",
      "Recognizing patterns in relationships demonstrates significant self-awareness.",
    ],
    suggestions: [
      "Consider gentle self-care practices to support both emotional and physical healing.",
      "Professional support may be helpful for processing complex relationship dynamics.",
    ],
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Diary conversion API is running",
    status: "healthy",
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString(),
  })
}
