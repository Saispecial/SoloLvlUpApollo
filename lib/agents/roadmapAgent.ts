import { GeminiService } from "@/lib/llm/gemini-api"
import { programPlanner } from "@/lib/services/programPlanner"
import type {
  RoadmapGenerationRequest,
  RoadmapGenerationResponse,
  TrainingModule,
  EIDomain,
  EIProgram,
} from "@/lib/types/training"
import type { EIAssessment } from "@/lib/types"

/**
 * Roadmap Agent
 * Generates structured module sequences for EI development programs
 */

export class RoadmapAgent {
  private geminiService: GeminiService

  constructor(apiKey?: string) {
    this.geminiService = new GeminiService(apiKey)
  }

  /**
   * Generate roadmap based on assessment and optional program
   */
  async generateRoadmap(request: RoadmapGenerationRequest): Promise<RoadmapGenerationResponse> {
    const { assessment, program, nurseProfile } = request

    // If no program provided, use program planner to select one
    const selectedProgram = program || programPlanner.selectProgram(assessment).program

    console.log(`Generating roadmap for program: ${selectedProgram.name}`)

    // Check if Gemini is available
    if (!this.geminiService.isAvailable()) {
      console.warn("Gemini API not available, using fallback roadmap")
      return this.generateFallbackRoadmap(assessment, selectedProgram)
    }

    try {
      // Build prompt
      const prompt = this.buildPrompt(assessment, selectedProgram, nurseProfile)

      // Generate content using Gemini
      const text = await this.geminiService.generateContent(prompt)

      console.log("Gemini roadmap response received:", text.substring(0, 200) + "...")

      // Parse response
      const parsedResponse = this.geminiService.parseJsonResponse<any>(text)

      // Validate structure
      if (!parsedResponse.modules || !Array.isArray(parsedResponse.modules)) {
        throw new Error("Invalid roadmap format")
      }

      // Normalize modules with program context
      const modules = this.normalizeModules(parsedResponse.modules, assessment, selectedProgram)

      // Build roadmap metadata
      const roadmap = parsedResponse.roadmap || {
        focusAreas: assessment.gaps,
        strengths: assessment.strengths,
        timeline: `${selectedProgram.duration} weeks`,
        message: `Your personalized ${selectedProgram.name} is ready!`,
      }

      console.log(`Successfully generated ${modules.length} modules for roadmap`)

      return {
        modules,
        roadmap,
        usingFallback: false,
      }
    } catch (error) {
      console.error("Error generating roadmap:", error)
      return this.generateFallbackRoadmap(assessment, selectedProgram)
    }
  }

  /**
   * Build prompt for roadmap generation
   */
  private buildPrompt(assessment: EIAssessment, program: EIProgram, nurseProfile: any): string {
    return `You are an AI training module generator for SoloLvlUp, a healthcare EI development platform. Generate a personalized development roadmap based on this EI assessment and program structure:

ASSESSMENT RESULTS:
- Tool: ${assessment.tool}
- Overall Baseline Score: ${assessment.baselineScore}/100
- Domain Scores:
  * Self-Awareness: ${assessment.domainScores.selfAwareness}/100 ${this.getScoreLabel(assessment.domainScores.selfAwareness)}
  * Self-Management: ${assessment.domainScores.selfManagement}/100 ${this.getScoreLabel(assessment.domainScores.selfManagement)}
  * Social Awareness: ${assessment.domainScores.socialAwareness}/100 ${this.getScoreLabel(assessment.domainScores.socialAwareness)}
  * Relationship Management: ${assessment.domainScores.relationshipManagement}/100 ${this.getScoreLabel(assessment.domainScores.relationshipManagement)}
- Strengths: ${assessment.strengths.join(", ")}
- Development Areas: ${assessment.gaps.join(", ")}

PROGRAM STRUCTURE:
- Program: ${program.name}
- Duration: ${program.duration} weeks
- Focus Domains: ${program.focusDomains.join(", ")}
- Total Modules: ${program.totalModules}

WEEKLY STRUCTURE:
${program.weeklyStructure.map(week => `Week ${week.week}: ${week.theme} (${week.focusArea}) - ${week.moduleCount} modules`).join("\n")}

${nurseProfile ? `NURSE PROFILE:
- Name: ${nurseProfile.name}
- Level: ${nurseProfile.level || nurseProfile.competencyLevel || 1}
- Current Competencies: ${JSON.stringify(nurseProfile.stats || nurseProfile.competencies || {})}
` : ""}

INSTRUCTIONS:
1. Generate ${program.totalModules} training modules following the weekly structure
2. Assign each module to a specific week and day based on the program structure
3. Prioritize domains with scores BELOW 50 (create more modules for these areas)
4. Adjust difficulty based on domain scores:
   - Scores < 40: "Beginner" modules (40-60 points)
   - Scores 40-60: "Intermediate" modules (35-50 points)
   - Scores > 60: "Advanced" modules (30-40 points)
5. Focus competency boosts on the LOWEST scoring domains
6. Make modules practical for healthcare/nursing settings
7. Ensure modules are achievable within a shift or day

Return ONLY a valid JSON object with this EXACT structure:
{
  "modules": [
    {
      "title": "Specific Module Title",
      "description": "Detailed, actionable description for nurses",
      "type": "Training Module|Weekly Challenge|Professional Goal",
      "difficulty": "Beginner|Intermediate|Advanced",
      "eiPoints": 35,
      "eiDomain": "Self-Awareness & Recognition|Emotional Regulation|Empathy & Patient Care|Team Communication|Stress Management",
      "week": 1,
      "day": 1,
      "competencyBoosts": {
        "Self-Awareness": 2,
        "Self-Management": 1,
        "Resilience": 1
      }
    }
  ],
  "roadmap": {
    "focusAreas": ["List of areas to focus on"],
    "strengths": ["List of strengths to leverage"],
    "timeline": "${program.duration} weeks",
    "message": "Personalized roadmap message"
  }
}`
  }

