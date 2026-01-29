"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
  NurseProfile,
  TrainingModule,
  PersonalReflection,
  ProfessionalMilestone,
  Theme,
  DetailedTracking,
  MoodTrend,
  PerformanceMetrics,
  DiaryEntry,
  // Legacy types for compatibility
  PlayerProfile,
  Quest,
  Achievement,
} from "@/lib/types"
import { createInitialPlayer, checkLevelUp, calculateStatGrowth, calculateNextLevelXp } from "@/lib/rpg-engine"
import { ACHIEVEMENTS, checkAchievements } from "@/lib/achievements"
import { migrateNurseProfile, migrateTrainingModule } from "@/lib/utils/dataMigration"

interface NurseStore {
  nurse: NurseProfile // formerly player
  trainingModules: TrainingModule[] // formerly quests
  completedModules: TrainingModule[] // formerly completedQuests
  currentReflection: PersonalReflection | null
  reflections: PersonalReflection[]
  diaryEntries: DiaryEntry[]
  milestones: ProfessionalMilestone[] // formerly achievements
  detailedTracking: DetailedTracking

  // Actions - Updated terminology
  completeModule: (moduleId: string) => void // formerly completeQuest
  addTrainingModules: (newModules: Omit<TrainingModule, "id" | "completed" | "createdAt">[]) => void // formerly addQuests
  deleteModule: (moduleId: string) => void // formerly deleteQuest
  editModule: (moduleId: string, updates: Partial<TrainingModule>) => void // formerly editQuest
  resetNurse: () => void // formerly resetPlayer
  updateNurse: (updates: Partial<NurseProfile>) => void // formerly updatePlayer
  setReflection: (reflection: Omit<PersonalReflection, "timestamp">) => void
  addDiaryEntry: (content: string) => Promise<void>
  convertDiaryToReflection: (diaryId: string) => Promise<void>
  deleteDiaryEntry: (diaryId: string) => void
  addCustomAttribute: (name: string) => void
  updateLearningStreak: () => void // formerly updateStreak
  updateNurseName: (name: string) => void // formerly updatePlayerName
  updateTheme: (theme: Theme) => void
  getReflections: () => PersonalReflection[]
  getDiaryEntries: () => DiaryEntry[]

  // Advanced Analytics Actions
  updateDetailedTracking: () => void
  getPerformanceMetrics: () => PerformanceMetrics
  getMoodTrends: (days?: number) => MoodTrend[]
  getDomainPerformance: () => Record<string, any> // formerly getRealmPerformance
  getWeeklyStats: () => any
  getMonthlyProgress: () => any

  // Program Context Actions (NEW)
  setActiveProgram: (programId: string, startDate?: Date) => void
  clearActiveProgram: () => void
  getWeeklyProgress: () => { week: number; completedModules: number; totalModules: number }
  getProgramModules: (programId?: string) => TrainingModule[]
  getCurrentWeek: () => number

  // Persistence utilities
  forceSave: () => void
  verifyPersistence: () => any

  // Legacy methods for backward compatibility
  player?: NurseProfile
  quests?: TrainingModule[]
  completedQuests?: TrainingModule[]
  achievements?: ProfessionalMilestone[]
  completeQuest?: (questId: string) => void
  addQuests?: (newQuests: Omit<TrainingModule, "id" | "completed" | "createdAt">[]) => void
  deleteQuest?: (questId: string) => void
  editQuest?: (questId: string, updates: Partial<TrainingModule>) => void
  resetPlayer?: () => void
  updatePlayer?: (updates: Partial<NurseProfile>) => void
  updateStreak?: () => void
  updatePlayerName?: (name: string) => void
  getRealmPerformance?: () => Record<string, any>
}

