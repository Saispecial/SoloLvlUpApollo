import { GeminiService } from "@/lib/llm/gemini-api"
import type {
  QuestGenerationRequest,
  QuestGenerationResponse,
  TrainingModule,
  EIDomain,
} from "@/lib/types/training"

/**
 * Quest Agent
 * Generates individual training modules based on reflections, diary entries, or general profile
 */

// Fallback quest templates
const FALLBACK_QUESTS = {
  general: [
    {
      id: "fallback-1",
      title: "Morning Emotional Check-In",
      description:
        "Take 10 minutes to reflect on your emotional state before your shift. Identify your current feelings and any stressors.",
      type: "Daily Reflection" as const,
      difficulty: "Beginner" as const,
      eiPoints: 25,
      eiDomain: "Self-Awareness & Recognition" as EIDomain,
      completed: false,
      competencyBoosts: { "Self-Awareness": 2, "Self-Management": 1, "Social Awareness": 0 },
    },
    {
      id: "fallback-2",
      title: "Patient Empathy Practice",
      description:
        "During patient interactions today, practice active listening and acknowledge patient emotions before responding.",
      type: "Training Module" as const,
      difficulty: "Intermediate" as const,
      eiPoints: 50,
      eiDomain: "Empathy & Patient Care" as EIDomain,
      completed: false,
      competencyBoosts: { "Social Awareness": 3, "Relationship Management": 1, "Self-Awareness": 0 },
    },
    {
      id: "fallback-3",
      title: "Stress Relief Breathing",
      description:
        "Practice 4-7-8 breathing technique (inhale 4s, hold 7s, exhale 8s) three times during high-stress moments.",
      type: "Daily Reflection" as const,
      difficulty: "Beginner" as const,
      eiPoints: 30,
      eiDomain: "Stress Management" as EIDomain,
      completed: false,
      competencyBoosts: { Resilience: 2, "Self-Management": 2, "Self-Awareness": 0 },
    },
    {
      id: "fallback-4",
      title: "Team Communication Exercise",
      description: "Have a brief check-in with a colleague today. Ask how they're feeling and offer support if needed.",
      type: "Training Module" as const,
      difficulty: "Intermediate" as const,
      eiPoints: 40,
      eiDomain: "Team Communication" as EIDomain,
      completed: false,
      competencyBoosts: { "Relationship Management": 2, "Social Awareness": 2, "Self-Awareness": 0 },
    },
  ],
  diary: [
    {
      id: "diary-fallback-1",
      title: "Pattern Recognition Exercise",
      description:
        "Review your recent diary entries and identify recurring emotional patterns. Write about one pattern you notice and how it affects your work.",
      type: "Reflective Practice" as const,
      difficulty: "Beginner" as const,
      eiPoints: 30,
      eiDomain: "Self-Awareness & Recognition" as EIDomain,
      completed: false,
      competencyBoosts: { "Self-Awareness": 3, "Self-Management": 1, "Social Awareness": 0 },
    },
    {
      id: "diary-fallback-2",
      title: "Emotional Processing Journal",
      description:
        "Take time to process the emotions expressed in your diary entries. Write about how you can work through these feelings constructively.",
      type: "Emotional Processing" as const,
      difficulty: "Intermediate" as const,
      eiPoints: 45,
      eiDomain: "Emotional Regulation" as EIDomain,
      completed: false,
      competencyBoosts: { "Self-Awareness": 2, "Self-Management": 2, "Resilience": 1 },
    },
  ],
  reflection: (currentChallenges: string) => [
    {
      id: "reflection-fallback-1",
      title: "Immediate Stress Management",
      description: `Based on your current challenges (${currentChallenges || "work stress"}), practice one stress management technique today during your shift.`,
      type: "Training Module" as const,
      difficulty: "Beginner" as const,
      eiPoints: 25,
      eiDomain: "Stress Management" as EIDomain,
      completed: false,
      competencyBoosts: { "Self-Management": 3, "Resilience": 2, "Self-Awareness": 0 },
    },
    {
      id: "reflection-fallback-2",
      title: "Challenge Response Strategy",
      description: `Develop a concrete action plan to address your current challenge: ${currentChallenges || "work stressors"}. Write down 3 specific steps you can take.`,
      type: "Training Module" as const,
      difficulty: "Intermediate" as const,
      eiPoints: 40,
      eiDomain: "Self-Management" as EIDomain,
      completed: false,
      competencyBoosts: { "Self-Management": 2, "Self-Awareness": 1, "Resilience": 2 },
    },
  ],
}