  /**
   * Get score label for display
   */
  private getScoreLabel(score: number): string {
    if (score < 50) return "(NEEDS IMPROVEMENT)"
    if (score < 70) return "(MODERATE)"
    return "(STRONG)"
  }

  /**
   * Normalize modules with program context and score-based adjustments
   */
  private normalizeModules(
    modules: any[],
    assessment: EIAssessment,
    program: EIProgram
  ): TrainingModule[] {
    return modules.map((module: any, index: number) => {
      // Determine which domain this module targets
      const domain = module.eiDomain || module.realm || "Self-Awareness & Recognition"
      const domainScore = this.getDomainScore(domain, assessment)

      // Adjust difficulty and points based on actual EI score
      let adjustedDifficulty = module.difficulty || "Intermediate"
      let adjustedPoints = module.eiPoints || module.xp || 35

      if (domainScore < 40) {
        adjustedDifficulty = "Beginner"
        adjustedPoints = Math.max(40, adjustedPoints)
      } else if (domainScore < 60) {
        adjustedDifficulty = "Intermediate"
        adjustedPoints = Math.max(35, adjustedPoints)
      } else {
        adjustedDifficulty = "Advanced"
        adjustedPoints = Math.max(30, adjustedPoints)
      }

      return {
        id: module.id || `roadmap-module-${Date.now()}-${index}`,
        title: module.title || "EI Development Module",
        description: module.description || "A training module to enhance your emotional intelligence",
        type: module.type || "Training Module",
        difficulty: adjustedDifficulty,
        eiPoints: adjustedPoints,
        eiDomain: domain as EIDomain,
        completed: false,
        createdAt: new Date(),
        competencyBoosts: module.competencyBoosts || module.statBoosts || {},
        // Program context
        programId: program.id,
        week: module.week || Math.floor(index / 3) + 1, // Default: 3 modules per week
        day: module.day || (index % 3) + 1,
        // Legacy fields
        xp: adjustedPoints,
        realm: domain as EIDomain,
        statBoosts: module.competencyBoosts || module.statBoosts || {},
      }
    })
  }

  /**
   * Get domain score from assessment
   */
  private getDomainScore(domain: string, assessment: EIAssessment): number {
    if (domain.includes("Self-Awareness")) return assessment.domainScores.selfAwareness
    if (domain.includes("Self-Management") || domain.includes("Emotional Regulation") || domain.includes("Stress")) {
      return assessment.domainScores.selfManagement
    }
    if (domain.includes("Social Awareness") || domain.includes("Empathy")) {
      return assessment.domainScores.socialAwareness
    }
    if (domain.includes("Relationship") || domain.includes("Team")) {
      return assessment.domainScores.relationshipManagement
    }
    return 50 // default
  }