const createInitialDetailedTracking = (): DetailedTracking => ({
  moduleHistory: [], // formerly questHistory
  moodHistory: [],
  performanceMetrics: {
    dailyAverage: {
      modulesCompleted: 0, // formerly questsCompleted
      eiPointsEarned: 0, // formerly xpEarned
      streakDays: 0,
      // Legacy fields
      questsCompleted: 0,
      xpEarned: 0,
    },
    weeklyStats: {
      totalModules: 0, // formerly totalQuests
      totalEIPoints: 0, // formerly totalXP
      averageMood: 0,
      mostProductiveDay: "",
      // Legacy fields
      totalQuests: 0,
      totalXP: 0,
    },
    monthlyProgress: {
      competencyLevelUps: 0, // formerly levelUps
      milestonesUnlocked: 0, // formerly achievementsUnlocked
      competencyGrowth: {}, // formerly statGrowth
      // Legacy fields
      levelUps: 0,
      achievementsUnlocked: 0,
      statGrowth: {},
    },
    domainPerformance: {
      "Self-Awareness & Recognition": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
      "Emotional Regulation": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
      "Empathy & Patient Care": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
      "Team Communication": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
      "Stress Management": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
    },
    // Legacy field
    realmPerformance: {
      "Self-Awareness & Recognition": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
      "Emotional Regulation": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
      "Empathy & Patient Care": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
      "Team Communication": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
      "Stress Management": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
    },
  },
  lastUpdated: new Date(),
  // Legacy field
  questHistory: [],
})

// Helper function to migrate legacy player data to nurse profile
function migratePlayerToNurse(player: any): NurseProfile {
  return {
    competencyLevel: player.level ?? player.competencyLevel ?? 1,
    professionalRank: player.rank ?? player.professionalRank ?? "Developing",
    eiDevelopmentPoints: player.xp ?? player.eiDevelopmentPoints ?? 0,
    totalEIPoints: player.totalXp ?? player.totalEIPoints ?? 0,
    competencies: player.stats ?? player.competencies ?? {
      "Self-Awareness": 10,
      "Self-Management": 10,
      "Social Awareness": 10,
      "Relationship Management": 10,
      "Clinical Competence": 10,
      Resilience: 10,
    },
    nextLevelPoints: player.nextLevelXp ?? player.nextLevelPoints ?? 100,
    learningStreak: player.streak ?? player.learningStreak ?? 0,
    skillPoints: player.skillPoints ?? 0,
    customAttributes: player.customAttributes ?? {},
    name: player.name ?? "Nurse",
    theme: player.theme ?? "ocean-breeze",
    role: player.role ?? "Nurse",
    // Legacy fields for compatibility
    level: player.level,
    rank: player.rank,
    xp: player.xp,
    totalXp: player.totalXp,
    stats: player.stats,
    nextLevelXp: player.nextLevelXp,
    streak: player.streak,
  }
}