export class QuestAgent {
  private geminiService: GeminiService

  constructor(apiKey?: string) {
    this.geminiService = new GeminiService(apiKey)
  }

  /**
   * Generate quests based on request context
   */
  async generateQuests(request: QuestGenerationRequest): Promise<QuestGenerationResponse> {
    const startTime = Date.now()

    // Check if Gemini is available
    if (!this.geminiService.isAvailable()) {
      console.warn("Gemini API not available, using fallback quests")
      return this.generateFallbackResponse(request, "API key not configured")
    }

    try {
      // Build prompt based on source
      const prompt = this.buildPrompt(request)

      // Generate content using Gemini
      const text = await this.geminiService.generateContent(prompt)

      console.log("Gemini response received:", text.substring(0, 200) + "...")

      // Parse and validate response
      const parsedResponse = this.geminiService.parseJsonResponse<any>(text)

      // Validate structure
      if (!parsedResponse.quests || !Array.isArray(parsedResponse.quests)) {
        throw new Error("Invalid quest format received")
      }

      // Normalize quests
      const quests = this.normalizeQuests(parsedResponse.quests, request)

      // Ensure suggestions exist
      const suggestions = parsedResponse.suggestions || this.getDefaultSuggestions(request)

      console.log(`Successfully generated ${quests.length} quests`)

      return {
        quests,
        suggestions,
        usingFallback: false,
        model: "gemini-2.5-flash",
      }
    } catch (error) {
      console.error("Error generating quests:", error)
      return this.generateFallbackResponse(request, error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Build prompt based on request context
   */
  private buildPrompt(request: QuestGenerationRequest): string {
    const { nurseProfile, contextData, source } = request

    if (source === "diary" && contextData?.diaryEntries && contextData.diaryEntries.length > 0) {
      return this.buildDiaryPrompt(nurseProfile, contextData.diaryEntries)
    } else if (source === "reflection" && contextData?.reflection) {
      return this.buildReflectionPrompt(nurseProfile, contextData.reflection)
    } else {
      return this.buildGeneralPrompt(nurseProfile, contextData)
    }
  }

  /**
   * Build diary-based prompt
   */
  private buildDiaryPrompt(nurseProfile: any, diaryEntries: any[]): string {
    const diaryContent = diaryEntries
      .slice(0, 3)
      .map((entry: any, idx: number) => `Entry ${idx + 1}: "${entry.content}"`)
      .join("\n\n")

    return `You are an AI training module generator for SoloLvlUp, a digital EI (Emotional Intelligence) development platform for frontline nurses. Generate 3-4 personalized training modules based on DIARY ENTRY ANALYSIS for this nurse:

NURSE PROFILE:
- Name: ${nurseProfile.name}
- Level: ${nurseProfile.level || nurseProfile.competencyLevel}
- Current EI Competencies: Self-Awareness ${nurseProfile.stats?.["Self-Awareness"] || nurseProfile.competencies?.["Self-Awareness"]}, Self-Management ${nurseProfile.stats?.["Self-Management"] || nurseProfile.competencies?.["Self-Management"]}, Social Awareness ${nurseProfile.stats?.["Social Awareness"] || nurseProfile.competencies?.["Social Awareness"]}, Relationship Management ${nurseProfile.stats?.["Relationship Management"] || nurseProfile.competencies?.["Relationship Management"]}, Resilience ${nurseProfile.stats?.Resilience || nurseProfile.competencies?.Resilience}

DIARY ENTRIES (Narrative Analysis):
${diaryContent}

INSTRUCTIONS:
1. Create training modules that address the EMOTIONAL PATTERNS and THEMES identified in the diary entries
2. Focus on REFLECTIVE PRACTICES, SELF-AWARENESS, and EMOTIONAL PROCESSING
3. Make modules that help nurses UNDERSTAND and WORK THROUGH the experiences described
4. EI Development Points: Beginner (20-35), Intermediate (40-65), Advanced (70-100)

Return ONLY a valid JSON object with this EXACT structure:
{
  "quests": [
    {
      "title": "Reflective Module Title",
      "description": "Detailed description focusing on reflection and emotional processing",
      "type": "Reflective Practice|Emotional Processing|Pattern Recognition",
      "difficulty": "Beginner|Intermediate|Advanced",
      "eiPoints": 40,
      "eiDomain": "Self-Awareness & Recognition|Emotional Regulation",
      "competencyBoosts": {
        "Self-Awareness": 2,
        "Self-Management": 1,
        "Resilience": 1
      }
    }
  ],
  "suggestions": {
    "focusArea": "EI domain based on emotional patterns",
    "motivation": "Personalized message acknowledging their reflective journey",
    "emotionalGuidance": "Supportive guidance based on diary themes"
  }
}`
  }

  /**
   * Build reflection-based prompt
   */
  private buildReflectionPrompt(nurseProfile: any, reflection: any): string {
    return `You are an AI training module generator for SoloLvlUp, a digital EI (Emotional Intelligence) development platform for frontline nurses. Generate 3-4 personalized training modules based on STRUCTURED PERSONAL REFLECTION for this nurse:

NURSE PROFILE:
- Name: ${nurseProfile.name}
- Level: ${nurseProfile.level || nurseProfile.competencyLevel}
- Current EI Competencies: Self-Awareness ${nurseProfile.stats?.["Self-Awareness"] || nurseProfile.competencies?.["Self-Awareness"]}, Self-Management ${nurseProfile.stats?.["Self-Management"] || nurseProfile.competencies?.["Self-Management"]}

STRUCTURED PERSONAL REFLECTION:
- Current Mood: ${reflection.mood}
- Emotional State: ${reflection.emotionalState}
- Motivation Level: ${reflection.motivationLevel}/10
- Current Challenges: ${reflection.currentChallenges || "None specified"}

INSTRUCTIONS:
1. Create training modules that directly address the IMMEDIATE CHALLENGES and EMOTIONAL STATE
2. Focus on PRACTICAL TOOLS and ACTIONABLE STRATEGIES for current situations
3. Adjust difficulty based on MOTIVATION LEVEL (lower motivation = more supportive modules)
4. EI Development Points: Beginner (15-30), Intermediate (35-60), Advanced (65-100)

Return ONLY a valid JSON object with this EXACT structure:
{
  "quests": [
    {
      "title": "Action-Oriented Module Title",
      "description": "Detailed, actionable description with concrete steps",
      "type": "Training Module|Stress Management|Coping Strategy",
      "difficulty": "Beginner|Intermediate|Advanced",
      "eiPoints": 35,
      "eiDomain": "Self-Management|Stress Management|Emotional Regulation",
      "competencyBoosts": {
        "Self-Management": 2,
        "Resilience": 2
      }
    }
  ],
  "suggestions": {
    "focusArea": "EI domain based on current challenges",
    "motivation": "Personalized motivational message",
    "emotionalGuidance": "Supportive guidance for immediate challenges"
  }
}`
  }

  /**
   * Build general prompt
   */
  private buildGeneralPrompt(nurseProfile: any, contextData?: any): string {
    return `You are an AI training module generator for SoloLvlUp, a digital EI (Emotional Intelligence) development platform for frontline nurses. Generate 3-4 personalized training modules for this nurse:

NURSE PROFILE:
- Name: ${nurseProfile.name}
- Level: ${nurseProfile.level || nurseProfile.competencyLevel}
- Current EI Competencies: Self-Awareness ${nurseProfile.stats?.["Self-Awareness"] || nurseProfile.competencies?.["Self-Awareness"]}, Self-Management ${nurseProfile.stats?.["Self-Management"] || nurseProfile.competencies?.["Self-Management"]}, Social Awareness ${nurseProfile.stats?.["Social Awareness"] || nurseProfile.competencies?.["Social Awareness"]}, Relationship Management ${nurseProfile.stats?.["Relationship Management"] || nurseProfile.competencies?.["Relationship Management"]}

INSTRUCTIONS:
1. Create training modules that enhance the four EI domains: Self-Awareness, Self-Management, Social Awareness, Relationship Management
2. Focus on practical healthcare/nursing scenarios: patient interactions, team dynamics, stress management
3. Make modules achievable within a shift or day (1-3 hours)
4. EI Development Points: Beginner (15-30), Intermediate (35-60), Advanced (65-100)

Return ONLY a valid JSON object with this EXACT structure:
{
  "quests": [
    {
      "title": "Specific Module Title",
      "description": "Detailed, actionable description with clear steps",
      "type": "Daily Reflection|Training Module|Weekly Challenge",
      "difficulty": "Beginner|Intermediate|Advanced",
      "eiPoints": 35,
      "eiDomain": "Self-Awareness & Recognition|Emotional Regulation|Empathy & Patient Care|Team Communication|Stress Management",
      "competencyBoosts": {
        "Self-Awareness": 1,
        "Social Awareness": 2,
        "Resilience": 1
      }
    }
  ],
  "suggestions": {
    "focusArea": "Specific EI domain to focus on",
    "motivation": "Personalized motivational message",
    "emotionalGuidance": "Emotional support and guidance"
  }
}`
  }

  /**
   * Normalize quests to ensure all required fields
   */
  private normalizeQuests(quests: any[], request: QuestGenerationRequest): TrainingModule[] {
    return quests.map((quest: any, index: number) => ({
      id: quest.id || `ai-module-${Date.now()}-${index}`,
      title: quest.title || "EI Development Module",
      description: quest.description || "A training module to enhance your emotional intelligence competencies",
      type: quest.type || "Training Module",
      difficulty: quest.difficulty || "Intermediate",
      eiPoints: quest.eiPoints || quest.xp || 35,
      eiDomain: quest.eiDomain || quest.realm || "Self-Awareness & Recognition",
      completed: false,
      createdAt: new Date(),
      competencyBoosts: quest.competencyBoosts || quest.statBoosts || { "Self-Awareness": 1, "Self-Management": 1 },
      // Legacy fields for backward compatibility
      xp: quest.eiPoints || quest.xp || 35,
      realm: quest.eiDomain || quest.realm || "Self-Awareness & Recognition",
      statBoosts: quest.competencyBoosts || quest.statBoosts || { "Self-Awareness": 1, "Self-Management": 1 },
      // Add program context if available
      programId: request.contextData?.programContext?.programId,
      week: request.contextData?.programContext?.currentWeek,
    }))
  }

  /**
   * Generate fallback response when AI is unavailable
   */
  private generateFallbackResponse(request: QuestGenerationRequest, error: string): QuestGenerationResponse {
    let fallbackQuests: any[]
    let focusArea: string
    let motivation: string
    let emotionalGuidance: string

    if (request.source === "diary" && request.contextData?.diaryEntries) {
      fallbackQuests = FALLBACK_QUESTS.diary
      focusArea = "Emotional Patterns & Self-Discovery"
      motivation = "Using reflective training modules based on your diary entries."
      emotionalGuidance = "These reflective modules will help you understand and process emotional patterns."
    } else if (request.source === "reflection" && request.contextData?.reflection) {
      const challenges = request.contextData.reflection.currentChallenges || "work stress"
      fallbackQuests = FALLBACK_QUESTS.reflection(challenges)
      focusArea = "Immediate Challenges & Coping"
      motivation = "Using action-oriented modules based on your current reflection."
      emotionalGuidance = "These practical modules will help you address your current challenges."
    } else {
      fallbackQuests = FALLBACK_QUESTS.general
      focusArea = "General Growth"
      motivation = "Using curated training modules."
      emotionalGuidance = "These foundational modules will help you develop your emotional intelligence competencies."
    }

    // Normalize fallback quests
    const quests = fallbackQuests.map((q, index) => ({
      ...q,
      id: `${q.id}-${Date.now()}-${index}`,
      createdAt: new Date(),
      xp: q.eiPoints,
      realm: q.eiDomain,
      statBoosts: q.competencyBoosts,
    })) as TrainingModule[]

    return {
      quests,
      suggestions: {
        focusArea,
        motivation: `${motivation} ${error.includes("API key") ? "Add a valid GEMINI_API_KEY to your .env file for AI-generated personalized modules." : ""}`,
        emotionalGuidance,
      },
      usingFallback: true,
    }
  }

  /**
   * Get default suggestions
   */
  private getDefaultSuggestions(request: QuestGenerationRequest): {
    focusArea: string
    motivation: string
    emotionalGuidance: string
  } {
    return {
      focusArea: "Balanced EI Development",
      motivation: `Great progress, ${request.nurseProfile.name}! Complete these modules to enhance your emotional intelligence.`,
      emotionalGuidance: "Stay consistent with your daily reflections and celebrate your growth as a healthcare professional.",
    }
  }
}

// Export singleton instance
export const questAgent = new QuestAgent()
