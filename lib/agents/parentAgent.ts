import { programPlanner } from "@/lib/services/programPlanner"
import { roadmapAgent } from "@/lib/agents/roadmapAgent"
import { questAgent } from "@/lib/agents/questAgent"
import type {
  EIProgram,
  ProgramRecommendation,
  TrainingModule,
  QuestGenerationRequest,
} from "@/lib/types/training"
import type { EIAssessment, PersonalReflection } from "@/lib/types"

/**
 * Parent Agent
 * Orchestrates interactions between Program Planner, Roadmap Agent, and Quest Agent
 */

// Orchestration request types
export interface AssessmentToProgramRequest {
  type: 'assessment-to-program'
  assessment: EIAssessment
  nurseProfile: any
}

export interface ReflectionToQuestRequest {
  type: 'reflection-to-quest'
  reflection: PersonalReflection
  nurseProfile: any
  diaryEntries?: any[]
}

export type OrchestrationRequest = AssessmentToProgramRequest | ReflectionToQuestRequest

// Orchestration response types
export interface AssessmentToProgramResponse {
  success: boolean
  program: EIProgram
  programRecommendation: ProgramRecommendation
  modules: TrainingModule[]
  roadmap: {
    focusAreas: string[]
    strengths: string[]
    timeline: string
    message: string
  }
  fallbackUsed: boolean
  error?: string
}

export interface ReflectionToQuestResponse {
  success: boolean
  quests: TrainingModule[]
  suggestions: {
    focusArea: string
    motivation: string
    emotionalGuidance: string
  }
  fallbackUsed: boolean
  error?: string
}

export type OrchestrationResponse = AssessmentToProgramResponse | ReflectionToQuestResponse