export const useNurseStore = create<NurseStore>()(
  persist(
    (set, get) => {
      const initialPlayer = createInitialPlayer()
      const initialNurse = migratePlayerToNurse(initialPlayer)

      // Log initialization
      console.log("[NurseStore] Initializing store...")
      
      return {
        nurse: {
          ...initialNurse,
          learningStreak: 0,
          skillPoints: 0,
          customAttributes: {},
          name: "Nurse",
          theme: "ocean-breeze",
          role: "Nurse",
        },
        trainingModules: [],
        completedModules: [],
        currentReflection: null,
        reflections: [],
        diaryEntries: [],
        milestones: ACHIEVEMENTS,
        detailedTracking: createInitialDetailedTracking(),

        completeModule: (moduleId: string) => {
          const { trainingModules, nurse, completedModules, milestones } = get()
          const module = trainingModules.find((m) => m.id === moduleId)

          if (!module || module.completed) return

          // Mark module as completed
          const completedModule = {
            ...module,
            completed: true,
            completedAt: new Date(),
          }

          // Use legacy fields if new fields don't exist
          const moduleXp = module.eiPoints ?? module.xp ?? 0
          const moduleRealm = module.eiDomain ?? module.realm ?? "Self-Awareness & Recognition"
          const moduleBoosts = module.competencyBoosts ?? module.statBoosts ?? {}

          // Calculate new EI points and competencies
          const currentXp = nurse.eiDevelopmentPoints ?? nurse.xp ?? 0
          const currentTotalXp = nurse.totalEIPoints ?? nurse.totalXp ?? 0
          const currentStats = nurse.competencies ?? nurse.stats ?? initialNurse.competencies
          const currentLevel = nurse.competencyLevel ?? nurse.level ?? 1

          const newTotalXp = currentTotalXp + moduleXp
          const newXp = currentXp + moduleXp
          const newStats = calculateStatGrowth(
            { ...module, xp: moduleXp, realm: moduleRealm, statBoosts: moduleBoosts } as any,
            currentStats
          )

          // Apply custom competency boosts if defined
          if (moduleBoosts) {
            Object.entries(moduleBoosts).forEach(([stat, boost]) => {
              if (boost && boost > 0) {
                newStats[stat as keyof typeof newStats] += boost
              }
            })
          }

          // Check for level up
          const { levelUp, newLevel, newRank } = checkLevelUp(newTotalXp, currentLevel)

          // Award skill points on level up
          const newSkillPoints = levelUp ? (nurse.skillPoints ?? 0) + 1 : (nurse.skillPoints ?? 0)

          // Update nurse profile
          const updatedNurse: NurseProfile = {
            ...nurse,
            eiDevelopmentPoints: levelUp ? newTotalXp - calculateNextLevelXp(newLevel - 1) : newXp,
            totalEIPoints: newTotalXp,
            competencyLevel: newLevel,
            professionalRank: newRank as any,
            competencies: newStats,
            nextLevelPoints: calculateNextLevelXp(newLevel),
            skillPoints: newSkillPoints,
            // Legacy fields
            xp: levelUp ? newTotalXp - calculateNextLevelXp(newLevel - 1) : newXp,
            totalXp: newTotalXp,
            level: newLevel,
            rank: newRank as any,
            stats: newStats,
            nextLevelXp: calculateNextLevelXp(newLevel),
          }

          const newCompletedModules = [...completedModules, completedModule]

          // Check milestones (achievements)
          const updatedMilestones = checkAchievements(
            updatedNurse as any,
            newCompletedModules as any,
            milestones as any,
            get().reflections,
            get().detailedTracking,
          )

          set({
            nurse: updatedNurse,
            trainingModules: trainingModules.map((m) => (m.id === moduleId ? completedModule : m)),
            completedModules: newCompletedModules,
            milestones: updatedMilestones,
            // Legacy fields
            player: updatedNurse,
            quests: trainingModules.map((m) => (m.id === moduleId ? completedModule : m)),
            completedQuests: newCompletedModules,
            achievements: updatedMilestones,
          })

          // Update detailed tracking
          get().updateDetailedTracking()
          
          // Verify persistence
          setTimeout(() => {
            if (typeof window !== "undefined") {
              const stored = localStorage.getItem("nurse-store")
              if (stored) {
                const parsed = JSON.parse(stored)
                console.log("[completeModule] localStorage verification - completed modules:", parsed.state?.completedModules?.length || 0)
              }
            }
          }, 100)
        },

        addTrainingModules: (newModules) => {
          console.log("[addTrainingModules] Adding modules:", newModules)
          const modulesWithIds = newModules.map((module) => {
            // Create a complete module object
            const completeModule: any = {
              ...module,
              id: (module as any).id || Math.random().toString(36).substr(2, 9),
              completed: (module as any).completed || false,
              createdAt: (module as any).createdAt || new Date(),
              isOverdue: module.dueDate ? new Date() > new Date(module.dueDate) : false,
            }
            
            // Migrate module to ensure all fields are present
            return migrateTrainingModule(completeModule)
          })
          
          console.log("[addTrainingModules] Modules with IDs:", modulesWithIds)
          
          set((state) => {
            const updatedModules = [...state.trainingModules, ...modulesWithIds]
            console.log("[addTrainingModules] Updated trainingModules count:", updatedModules.length)
            console.log("[addTrainingModules] Persisting to localStorage...")
            return {
              trainingModules: updatedModules,
              // Legacy field - ensure it's synced
              quests: updatedModules,
            }
          })
          
          // Force a re-render and verify persistence
          setTimeout(() => {
            const currentState = get()
            console.log("[addTrainingModules] Final state - trainingModules:", currentState.trainingModules.length)
            console.log("[addTrainingModules] Final state - quests:", currentState.quests?.length || 0)
            
            // Verify localStorage persistence
            if (typeof window !== "undefined") {
              const stored = localStorage.getItem("nurse-store")
              if (stored) {
                const parsed = JSON.parse(stored)
                console.log("[addTrainingModules] localStorage verification - stored modules:", parsed.state?.trainingModules?.length || 0)
              }
            }
          }, 100)
        },

        deleteModule: (moduleId: string) => {
          set((state) => ({
            trainingModules: state.trainingModules.filter((m) => m.id !== moduleId),
            // Legacy field
            quests: (state.quests ?? []).filter((q: any) => q.id !== moduleId),
          }))
        },

        editModule: (moduleId: string, updates: Partial<TrainingModule>) => {
          set((state) => ({
            trainingModules: state.trainingModules.map((m) =>
              m.id === moduleId ? { ...m, ...updates } : m
            ),
            // Legacy field
            quests: (state.quests ?? []).map((q: any) =>
              q.id === moduleId ? { ...q, ...updates } : q
            ),
          }))
        },

        resetNurse: () => {
          const initialNurse = migratePlayerToNurse(createInitialPlayer())
          set({
            nurse: {
              ...initialNurse,
              learningStreak: 0,
              skillPoints: 0,
              customAttributes: {},
              name: "Nurse",
              theme: "ocean-breeze",
              role: "Nurse",
            },
            trainingModules: [],
            completedModules: [],
            currentReflection: null,
            reflections: [],
            diaryEntries: [],
            milestones: ACHIEVEMENTS,
            detailedTracking: createInitialDetailedTracking(),
            // Legacy fields
            player: initialNurse,
            quests: [],
            completedQuests: [],
            achievements: ACHIEVEMENTS,
          })
        },

        updateNurse: (updates) => {
          set((state) => ({
            nurse: { ...state.nurse, ...updates },
            // Legacy field
            player: { ...state.nurse, ...updates },
          }))
        },

        setReflection: (reflection) => {
          const newReflection = {
            ...reflection,
            timestamp: new Date(),
          }
          set((state) => ({
            currentReflection: newReflection,
            reflections: [newReflection, ...(state.reflections || [])],
          }))

          // Update detailed tracking after reflection
          get().updateDetailedTracking()
        },

        addCustomAttribute: (name: string) => {
          const { nurse } = get()
          const currentLevel = nurse.competencyLevel ?? nurse.level ?? 0
          if (currentLevel >= 10 && (nurse.skillPoints ?? 0) > 0) {
            set((state) => ({
              nurse: {
                ...state.nurse,
                customAttributes: {
                  ...state.nurse.customAttributes,
                  [name]: 1,
                },
                skillPoints: (state.nurse.skillPoints ?? 0) - 1,
              },
            }))
          }
        },

        updateLearningStreak: () => {
          const { completedModules } = get()
          const today = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86400000).toDateString()

          const completedToday = completedModules.some(
            (m) => m.completedAt && new Date(m.completedAt).toDateString() === today,
          )

          const completedYesterday = completedModules.some(
            (m) => m.completedAt && new Date(m.completedAt).toDateString() === yesterday,
          )

          set((state) => {
            const currentStreak = state.nurse.learningStreak ?? state.nurse.streak ?? 0
            const newStreak = completedToday ? currentStreak : completedYesterday ? currentStreak : 0
            return {
              nurse: {
                ...state.nurse,
                learningStreak: newStreak,
                streak: newStreak, // Legacy field
              },
            }
          })
        },

        updateNurseName: (name: string) => {
          set((state) => ({
            nurse: { ...state.nurse, name },
            // Legacy field
            player: { ...state.nurse, name },
          }))
        },

        updateTheme: (theme: Theme) => {
          set((state) => ({
            nurse: { ...state.nurse, theme },
            // Legacy field
            player: { ...state.nurse, theme },
          }))
        },

        getReflections: () => {
          return get().reflections
        },

        addDiaryEntry: async (content: string) => {
          const newEntry: DiaryEntry = {
            id: Math.random().toString(36).substr(2, 9),
            content,
            timestamp: new Date(),
            convertedToReflection: false,
          }
          set((state) => ({
            diaryEntries: [newEntry, ...state.diaryEntries],
          }))
        },

        convertDiaryToReflection: async (diaryId: string) => {
          const { diaryEntries, reflections } = get()
          const diaryEntry = diaryEntries.find((entry) => entry.id === diaryId)

          if (!diaryEntry || diaryEntry.convertedToReflection) return

          try {
            const { convertDiaryToReflection } = await import("@/lib/ai-stats")
            const reflection = await convertDiaryToReflection(diaryEntry)

            const newReflection: PersonalReflection = {
              ...reflection,
              timestamp: new Date(),
            }

            set((state) => ({
              reflections: [newReflection, ...state.reflections],
              diaryEntries: state.diaryEntries.map((entry) =>
                entry.id === diaryId
                  ? { ...entry, convertedToReflection: true, reflectionId: newReflection.timestamp.toString() }
                  : entry,
              ),
            }))

            // Update detailed tracking after conversion
            get().updateDetailedTracking()
          } catch (error) {
            console.error("Error converting diary to reflection:", error)
          }
        },

        deleteDiaryEntry: (diaryId: string) => {
          set((state) => ({
            diaryEntries: state.diaryEntries.filter((entry) => entry.id !== diaryId),
          }))
        },

        getDiaryEntries: () => {
          return get().diaryEntries
        },

        // Advanced Analytics Methods
        updateDetailedTracking: () => {
          const { completedModules, reflections, nurse } = get()
          const completedQuests = completedModules as any // For compatibility with existing functions

          // Update module history (formerly quest history)
          const moduleHistory = completedModules.map((module) => ({
            id: module.id,
            title: module.title,
            completedAt: module.completedAt!,
            timeToComplete:
              module.completedAt && module.createdAt
                ? (new Date(module.completedAt).getTime() - new Date(module.createdAt).getTime()) / (1000 * 60 * 60)
                : 0,
            difficulty: module.difficulty,
            domain: module.eiDomain ?? module.realm ?? "Self-Awareness & Recognition",
            eiPoints: module.eiPoints ?? module.xp ?? 0,
            competencyBoosts: module.competencyBoosts ?? module.statBoosts ?? {},
            // Legacy fields
            realm: module.eiDomain ?? module.realm,
            xp: module.eiPoints ?? module.xp,
            statBoosts: module.competencyBoosts ?? module.statBoosts,
          }))

          // Update mood history
          const moodHistory: MoodTrend[] = reflections.map((reflection) => {
            const date = new Date(reflection.timestamp).toDateString()
            const dayModules = completedModules.filter(
              (m) => m.completedAt && new Date(m.completedAt).toDateString() === date,
            )

            return {
              date,
              mood: reflection.mood,
              emotionalState: reflection.emotionalState,
              motivationLevel: Number.parseInt(reflection.motivationLevel) || 5,
              modulesCompleted: dayModules.length,
              eiPointsEarned: dayModules.reduce((sum, m) => sum + (m.eiPoints ?? m.xp ?? 0), 0),
              // Legacy fields
              questsCompleted: dayModules.length,
              xpEarned: dayModules.reduce((sum, m) => sum + (m.eiPoints ?? m.xp ?? 0), 0),
            }
          })

          // Calculate performance metrics
          const now = new Date()
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            return date.toDateString()
          }).reverse()

          const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            return date.toDateString()
          }).reverse()

          // Daily averages
          const dailyModules = last7Days.map((date) =>
            completedModules.filter((m) => m.completedAt && new Date(m.completedAt).toDateString() === date),
          )

          const dailyAverage = {
            modulesCompleted: dailyModules.reduce((sum, day) => sum + day.length, 0) / 7,
            eiPointsEarned: dailyModules.reduce((sum, day) => sum + day.reduce((daySum, m) => daySum + (m.eiPoints ?? m.xp ?? 0), 0), 0) / 7,
            streakDays: nurse.learningStreak ?? nurse.streak ?? 0,
            // Legacy fields
            questsCompleted: dailyModules.reduce((sum, day) => sum + day.length, 0) / 7,
            xpEarned: dailyModules.reduce((sum, day) => sum + day.reduce((daySum, m) => daySum + (m.eiPoints ?? m.xp ?? 0), 0), 0) / 7,
          }

          // Weekly stats
          const weeklyModules = completedModules.filter(
            (m) => m.completedAt && last7Days.includes(new Date(m.completedAt).toDateString()),
          )

          const weeklyStats = {
            totalModules: weeklyModules.length,
            totalEIPoints: weeklyModules.reduce((sum, m) => sum + (m.eiPoints ?? m.xp ?? 0), 0),
            averageMood:
              moodHistory.slice(-7).reduce((sum, m) => sum + m.motivationLevel, 0) /
              Math.max(moodHistory.slice(-7).length, 1),
            mostProductiveDay: last7Days.reduce((most, date) => {
              const dayModules = completedModules.filter(
                (m) => m.completedAt && new Date(m.completedAt).toDateString() === date,
              )
              const mostModules = completedModules.filter(
                (m) => m.completedAt && new Date(m.completedAt).toDateString() === most,
              )
              return dayModules.length > mostModules.length ? date : most
            }, last7Days[0]),
            // Legacy fields
            totalQuests: weeklyModules.length,
            totalXP: weeklyModules.reduce((sum, m) => sum + (m.eiPoints ?? m.xp ?? 0), 0),
          }

          // Monthly progress
          const monthlyModules = completedModules.filter(
            (m) => m.completedAt && last30Days.includes(new Date(m.completedAt).toDateString()),
          )

          const monthlyProgress = {
            competencyLevelUps: 0, // This would need to be tracked separately
            milestonesUnlocked: get().milestones.filter(
              (m) => m.unlocked && m.unlockedAt && last30Days.includes(new Date(m.unlockedAt).toDateString()),
            ).length,
            competencyGrowth: {}, // This would need to be calculated from stat history
            // Legacy fields
            levelUps: 0,
            achievementsUnlocked: get().milestones.filter(
              (m) => m.unlocked && m.unlockedAt && last30Days.includes(new Date(m.unlockedAt).toDateString()),
            ).length,
            statGrowth: {},
          }

          // Domain performance (formerly realm performance)
          const domainPerformance: any = {
            "Self-Awareness & Recognition": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
            "Emotional Regulation": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
            "Empathy & Patient Care": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
            "Team Communication": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
            "Stress Management": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
          }

          const realmPerformance: any = {
            "Self-Awareness & Recognition": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
            "Emotional Regulation": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
            "Empathy & Patient Care": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
            "Team Communication": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
            "Stress Management": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" },
          }

          completedModules.forEach((module) => {
            const realm = module.eiDomain ?? module.realm ?? "Self-Awareness & Recognition"
            const points = module.eiPoints ?? module.xp ?? 0

            if (!domainPerformance[realm]) {
              domainPerformance[realm] = { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" }
            }
            if (!realmPerformance[realm]) {
              realmPerformance[realm] = { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Beginner" }
            }

            domainPerformance[realm].modulesCompleted += 1
            domainPerformance[realm].eiPointsEarned += points
            realmPerformance[realm].questsCompleted += 1
            realmPerformance[realm].xpEarned += points
          })

          // Calculate average difficulty per domain
          Object.keys(domainPerformance).forEach((domainKey) => {
            const domain = domainPerformance[domainKey]
            const realm = realmPerformance[domainKey]
            const domainModules = completedModules.filter((m) => (m.eiDomain ?? m.realm) === domainKey)
            if (domainModules.length > 0) {
              const difficulties = domainModules.map((m) => {
                switch (m.difficulty) {
                  case "Beginner":
                    return 1
                  case "Intermediate":
                    return 2
                  case "Advanced":
                    return 3
                  case "Professional Milestone":
                    return 4
                  default:
                    return 1
                }
              })
              const avgDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length
              const difficultyStr =
                avgDifficulty <= 1.5
                  ? "Beginner"
                  : avgDifficulty <= 2.5
                    ? "Intermediate"
                    : avgDifficulty <= 3.5
                      ? "Advanced"
                      : "Professional Milestone"
              domain.averageDifficulty = difficultyStr
              realm.averageDifficulty = difficultyStr
            }
          })

          const performanceMetrics: PerformanceMetrics = {
            dailyAverage,
            weeklyStats,
            monthlyProgress,
            domainPerformance,
            realmPerformance, // Legacy field
          }

          set((state) => ({
            detailedTracking: {
              moduleHistory,
              questHistory: moduleHistory as any, // Legacy field
              moodHistory,
              performanceMetrics,
              lastUpdated: new Date(),
            },
          }))
        },

        getPerformanceMetrics: () => {
          return get().detailedTracking.performanceMetrics
        },

        getMoodTrends: (days = 7) => {
          const { detailedTracking } = get()
          return detailedTracking.moodHistory.slice(-days)
        },

        getDomainPerformance: () => {
          return get().detailedTracking.performanceMetrics.domainPerformance ?? {}
        },

        getRealmPerformance: () => {
          return get().detailedTracking.performanceMetrics.realmPerformance ?? {}
        },

        getWeeklyStats: () => {
          return get().detailedTracking.performanceMetrics.weeklyStats
        },

        getMonthlyProgress: () => {
          return get().detailedTracking.performanceMetrics.monthlyProgress
        },

        // Program Context Methods (NEW)
        setActiveProgram: (programId: string, startDate?: Date) => {
          set((state) => ({
            nurse: {
              ...state.nurse,
              activeProgramId: programId,
              programStartDate: startDate || new Date(),
              currentWeek: 1,
            },
          }))
        },

        clearActiveProgram: () => {
          set((state) => ({
            nurse: {
              ...state.nurse,
              activeProgramId: undefined,
              programStartDate: undefined,
              currentWeek: undefined,
            },
          }))
        },

        getWeeklyProgress: () => {
          const { nurse, trainingModules } = get()
          const currentWeek = nurse.currentWeek || 1
          const activeProgramId = nurse.activeProgramId

          if (!activeProgramId) {
            return { week: currentWeek, completedModules: 0, totalModules: 0 }
          }

          const weekModules = trainingModules.filter(
            (m) => m.programId === activeProgramId && m.week === currentWeek
          )
          const completedCount = weekModules.filter((m) => m.completed).length

          return {
            week: currentWeek,
            completedModules: completedCount,
            totalModules: weekModules.length,
          }
        },

        getProgramModules: (programId?: string) => {
          const { trainingModules, nurse } = get()
          const targetProgramId = programId || nurse.activeProgramId

          if (!targetProgramId) {
            return []
          }

          return trainingModules.filter((m) => m.programId === targetProgramId)
        },

        getCurrentWeek: () => {
          const { nurse } = get()
          
          if (!nurse.programStartDate || !nurse.activeProgramId) {
            return 1
          }

          const startDate = new Date(nurse.programStartDate)
          const now = new Date()
          const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          const weeksSinceStart = Math.floor(daysSinceStart / 7) + 1

          // Update current week if it has changed
          if (weeksSinceStart !== nurse.currentWeek) {
            set((state) => ({
              nurse: {
                ...state.nurse,
                currentWeek: weeksSinceStart,
              },
            }))
          }

          return weeksSinceStart
        },

        // Persistence utilities
        forceSave: () => {
          // Force Zustand to persist current state
          const state = get()
          console.log("[forceSave] Current state:", {
            trainingModules: state.trainingModules.length,
            completedModules: state.completedModules.length,
            nurse: state.nurse.name,
            activeProgramId: state.nurse.activeProgramId,
          })
        },

        verifyPersistence: () => {
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem("nurse-store")
            if (stored) {
              const parsed = JSON.parse(stored)
              console.log("[verifyPersistence] localStorage data:", {
                trainingModules: parsed.state?.trainingModules?.length || 0,
                completedModules: parsed.state?.completedModules?.length || 0,
                nurse: parsed.state?.nurse?.name || "Unknown",
                activeProgramId: parsed.state?.nurse?.activeProgramId || "None",
              })
              return parsed.state
            } else {
              console.log("[verifyPersistence] No data found in localStorage")
              return null
            }
          }
          return null
        },

        // Legacy method aliases for backward compatibility
        get player() {
          return get().nurse
        },
        get quests() {
          return get().trainingModules
        },
        get completedQuests() {
          return get().completedModules
        },
        get achievements() {
          return get().milestones
        },
        completeQuest: (questId: string) => get().completeModule(questId),
        addQuests: (newQuests: any) => get().addTrainingModules(newQuests),
        deleteQuest: (questId: string) => get().deleteModule(questId),
        editQuest: (questId: string, updates: any) => get().editModule(questId, updates),
        resetPlayer: () => get().resetNurse(),
        updatePlayer: (updates: any) => get().updateNurse(updates),
        updateStreak: () => get().updateLearningStreak(),
        updatePlayerName: (name: string) => get().updateNurseName(name),
      }
    },
    {
      name: "nurse-store", // Changed from "player-store"
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Migration function to handle legacy data
      migrate: (persistedState: any, version: number) => {
        console.log("[NurseStore] Migrating persisted state, version:", version)
        
        if (!persistedState) {
          console.log("[NurseStore] No persisted state found, checking for legacy player-store data...")
          
          // Try to migrate from old player-store if it exists
          if (typeof window !== "undefined") {
            const legacyData = localStorage.getItem("player-store")
            if (legacyData) {
              try {
                const parsed = JSON.parse(legacyData)
                const legacyState = parsed?.state ?? parsed
                console.log("[NurseStore] Found legacy player-store, migrating...")
                
                // Migrate the legacy data
                const migratedState = {
                  nurse: migrateNurseProfile(legacyState.player || legacyState.nurse || {}),
                  trainingModules: (legacyState.quests || legacyState.trainingModules || []).map((m: any) => migrateTrainingModule(m)),
                  completedModules: (legacyState.completedQuests || legacyState.completedModules || []).map((m: any) => migrateTrainingModule(m)),
                  milestones: legacyState.achievements || [],
                  reflections: legacyState.reflections || [],
                  diaryEntries: legacyState.diaryEntries || [],
                  detailedTracking: legacyState.detailedTracking || createInitialDetailedTracking(),
                }
                
                console.log("[NurseStore] Legacy migration complete - modules:", migratedState.trainingModules.length)
                return migratedState
              } catch (error) {
                console.error("[NurseStore] Failed to migrate legacy data:", error)
              }
            }
          }
          
          return persistedState
        }
        
        try {
          // Zustand persist may pass either the raw state or a `{ state, version }` wrapper
          const rawState = persistedState?.state ?? persistedState

          // Migrate nurse profile
          if (rawState.nurse || rawState.player) {
            const profileData = rawState.nurse || rawState.player
            rawState.nurse = migrateNurseProfile(profileData)
            rawState.player = rawState.nurse // Keep legacy field synced
          }
          
          // Migrate training modules
          if (rawState.trainingModules || rawState.quests) {
            const modulesData = rawState.trainingModules || rawState.quests || []
            rawState.trainingModules = modulesData.map((m: any) => migrateTrainingModule(m))
            rawState.quests = rawState.trainingModules // Keep legacy field synced
          }
          
          // Migrate completed modules
          if (rawState.completedModules || rawState.completedQuests) {
            const completedData = rawState.completedModules || rawState.completedQuests || []
            rawState.completedModules = completedData.map((m: any) => migrateTrainingModule(m))
            rawState.completedQuests = rawState.completedModules // Keep legacy field synced
          }
          
          // Migrate milestones
          if (rawState.achievements) {
            rawState.milestones = rawState.achievements
          }
          
          console.log("[NurseStore] Migration complete - modules:", rawState.trainingModules?.length || 0)
          return rawState
        } catch (error) {
          console.error("[NurseStore] Migration error:", error)
          console.log("[NurseStore] Falling back to default state")
          // Returning the original persisted state (best-effort) avoids wiping storage on transient issues.
          return persistedState?.state ?? persistedState
        }
      },
      onRehydrateStorage: () => {
        console.log("[NurseStore] Starting hydration from localStorage...")
        return (state, error) => {
          if (error) {
            console.error("[NurseStore] Hydration error:", error)
            // Clear corrupted data
            if (typeof window !== "undefined") {
              localStorage.removeItem("nurse-store")
              console.log("[NurseStore] Cleared corrupted data, will use defaults")
            }
          } else {
            console.log("[NurseStore] Hydration complete - modules:", state?.trainingModules?.length || 0)
          }
        }
      },
    },
  ),
)

// Legacy export for backward compatibility
export const usePlayerStore = useNurseStore
