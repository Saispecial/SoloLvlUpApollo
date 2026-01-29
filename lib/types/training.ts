/**
 * Training Module Types
 * Consolidated EI-related types for the training system
 */

// Core EI Competencies
export interface EICompetencies {
  "Self-Awareness": number        // Ability to recognize one's own emotions, triggers, and internal states
  "Self-Management": number        // Ability to regulate emotions, stress, impulses, and behavior
  "Social Awareness": number       // Ability to perceive emotions of patients, peers, and environment
  "Relationship Management": number // Ability to communicate, resolve conflict, and maintain trust
  "Clinical Competence": number    // Emotionally informed decision-making in clinical settings
  "Resilience": number             // Capacity to recover from stress, fatigue, and emotional load
}

// EI Domains (Training Focus Areas)
export type EIDomain =
  | "Self-Awareness & Recognition"
  | "Emotional Regulation"
  | "Empathy & Patient Care"
  | "Team Communication"
  | "Stress Management"

// Training Module Types
export type TrainingModuleType = 
  | "Daily Reflection" 
  | "Training Module" 
  | "Weekly Challenge" 
  | "Professional Goal"

export type ModuleDifficulty = 
  | "Beginner" 
  | "Intermediate" 
  | "Advanced" 
  | "Professional Milestone"

// Training Module Interface
export interface TrainingModule {
  // Core identification
  id: string
  title: string
  description: string
  
  // EI Context
  eiPoints: number
  eiDomain: EIDomain
  difficulty: ModuleDifficulty
  type: TrainingModuleType
  
  // Program Context (for structured programs)
  programId?: string
  week?: number
  day?: number
  programPhase?: 'foundation' | 'development' | 'mastery'
  prerequisites?: string[]
  
  // Competency Impact
  competencyBoosts: Partial<EICompetencies>
  estimatedDuration?: number // minutes
  
  // Lifecycle
  completed: boolean
  createdAt: Date
  completedAt?: Date
  startedAt?: Date
  reflectionNote?: string
  dueDate?: Date
  recurring?: boolean
  isOverdue?: boolean
  
  // Backward compatibility (legacy)
  xp?: number
  realm?: EIDomain
  statBoosts?: Partial<EICompetencies>
}

// EI Program Structure
export interface EIProgram {
  id: string
  name: string
  description: string
  duration: number // weeks
  focusDomains: EIDomain[]
  targetScoreRange: {
    min: number
    max: number
  }
  weeklyStructure: WeeklyStructure[]
  totalModules: number
  estimatedHours: number
}

export interface WeeklyStructure {
  week: number
  theme: string
  focusArea: EIDomain
  moduleCount: number
  targetCompetencies: string[]
  milestones: string[]
}

// Program Recommendation
export interface ProgramRecommendation {
  program: EIProgram
  rationale: string
  priorityDomains: EIDomain[]
  estimatedOutcomes: {
    domain: EIDomain
    expectedImprovement: number
  }[]
}

// Agent Communication Types
export interface AgentRequest {
  requestId: string
  timestamp: Date
  source: 'assessment' | 'reflection' | 'diary' | 'general'
  context: Record<string, any>
}

export interface AgentResponse<T> {
  requestId: string
  success: boolean
  data?: T
  error?: string
  fallbackUsed: boolean
  processingTime: number
}

// Quest Generation Types
export interface QuestGenerationRequest extends AgentRequest {
  nurseProfile: any // NurseProfile from main types
  contextData?: {
    reflection?: any // PersonalReflection
    diaryEntries?: any[] // DiaryEntry[]
    programContext?: {
      programId: string
      currentWeek: number
      focusArea: EIDomain
    }
  }
}

export interface QuestGenerationResponse {
  quests: TrainingModule[]
  suggestions: {
    focusArea: string
    motivation: string
    emotionalGuidance: string
  }
  usingFallback?: boolean
  model?: string
}

// Roadmap Generation Types
export interface RoadmapGenerationRequest extends AgentRequest {
  assessment: any // EIAssessment from main types
  program?: EIProgram
  nurseProfile: any // NurseProfile
}

export interface RoadmapGenerationResponse {
  modules: TrainingModule[]
  roadmap: {
    focusAreas: string[]
    strengths: string[]
    timeline: string
    message: string
  }
  usingFallback?: boolean
}

// Legacy type aliases for backward compatibility
export type Quest = TrainingModule
export type QuestType = TrainingModuleType
export type QuestDifficulty = ModuleDifficulty
export type Realm = EIDomain