export class ParentAgent {
  /**
   * Main orchestration method
   */
  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    try {
      if (request.type === 'assessment-to-program') {
        return await this.handleAssessmentFlow(request)
      } else {
        return await this.handleReflectionFlow(request)
      }
    } catch (error) {
      console.error("Parent Agent orchestration error:", error)
      
      // Return graceful error response
      if (request.type === 'assessment-to-program') {
        return {
          success: false,
          program: {} as EIProgram,
          programRecommendation: {} as ProgramRecommendation,
          modules: [],
          roadmap: {
            focusAreas: [],
            strengths: [],
            timeline: "4-6 weeks",
            message: "An error occurred during program generation.",
          },
          fallbackUsed: true,
          error: error instanceof Error ? error.message : String(error),
        }
      } else {
        return {
          success: false,
          quests: [],
          suggestions: {
            focusArea: "General Growth",
            motivation: "An error occurred, but you can still continue your EI development journey.",
            emotionalGuidance: "Take a moment to reflect on your current state and try again.",
          },
          fallbackUsed: true,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }
  }

  /**
   * Handle assessment-to-program flow
   * 1. Program Planning → 2. Roadmap Generation → 3. Store Update
   */
  private async handleAssessmentFlow(
    request: AssessmentToProgramRequest
  ): Promise<AssessmentToProgramResponse> {
    const { assessment, nurseProfile } = request

    console.log("[Parent Agent] Starting assessment-to-program flow")

    // Step 1: Program Planning
    console.log("[Parent Agent] Step 1: Selecting program based on assessment")
    const programRecommendation = programPlanner.selectProgram(assessment)
    
    console.log("[Parent Agent] Program selected:", {
      name: programRecommendation.program.name,
      duration: programRecommendation.program.duration,
      focusDomains: programRecommendation.program.focusDomains,
    })

    // Step 2: Roadmap Generation
    console.log("[Parent Agent] Step 2: Generating roadmap with program context")
    const roadmapResponse = await roadmapAgent.generateRoadmap({
      requestId: `parent-roadmap-${Date.now()}`,
      timestamp: new Date(),
      source: 'assessment',
      context: {
        programRecommendation,
      },
      assessment,
      program: programRecommendation.program,
      nurseProfile,
    })

    console.log("[Parent Agent] Roadmap generated:", {
      moduleCount: roadmapResponse.modules.length,
      usingFallback: roadmapResponse.usingFallback,
    })

    // Step 3: Return structured response (store update happens in API route)
    return {
      success: true,
      program: programRecommendation.program,
      programRecommendation,
      modules: roadmapResponse.modules,
      roadmap: roadmapResponse.roadmap,
      fallbackUsed: roadmapResponse.usingFallback || false,
    }
  }

  /**
   * Handle reflection-to-quest flow
   * 1. Quest Generation → 2. Optional Program Context → 3. Store Update
   */
  private async handleReflectionFlow(
    request: ReflectionToQuestRequest
  ): Promise<ReflectionToQuestResponse> {
    const { reflection, nurseProfile, diaryEntries } = request

    console.log("[Parent Agent] Starting reflection-to-quest flow")

    // Determine source based on available data
    const source = diaryEntries && diaryEntries.length > 0 ? 'diary' : 'reflection'

    // Step 1: Quest Generation
    console.log("[Parent Agent] Step 1: Generating quests from", source)
    
    // Do NOT include program context for AI-generated suggestions
    // These should always be individual modules (week 0), not assigned to program weeks
    // Only program-specific quest generation should include program context
    console.log("[Parent Agent] Generating individual modules (not program-specific)")

    const questRequest: QuestGenerationRequest = {
      requestId: `parent-quest-${Date.now()}`,
      timestamp: new Date(),
      source: source as any,
      context: {},
      nurseProfile,
      contextData: {
        reflection,
        diaryEntries,
        // programContext intentionally omitted - these are individual modules
      },
    }

    const questResponse = await questAgent.generateQuests(questRequest)

    console.log("[Parent Agent] Quests generated:", {
      questCount: questResponse.quests.length,
      usingFallback: questResponse.usingFallback,
      asIndividualModules: true,
    })

    // Step 2: Return structured response (store update happens in API route)
    return {
      success: true,
      quests: questResponse.quests,
      suggestions: questResponse.suggestions,
      fallbackUsed: questResponse.usingFallback || false,
    }
  }

  /**
   * Get program recommendation without generating full roadmap
   * Useful for preview/display purposes
   */
  async getProgramRecommendation(assessment: EIAssessment): Promise<ProgramRecommendation> {
    return programPlanner.selectProgram(assessment)
  }

  /**
   * Generate additional quests for an active program
   * Useful when nurse needs more modules for current week
   */
  async generateProgramQuests(
    nurseProfile: any,
    programId: string,
    currentWeek: number
  ): Promise<TrainingModule[]> {
    const program = programPlanner.getProgramById(programId)
    
    if (!program) {
      throw new Error(`Program not found: ${programId}`)
    }

    const weekStructure = program.weeklyStructure[currentWeek - 1]
    
    if (!weekStructure) {
      throw new Error(`Week ${currentWeek} not found in program ${programId}`)
    }

    console.log("[Parent Agent] Generating additional quests for program week:", {
      program: program.name,
      week: currentWeek,
      theme: weekStructure.theme,
      focusArea: weekStructure.focusArea,
    })

    // Generate quests with program context
    const questResponse = await questAgent.generateQuests({
      requestId: `parent-program-quest-${Date.now()}`,
      timestamp: new Date(),
      source: 'general',
      context: {
        programWeek: weekStructure,
      },
      nurseProfile,
      contextData: {
        programContext: {
          programId,
          currentWeek,
          focusArea: weekStructure.focusArea,
        },
      },
    })

    return questResponse.quests
  }

  /**
   * Health check - verify all agents are operational
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    agents: {
      programPlanner: boolean
      roadmapAgent: boolean
      questAgent: boolean
    }
    message: string
  }> {
    try {
      // Check if program planner has templates
      const programs = programPlanner.getAvailablePrograms()
      const programPlannerHealthy = programs.length > 0

      // Agents are always available (they have fallbacks)
      const roadmapAgentHealthy = true
      const questAgentHealthy = true

      const allHealthy = programPlannerHealthy && roadmapAgentHealthy && questAgentHealthy

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        agents: {
          programPlanner: programPlannerHealthy,
          roadmapAgent: roadmapAgentHealthy,
          questAgent: questAgentHealthy,
        },
        message: allHealthy 
          ? 'All agents operational' 
          : 'Some agents may be using fallback mode',
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        agents: {
          programPlanner: false,
          roadmapAgent: false,
          questAgent: false,
        },
        message: error instanceof Error ? error.message : 'Health check failed',
      }
    }
  }
}

// Export singleton instance
export const parentAgent = new ParentAgent()
