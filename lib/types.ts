// EI Competencies (formerly PlayerStats)
export interface EICompetencies {
  "Self-Awareness": number
  "Self-Management": number
  "Social Awareness": number
  "Relationship Management": number
  "Clinical Competence": number
  Resilience: number
}

// Legacy alias for backward compatibility during migration
export type PlayerStats = EICompetencies
export type NurseStats = EICompetencies

// Nurse Profile (formerly PlayerProfile)
export interface NurseProfile {
  competencyLevel: number // formerly level
  professionalRank: "Developing" | "Competent" | "Proficient" | "Advanced" | "Expert" | "Master" // formerly rank
  eiDevelopmentPoints: number // formerly xp
  totalEIPoints: number // formerly totalXp
  competencies: EICompetencies // formerly stats
  nextLevelPoints?: number // formerly nextLevelXp
  learningStreak: number // formerly streak
  skillPoints: number
  customAttributes: Record<string, number>
  name: string
  theme: Theme
  role: "Nurse" | "Manager" | "Educator"
  department?: string
  lastStreakDate?: string
  statBreakthroughs?: Record<string, any>
  enrolledPrograms?: string[]
  
  // Program Context (NEW)
  activeProgramId?: string | null
  programStartDate?: Date
  currentWeek?: number
  
  // Legacy fields for migration
  level?: number
  rank?: "Developing" | "Competent" | "Proficient" | "Advanced" | "Expert" | "Master"
  xp?: number
  totalXp?: number
  stats?: EICompetencies
  nextLevelXp?: number
  streak?: number
}

// Legacy alias for backward compatibility during migration
export type PlayerProfile = NurseProfile

// Training Module (formerly Quest)
export type TrainingModuleType = "Daily Reflection" | "Training Module" | "Weekly Challenge" | "Professional Goal"
export type ModuleDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Professional Milestone"

// Legacy aliases
export type QuestType = TrainingModuleType
export type QuestDifficulty = ModuleDifficulty
export type Realm =
  | "Self-Awareness & Recognition"
  | "Emotional Regulation"
  | "Empathy & Patient Care"
  | "Team Communication"
  | "Stress Management"

export type Theme =
  | "classic-dark"
  | "cyberpunk-neon"
  | "deep-space"
  | "inferno-red"
  | "emerald-forest"
  | "royal-purple"
  | "crimson-dawn"
  | "ocean-breeze"
  | "sunset-orange"
  | "golden-dawn"
  | "neon-yellow"
  | "dark-forest"
  | "deep-cyan"
  | "aurora-borealis"
  | "midnight-storm"
  | "cosmic-purple"
  | "neon-pink"
  | "golden-sunset"

// Training Module (formerly Quest)
export interface TrainingModule {
  id: string
  title: string
  description: string
  type: TrainingModuleType
  difficulty: ModuleDifficulty
  eiPoints: number // formerly xp
  eiDomain: Realm // formerly realm
  completed: boolean
  createdAt: Date
  completedAt?: Date
  // Quest lifecycle & evidence
  startedAt?: Date
  reflectionNote?: string
  dueDate?: Date
  recurring?: boolean
  isOverdue?: boolean
  competencyBoosts?: Partial<EICompetencies> // formerly statBoosts
  // Program Context (for structured programs)
  programId?: string
  week?: number
  day?: number
  programPhase?: 'foundation' | 'development' | 'mastery'
  prerequisites?: string[]
  estimatedDuration?: number // minutes
  // Legacy fields for migration
  xp?: number
  realm?: Realm
  statBoosts?: Partial<EICompetencies>
}

// Legacy alias for backward compatibility
export type Quest = TrainingModule

// Professional Milestone (formerly Achievement)
export interface ProfessionalMilestone {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
  requirement: {
    type:
      | "competency_level" // formerly level
      | "modules_completed"
      | "learning_streak" // formerly streak
      | "ei_threshold"
      | "total_ei_points" // formerly total_xp
      | "reflection_streak"
      | "perfect_week"
      | "domain_expert"
      | "consistent_learner"
      | "empathy_champion"
    value: number
    competency?: keyof EICompetencies // formerly stat
    domain?: Realm // formerly realm
    // Legacy fields
    stat?: keyof EICompetencies
    realm?: Realm
  }
}

// Legacy alias
export type Achievement = ProfessionalMilestone

export interface PersonalReflection {
  id?: string
  content?: string
  mood: string
  emotionalState?: string
  currentChallenges?: string
  motivationLevel: string
  timestamp: Date
  diaryContent?: string
  source?: "manual" | "diary"
}

export interface DiaryEntry {
  id: string
  content: string
  timestamp: Date
  converted?: boolean
  convertedToReflection?: boolean
  reflectionId?: string
}

// Advanced Analytics Types
export interface MoodTrend {
  date: string
  mood: string
  emotionalState: string
  motivationLevel: number
  modulesCompleted: number // formerly questsCompleted
  eiPointsEarned: number // formerly xpEarned
  // Legacy fields
  questsCompleted?: number
  xpEarned?: number
}

