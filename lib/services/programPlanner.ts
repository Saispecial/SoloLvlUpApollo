import type { EIProgram, EIDomain, ProgramRecommendation, WeeklyStructure } from "@/lib/types/training"
import type { EIAssessment } from "@/lib/types"

/**
 * Program Planner Service
 * Determines appropriate EI training programs based on assessment scores
 */

interface ProgramPlannerConfig {
  scoringThresholds: {
    intensive: number    // < 40 = needs intensive work
    focused: number      // 40-70 = needs focused development
    maintenance: number  // > 70 = maintenance level
  }
}

const DEFAULT_CONFIG: ProgramPlannerConfig = {
  scoringThresholds: {
    intensive: 40,
    focused: 70,
    maintenance: 100,
  },
}

// Program Templates
const PROGRAM_TEMPLATES: EIProgram[] = [
  {
    id: "self-management-intensive-6w",
    name: "Self-Management Intensive Program",
    description: "6-week intensive program focusing on emotional regulation and stress management for nurses with low self-management scores",
    duration: 6,
    focusDomains: ["Emotional Regulation", "Stress Management"],
    targetScoreRange: { min: 0, max: 40 },
    totalModules: 18,
    estimatedHours: 12,
    weeklyStructure: [
      { week: 1, theme: "Understanding Emotional Triggers", focusArea: "Self-Awareness & Recognition", moduleCount: 3, targetCompetencies: ["Self-Awareness"], milestones: ["Identify 3 personal triggers"] },
      { week: 2, theme: "Basic Stress Management Techniques", focusArea: "Stress Management", moduleCount: 3, targetCompetencies: ["Self-Management", "Resilience"], milestones: ["Practice 4-7-8 breathing daily"] },
      { week: 3, theme: "Emotional Regulation Strategies", focusArea: "Emotional Regulation", moduleCount: 3, targetCompetencies: ["Self-Management"], milestones: ["Use regulation technique 5 times"] },
      { week: 4, theme: "Building Resilience", focusArea: "Stress Management", moduleCount: 3, targetCompetencies: ["Resilience", "Self-Management"], milestones: ["Complete resilience assessment"] },
      { week: 5, theme: "Advanced Coping Strategies", focusArea: "Emotional Regulation", moduleCount: 3, targetCompetencies: ["Self-Management", "Resilience"], milestones: ["Develop personal coping plan"] },
      { week: 6, theme: "Integration and Mastery", focusArea: "Stress Management", moduleCount: 3, targetCompetencies: ["Self-Management", "Resilience"], milestones: ["Demonstrate consistent practice"] },
    ],
  },
  {
    id: "social-awareness-intensive-6w",
    name: "Social Awareness & Empathy Intensive Program",
    description: "6-week intensive program focusing on empathy and patient care for nurses with low social awareness scores",
    duration: 6,
    focusDomains: ["Empathy & Patient Care", "Team Communication"],
    targetScoreRange: { min: 0, max: 40 },
    totalModules: 18,
    estimatedHours: 12,
    weeklyStructure: [
      { week: 1, theme: "Understanding Patient Emotions", focusArea: "Empathy & Patient Care", moduleCount: 3, targetCompetencies: ["Social Awareness"], milestones: ["Practice active listening"] },
      { week: 2, theme: "Perspective-Taking Skills", focusArea: "Empathy & Patient Care", moduleCount: 3, targetCompetencies: ["Social Awareness"], milestones: ["Complete 5 perspective exercises"] },
      { week: 3, theme: "Reading Emotional Cues", focusArea: "Empathy & Patient Care", moduleCount: 3, targetCompetencies: ["Social Awareness"], milestones: ["Identify non-verbal cues"] },
      { week: 4, theme: "Team Emotional Awareness", focusArea: "Team Communication", moduleCount: 3, targetCompetencies: ["Social Awareness", "Relationship Management"], milestones: ["Check in with 3 colleagues"] },
      { week: 5, theme: "Empathetic Communication", focusArea: "Empathy & Patient Care", moduleCount: 3, targetCompetencies: ["Social Awareness", "Relationship Management"], milestones: ["Use empathetic phrases daily"] },
      { week: 6, theme: "Integration and Mastery", focusArea: "Empathy & Patient Care", moduleCount: 3, targetCompetencies: ["Social Awareness"], milestones: ["Demonstrate consistent empathy"] },
    ],
  },
  {
    id: "comprehensive-balanced-6w",
    name: "Comprehensive EI Development Program",
    description: "6-week comprehensive program for nurses with multiple areas needing development",
    duration: 6,
    focusDomains: ["Self-Awareness & Recognition", "Emotional Regulation", "Empathy & Patient Care", "Team Communication"],
    targetScoreRange: { min: 0, max: 50 },
    totalModules: 18,
    estimatedHours: 14,
    weeklyStructure: [
      { week: 1, theme: "Self-Awareness Foundation", focusArea: "Self-Awareness & Recognition", moduleCount: 3, targetCompetencies: ["Self-Awareness"], milestones: ["Complete emotional check-ins"] },
      { week: 2, theme: "Emotional Regulation Basics", focusArea: "Emotional Regulation", moduleCount: 3, targetCompetencies: ["Self-Management"], milestones: ["Practice regulation techniques"] },
      { week: 3, theme: "Empathy Development", focusArea: "Empathy & Patient Care", moduleCount: 3, targetCompetencies: ["Social Awareness"], milestones: ["Practice patient empathy"] },
      { week: 4, theme: "Team Communication", focusArea: "Team Communication", moduleCount: 3, targetCompetencies: ["Relationship Management"], milestones: ["Improve team interactions"] },
      { week: 5, theme: "Stress Management", focusArea: "Stress Management", moduleCount: 3, targetCompetencies: ["Resilience", "Self-Management"], milestones: ["Develop stress management plan"] },
      { week: 6, theme: "Integration and Practice", focusArea: "Self-Awareness & Recognition", moduleCount: 3, targetCompetencies: ["Self-Awareness", "Self-Management"], milestones: ["Demonstrate balanced EI"] },
    ],
  },
  {
    id: "focused-development-4w",
    name: "Focused EI Development Program",
    description: "4-week focused program for nurses with moderate scores needing targeted improvement",
    duration: 4,
    focusDomains: ["Self-Awareness & Recognition", "Emotional Regulation"],
    targetScoreRange: { min: 40, max: 70 },
    totalModules: 12,
    estimatedHours: 8,
    weeklyStructure: [
      { week: 1, theme: "Strengthening Self-Awareness", focusArea: "Self-Awareness & Recognition", moduleCount: 3, targetCompetencies: ["Self-Awareness"], milestones: ["Deepen emotional awareness"] },
      { week: 2, theme: "Enhancing Regulation Skills", focusArea: "Emotional Regulation", moduleCount: 3, targetCompetencies: ["Self-Management"], milestones: ["Refine regulation strategies"] },
      { week: 3, theme: "Building on Strengths", focusArea: "Self-Awareness & Recognition", moduleCount: 3, targetCompetencies: ["Self-Awareness", "Self-Management"], milestones: ["Leverage existing skills"] },
      { week: 4, theme: "Mastery and Integration", focusArea: "Emotional Regulation", moduleCount: 3, targetCompetencies: ["Self-Management", "Resilience"], milestones: ["Demonstrate mastery"] },
    ],
  },
  {
    id: "maintenance-excellence-2w",
    name: "EI Maintenance & Excellence Program",
    description: "2-week maintenance program for nurses with strong EI scores",
    duration: 2,
    focusDomains: ["Self-Awareness & Recognition", "Empathy & Patient Care"],
    targetScoreRange: { min: 70, max: 100 },
    totalModules: 6,
    estimatedHours: 4,
    weeklyStructure: [
      { week: 1, theme: "Maintaining Excellence", focusArea: "Self-Awareness & Recognition", moduleCount: 3, targetCompetencies: ["Self-Awareness", "Self-Management"], milestones: ["Continue best practices"] },
      { week: 2, theme: "Advanced Application", focusArea: "Empathy & Patient Care", moduleCount: 3, targetCompetencies: ["Social Awareness", "Relationship Management"], milestones: ["Mentor others"] },
    ],
  },
]

