/**
 * Data Migration Utilities
 * Ensures backward compatibility and safe migration of existing nurse data
 */

import type { NurseProfile, TrainingModule } from "@/lib/types"
import type { EICompetencies } from "@/lib/types/training"

/**
 * Migrates legacy TrainingModule data to include new program context fields
 */
export function migrateTrainingModule(module: any): TrainingModule {
  return {
    // Core identification
    id: module.id,
    title: module.title,
    description: module.description,
    
    // EI Context - use new fields or fall back to legacy
    eiPoints: module.eiPoints ?? module.xp ?? 35,
    eiDomain: module.eiDomain ?? module.realm ?? "Self-Awareness & Recognition",
    difficulty: module.difficulty ?? "Beginner",
    type: module.type ?? "Training Module",
    
    // Program Context (new fields, optional)
    programId: module.programId,
    week: module.week,
    day: module.day,
    programPhase: module.programPhase,
    prerequisites: module.prerequisites,
    
    // Competency Impact - migrate from statBoosts if needed
    competencyBoosts: module.competencyBoosts ?? module.statBoosts ?? {},
    estimatedDuration: module.estimatedDuration ?? 15,
    
    // Lifecycle
    completed: module.completed ?? false,
    createdAt: module.createdAt ? new Date(module.createdAt) : new Date(),
    completedAt: module.completedAt ? new Date(module.completedAt) : undefined,
    startedAt: module.startedAt ? new Date(module.startedAt) : undefined,
    reflectionNote: module.reflectionNote,
    dueDate: module.dueDate ? new Date(module.dueDate) : undefined,
    recurring: module.recurring ?? false,
    isOverdue: module.isOverdue ?? false,
    
    // Legacy fields for backward compatibility
    xp: module.eiPoints ?? module.xp ?? 35,
    realm: module.eiDomain ?? module.realm ?? "Self-Awareness & Recognition",
    statBoosts: module.competencyBoosts ?? module.statBoosts ?? {},
  }
}

/**
 * Migrates legacy NurseProfile data to include new program context fields
 */
export function migrateNurseProfile(profile: any): NurseProfile {
  return {
    // Core profile data
    competencyLevel: profile.competencyLevel ?? profile.level ?? 1,
    professionalRank: profile.professionalRank ?? profile.rank ?? "Developing",
    eiDevelopmentPoints: profile.eiDevelopmentPoints ?? profile.xp ?? 0,
    totalEIPoints: profile.totalEIPoints ?? profile.totalXp ?? 0,
    competencies: profile.competencies ?? profile.stats ?? {
      "Self-Awareness": 10,
      "Self-Management": 10,
      "Social Awareness": 10,
      "Relationship Management": 10,
      "Clinical Competence": 10,
      "Resilience": 10,
    },
    nextLevelPoints: profile.nextLevelPoints ?? profile.nextLevelXp ?? 100,
    learningStreak: profile.learningStreak ?? profile.streak ?? 0,
    skillPoints: profile.skillPoints ?? 0,
    customAttributes: profile.customAttributes ?? {},
    name: profile.name ?? "Nurse",
    theme: profile.theme ?? "ocean-breeze",
    role: profile.role ?? "Nurse",
    
    // Program Context (new fields, optional)
    activeProgramId: profile.activeProgramId,
    programStartDate: profile.programStartDate ? new Date(profile.programStartDate) : undefined,
    currentWeek: profile.currentWeek,
    
    // Legacy fields for backward compatibility
    level: profile.competencyLevel ?? profile.level,
    rank: profile.professionalRank ?? profile.rank,
    xp: profile.eiDevelopmentPoints ?? profile.xp,
    totalXp: profile.totalEIPoints ?? profile.totalXp,
    stats: profile.competencies ?? profile.stats,
    nextLevelXp: profile.nextLevelPoints ?? profile.nextLevelXp,
    streak: profile.learningStreak ?? profile.streak,
  }
}

/**
 * Batch migrates an array of training modules
 */
export function migrateTrainingModules(modules: any[]): TrainingModule[] {
  return modules.map(migrateTrainingModule)
}

/**
 * Validates that a module has all required fields
 */
export function validateTrainingModule(module: any): boolean {
  const required = ['id', 'title', 'description', 'eiPoints', 'eiDomain', 'difficulty', 'type', 'completed']
  return required.every(field => module[field] !== undefined && module[field] !== null)
}

