import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_MODEL = "gemini-2.5-flash"

/**
 * Centralized Gemini AI Service
 * Provides a clean interface for AI text generation across the application
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY?.trim()
    
    if (key && key !== "your_gemini_api_key_here") {
      this.genAI = new GoogleGenerativeAI(key)
      this.model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL })
    }
  }

  /**
   * Check if Gemini service is available
   */
  isAvailable(): boolean {
    return this.genAI !== null && this.model !== null
  }

  /**
   * Generate content using Gemini AI with retry logic
   */
  async generateContent(prompt: string, maxRetries = 3, baseDelay = 1000): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured")
    }

    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.model!.generateContent(prompt)
        const response = await result.response
        return response.text()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          throw lastError
        }

        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Gemini API attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  /**
   * Parse JSON response from Gemini, handling markdown formatting
   */
  parseJsonResponse<T>(text: string): T {
    // Remove markdown formatting
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
    
    // Try to find JSON object in the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error("No JSON object found in response")
    }

    return JSON.parse(jsonMatch[0])
  }
}

/**
 * Create a singleton instance for server-side use
 */
export function createGeminiService(apiKey?: string): GeminiService {
  return new GeminiService(apiKey)
}

/**
 * Retry utility for any async operation
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw lastError
      }

      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Operation attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