  /**
   * Generate fallback roadmap when AI is unavailable
   */
  private generateFallbackRoadmap(assessment: EIAssessment, program: EIProgram): RoadmapGenerationResponse {
    const modules: TrainingModule[] = []

    // Generate modules based on assessment gaps
    assessment.gaps.forEach((gap, gapIndex) => {
      const domain = gap.toLowerCase()
      let moduleTemplate: Partial<TrainingModule> | null = null

      if (domain.includes("self-awareness") || domain.includes("awareness")) {
        moduleTemplate = {
          title: "Emotional Self-Awareness Practice",
          description:
            "Spend 15 minutes each day identifying and labeling your emotions. Keep a brief journal of emotional triggers during your shift.",
          type: "Training Module",
          difficulty: "Beginner",
          eiPoints: 30,
          eiDomain: "Self-Awareness & Recognition",
          competencyBoosts: { "Self-Awareness": 3, "Self-Management": 1 },
        }
      } else if (domain.includes("self-management") || domain.includes("management")) {
        moduleTemplate = {
          title: "Stress Response Regulation",
          description:
            "Practice the 4-7-8 breathing technique during high-stress moments. Identify three stress triggers and develop coping strategies.",
          type: "Training Module",
          difficulty: "Intermediate",
          eiPoints: 45,
          eiDomain: "Stress Management",
          competencyBoosts: { "Self-Management": 3, "Self-Awareness": 1, "Resilience": 2 },
        }
      } else if (domain.includes("social")) {
        moduleTemplate = {
          title: "Patient Empathy Deepening",
          description:
            "During patient interactions, practice perspective-taking. After each shift, reflect on one patient's emotional experience.",
          type: "Training Module",
          difficulty: "Intermediate",
          eiPoints: 40,
          eiDomain: "Empathy & Patient Care",
          competencyBoosts: { "Social Awareness": 3, "Relationship Management": 1 },
        }
      } else if (domain.includes("relationship")) {
        moduleTemplate = {
          title: "Team Communication Enhancement",
          description:
            "Practice active listening with colleagues. Initiate one supportive check-in conversation per shift with a team member.",
          type: "Training Module",
          difficulty: "Intermediate",
          eiPoints: 50,
          eiDomain: "Team Communication",
          competencyBoosts: { "Relationship Management": 3, "Social Awareness": 2 },
        }
      }

      if (moduleTemplate) {
        modules.push({
          id: `roadmap-fallback-${Date.now()}-${gapIndex}`,
          ...moduleTemplate,
          completed: false,
          createdAt: new Date(),
          programId: program.id,
          week: Math.floor(gapIndex / 3) + 1,
          day: (gapIndex % 3) + 1,
          xp: moduleTemplate.eiPoints,
          realm: moduleTemplate.eiDomain,
          statBoosts: moduleTemplate.competencyBoosts,
        } as TrainingModule)
      }
    })

    // Add balanced modules if we don't have enough
    if (modules.length < 2) {
      modules.push(
        {
          id: `roadmap-balanced-1-${Date.now()}`,
          title: "Comprehensive EI Development",
          description:
            "Complete a daily reflection combining all four EI domains. Focus on one specific interaction where you applied emotional intelligence.",
          type: "Training Module",
          difficulty: "Intermediate",
          eiPoints: 35,
          eiDomain: "Self-Awareness & Recognition",
          completed: false,
          createdAt: new Date(),
          competencyBoosts: { "Self-Awareness": 1, "Self-Management": 1, "Social Awareness": 1, "Relationship Management": 1 },
          programId: program.id,
          week: 1,
          day: 1,
          xp: 35,
          realm: "Self-Awareness & Recognition",
          statBoosts: { "Self-Awareness": 1, "Self-Management": 1, "Social Awareness": 1, "Relationship Management": 1 },
        },
        {
          id: `roadmap-balanced-2-${Date.now()}`,
          title: "Weekly EI Growth Challenge",
          description: "Set one specific EI goal for the week. Track your progress daily and reflect on improvements at week's end.",
          type: "Weekly Challenge",
          difficulty: "Advanced",
          eiPoints: 60,
          eiDomain: "Emotional Regulation",
          completed: false,
          createdAt: new Date(),
          competencyBoosts: { "Self-Awareness": 2, "Self-Management": 2, "Social Awareness": 1, "Relationship Management": 1 },
          programId: program.id,
          week: 2,
          day: 1,
          xp: 60,
          realm: "Emotional Regulation",
          statBoosts: { "Self-Awareness": 2, "Self-Management": 2, "Social Awareness": 1, "Relationship Management": 1 },
        }
      )
    }

    return {
      modules,
      roadmap: {
        focusAreas: assessment.gaps,
        strengths: assessment.strengths,
        timeline: `${program.duration} weeks`,
        message: `This ${program.name} addresses your development areas while building on your strengths.`,
      },
      usingFallback: true,
    }
  }
}

// Export singleton instance
export const roadmapAgent = new RoadmapAgent()