/**
 * Validates that a nurse profile has all required fields
 */
export function validateNurseProfile(profile: any): boolean {
  const required = [
    'competencyLevel',
    'professionalRank',
    'eiDevelopmentPoints',
    'totalEIPoints',
    'competencies',
    'nextLevelPoints',
    'learningStreak',
    'name',
    'theme',
    'role'
  ]
  return required.every(field => profile[field] !== undefined && profile[field] !== null)
}

/**
 * Ensures competency boosts are properly formatted
 */
export function normalizeCompetencyBoosts(boosts: any): Partial<EICompetencies> {
  if (!boosts || typeof boosts !== 'object') {
    return {}
  }
  
  const validCompetencies = [
    'Self-Awareness',
    'Self-Management',
    'Social Awareness',
    'Relationship Management',
    'Clinical Competence',
    'Resilience'
  ]
  
  const normalized: Partial<EICompetencies> = {}
  
  for (const [key, value] of Object.entries(boosts)) {
    if (validCompetencies.includes(key) && typeof value === 'number' && value > 0) {
      normalized[key as keyof EICompetencies] = value
    }
  }
  
  return normalized
}

/**
 * Migrates legacy field names in bulk data
 */
export function migrateLegacyFieldNames(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }
  
  const fieldMappings: Record<string, string> = {
    // Module/Quest mappings
    'xp': 'eiPoints',
    'realm': 'eiDomain',
    'statBoosts': 'competencyBoosts',
    'quests': 'trainingModules',
    'completedQuests': 'completedModules',
    'questHistory': 'moduleHistory',
    
    // Profile mappings
    'level': 'competencyLevel',
    'rank': 'professionalRank',
    'stats': 'competencies',
    'nextLevelXp': 'nextLevelPoints',
    'streak': 'learningStreak',
    'player': 'nurse',
    
    // Performance mappings
    'realmPerformance': 'domainPerformance',
    'questsCompleted': 'modulesCompleted',
    'xpEarned': 'eiPointsEarned',
  }
  
  const migrated: any = Array.isArray(data) ? [] : {}
  
  for (const [key, value] of Object.entries(data)) {
    const newKey = fieldMappings[key] || key
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      migrated[newKey] = migrateLegacyFieldNames(value)
    } else if (Array.isArray(value)) {
      migrated[newKey] = value.map(item => 
        item && typeof item === 'object' ? migrateLegacyFieldNames(item) : item
      )
    } else {
      migrated[newKey] = value
    }
  }
  
  return migrated
}

/**
 * Creates a compatibility layer that provides both old and new field access
 */
export function createCompatibilityLayer<T extends Record<string, any>>(data: T): T {
  const legacyMappings: Record<string, string> = {
    'eiPoints': 'xp',
    'eiDomain': 'realm',
    'competencyBoosts': 'statBoosts',
    'trainingModules': 'quests',
    'completedModules': 'completedQuests',
    'moduleHistory': 'questHistory',
    'competencyLevel': 'level',
    'professionalRank': 'rank',
    'competencies': 'stats',
    'nextLevelPoints': 'nextLevelXp',
    'learningStreak': 'streak',
    'nurse': 'player',
    'domainPerformance': 'realmPerformance',
    'modulesCompleted': 'questsCompleted',
    'eiPointsEarned': 'xpEarned',
  }
  
  const proxy = new Proxy(data, {
    get(target, prop: string) {
      // First try the requested property
      if (prop in target) {
        return target[prop]
      }
      
      // Then try the legacy mapping
      const legacyKey = legacyMappings[prop]
      if (legacyKey && legacyKey in target) {
        return target[legacyKey]
      }
      
      // Finally try the reverse mapping
      const modernKey = Object.entries(legacyMappings).find(([_, legacy]) => legacy === prop)?.[0]
      if (modernKey && modernKey in target) {
        return target[modernKey]
      }
      
      return undefined
    },
    
    set(target, prop: string, value) {
      // Set both the modern and legacy fields
      (target as any)[prop] = value
      
      const legacyKey = legacyMappings[prop]
      if (legacyKey) {
        (target as any)[legacyKey] = value
      }
      
      const modernKey = Object.entries(legacyMappings).find(([_, legacy]) => legacy === prop)?.[0]
      if (modernKey) {
        (target as any)[modernKey] = value
      }
      
      return true
    }
  })
  
  return proxy
}