export class ProgramPlanner {
  private config: ProgramPlannerConfig

  constructor(config: ProgramPlannerConfig = DEFAULT_CONFIG) {
    this.config = config
  }

  /**
   * Select appropriate program based on EI assessment
   */
  selectProgram(assessment: EIAssessment): ProgramRecommendation {
    const lowestDomain = this.findLowestScoringDomain(assessment.domainScores)
    const averageScore = this.calculateAverageScore(assessment.domainScores)
    const multipleGaps = this.countLowScoringDomains(assessment.domainScores, 50)

    // Determine program based on scores
    let selectedProgram: EIProgram

    if (lowestDomain.score < this.config.scoringThresholds.intensive) {
      // Intensive 6-week program needed
      if (multipleGaps >= 2) {
        selectedProgram = PROGRAM_TEMPLATES.find(p => p.id === "comprehensive-balanced-6w")!
      } else if (lowestDomain.domain.includes("Self-Management") || lowestDomain.domain.includes("selfManagement")) {
        selectedProgram = PROGRAM_TEMPLATES.find(p => p.id === "self-management-intensive-6w")!
      } else {
        selectedProgram = PROGRAM_TEMPLATES.find(p => p.id === "social-awareness-intensive-6w")!
      }
    } else if (averageScore < this.config.scoringThresholds.focused) {
      // Focused 4-week program
      selectedProgram = PROGRAM_TEMPLATES.find(p => p.id === "focused-development-4w")!
    } else {
      // Maintenance 2-week program
      selectedProgram = PROGRAM_TEMPLATES.find(p => p.id === "maintenance-excellence-2w")!
    }

    // Build recommendation
    return {
      program: selectedProgram,
      rationale: this.buildRationale(assessment, lowestDomain, averageScore, multipleGaps),
      priorityDomains: this.identifyPriorityDomains(assessment),
      estimatedOutcomes: this.estimateOutcomes(selectedProgram, assessment),
    }
  }