export interface PerformanceMetrics {
  dailyAverage: {
    modulesCompleted: number // formerly questsCompleted
    eiPointsEarned: number // formerly xpEarned
    streakDays: number
    // Legacy fields
    questsCompleted?: number
    xpEarned?: number
  }
  weeklyStats: {
    totalModules: number // formerly totalQuests
    totalEIPoints: number // formerly totalXP
    averageMood: number
    mostProductiveDay: string
    // Legacy fields
    totalQuests?: number
    totalXP?: number
  }
  monthlyProgress: {
    competencyLevelUps: number // formerly levelUps
    milestonesUnlocked: number // formerly achievementsUnlocked
    competencyGrowth: Partial<EICompetencies> // formerly statGrowth
    // Legacy fields
    levelUps?: number
    achievementsUnlocked?: number
    statGrowth?: Partial<EICompetencies>
  }
  domainPerformance: Record< // formerly realmPerformance
    Realm,
    {
      modulesCompleted: number // formerly questsCompleted
      eiPointsEarned: number // formerly xpEarned
      averageDifficulty: string
      // Legacy fields
      questsCompleted?: number
      xpEarned?: number
    }
  >
  // Legacy field
  realmPerformance?: Record<
    Realm,
    {
      questsCompleted: number
      xpEarned: number
      averageDifficulty: string
    }
  >
}

export interface DetailedTracking {
  moduleHistory: { // formerly questHistory
    id: string
    title: string
    completedAt: Date
    timeToComplete: number // in hours
    difficulty: ModuleDifficulty
    domain: Realm // formerly realm
    eiPoints: number // formerly xp
    competencyBoosts: Partial<EICompetencies> // formerly statBoosts
    // Legacy fields
    difficulty?: QuestDifficulty
    realm?: Realm
    xp?: number
    statBoosts?: Partial<EICompetencies>
  }[]
  moodHistory: MoodTrend[]
  performanceMetrics: PerformanceMetrics
  lastUpdated: Date
  // Legacy field
  questHistory?: any[]
}

export interface GeminiResponse {
  modules: Omit<TrainingModule, "id" | "completed" | "createdAt">[] // formerly quests
  suggestions: {
    focusArea: string
    motivation: string
    emotionalGuidance: string
  }
  // Legacy field
  quests?: Omit<TrainingModule, "id" | "completed" | "createdAt">[]
}

export interface CompetencySuggestionResponse {
  suggestedCompetencies: Partial<EICompetencies> // formerly suggestedStats
  reasoning: string
  // Legacy field
  suggestedStats?: Partial<EICompetencies>
}

// Legacy alias
export type StatSuggestionResponse = CompetencySuggestionResponse

// Healthcare-Specific Types

// EI Assessment Types
export interface EIAssessment {
  id: string
  tool: 'TEIQue-SF' | 'SSEIT' | 'HEIT' | 'Nurse-EI'
  baselineScore: number
  domainScores: {
    selfAwareness: number
    selfManagement: number
    socialAwareness: number
    relationshipManagement: number
  }
  strengths: string[]
  gaps: string[]
  assessmentDate: Date
  completedAt?: Date
}

// Burnout Risk Types
export interface BurnoutRisk {
  level: 'low' | 'moderate' | 'high' | 'critical'
  indicators: string[]
  recommendations: string[]
  referralNeeded: boolean
  detectedAt: Date
  lastUpdated: Date
}

// Manager Dashboard Types
export interface ManagerDashboard {
  teamSize: number
  averageEI: number
  teamClimate: 'positive' | 'neutral' | 'concerning'
  atRiskNurses: number
  interventions: Intervention[]
  lastUpdated: Date
}

export interface Intervention {
  id: string
  type: 'support' | 'training' | 'wellness' | 'crisis'
  targetNurseId?: string // anonymized
  description: string
  recommendedAt: Date
  status: 'pending' | 'in_progress' | 'completed'
  completedAt?: Date
}

// Shift-Aware Types
export interface ShiftContext {
  shiftType: 'day' | 'night' | 'ICU' | 'emergency' | 'other'
  department: 'ICU' | 'Pediatrics' | 'ER' | 'Oncology' | 'General' | 'Other'
  workloadIntensity: 'low' | 'moderate' | 'high' | 'critical'
  criticalIncidentOccurred: boolean
  shiftStart: Date
  shiftEnd?: Date
}

// Privacy & Consent Types
export interface PrivacyConsent {
  emotionalDataConsent: boolean
  managerDashboardConsent: boolean
  researchDataConsent: boolean
  anonymizationLevel: 'full' | 'partial' | 'none'
  consentDate: Date
  lastUpdated: Date
}

export interface AuditLog {
  id: string
  action: 'assessment' | 'intervention' | 'data_access' | 'consent_change' | 'crisis_detection'
  userId: string
  timestamp: Date
  details: Record<string, any>
  ipAddress?: string
}

// Crisis Handling Types
export interface CrisisState {
  level: 'low' | 'moderate' | 'high' | 'critical'
  detectedAt: Date
  indicators: string[]
  groundingExercisesCompleted: boolean
  escalationTriggered: boolean
  escalationTarget?: 'counselor' | 'hr_wellness' | 'manager'
  resolvedAt?: Date
}

// Department & Specialty Types
export interface DepartmentProfile {
  id: string
  name: string
  specialty: 'ICU' | 'Pediatrics' | 'ER' | 'Oncology' | 'General' | 'Other'
  eiBenchmarks: Partial<EICompetencies>
  activeModules: string[]
  customScenarios: string[]
}

// Research & Evidence Types
export interface ResearchData {
  studyId: string
  participantId: string // anonymized
  preAssessment: EIAssessment
  postAssessment?: EIAssessment
  interventions: Intervention[]
  outcomes: {
    attendance: number
    teamworkScore: number
    patientSatisfaction: number
  }
  exportDate: Date
}