  private findLowestScoringDomain(scores: EIAssessment['domainScores']): {
    domain: string
    score: number
  } {
    const entries = Object.entries(scores)
    const lowest = entries.reduce((min, [domain, score]) => 
      score < min.score ? { domain, score } : min,
      { domain: entries[0][0], score: entries[0][1] }
    )
    return lowest
  }

  private calculateAverageScore(scores: EIAssessment['domainScores']): number {
    const values = Object.values(scores)
    return values.reduce((sum, score) => sum + score, 0) / values.length
  }

  private countLowScoringDomains(scores: EIAssessment['domainScores'], threshold: number): number {
    return Object.values(scores).filter(score => score < threshold).length
  }

  private buildRationale(
    assessment: EIAssessment,
    lowestDomain: { domain: string; score: number },
    averageScore: number,
    multipleGaps: number
  ): string {
    if (lowestDomain.score < 40) {
      if (multipleGaps >= 2) {
        return `Your assessment shows multiple areas needing development (${multipleGaps} domains below 50). A comprehensive 6-week program will provide balanced growth across all EI competencies.`
      }
      return `Your ${lowestDomain.domain} score (${Math.round(lowestDomain.score)}) indicates a need for intensive development. This 6-week program focuses specifically on building these foundational skills.`
    } else if (averageScore < 70) {
      return `Your overall EI profile shows moderate development needs (average: ${Math.round(averageScore)}). This 4-week focused program will strengthen your ${lowestDomain.domain} while building on your existing strengths.`
    } else {
      return `Your strong EI profile (average: ${Math.round(averageScore)}) indicates you're ready for a maintenance program. This 2-week program will help you maintain excellence and continue growing.`
    }
  }

  private identifyPriorityDomains(assessment: EIAssessment): EIDomain[] {
    const domainMapping: Record<string, EIDomain> = {
      selfAwareness: "Self-Awareness & Recognition",
      selfManagement: "Emotional Regulation",
      socialAwareness: "Empathy & Patient Care",
      relationshipManagement: "Team Communication",
    }

    const sortedDomains = Object.entries(assessment.domainScores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2)
      .map(([domain]) => domainMapping[domain])

    return sortedDomains
  }

  private estimateOutcomes(program: EIProgram, assessment: EIAssessment): {
    domain: EIDomain
    expectedImprovement: number
  }[] {
    return program.focusDomains.map(domain => ({
      domain,
      expectedImprovement: program.duration === 6 ? 15 : program.duration === 4 ? 10 : 5,
    }))
  }

  /**
   * Get all available program templates
   */
  getAvailablePrograms(): EIProgram[] {
    return PROGRAM_TEMPLATES
  }

  /**
   * Get program by ID
   */
  getProgramById(programId: string): EIProgram | undefined {
    return PROGRAM_TEMPLATES.find(p => p.id === programId)
  }
}

// Export singleton instance
export const programPlanner = new ProgramPlanner()
