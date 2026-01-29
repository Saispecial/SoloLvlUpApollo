"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
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
  NurseStats,
} from "@/lib/types"
import {
  createInitialPlayer,
  calculateNextLevelXp,
  calculateStatBreakthrough,
  calculateStatGrowth,
  checkLevelUp,
  calculateCurrentLevelXp,
} from "@/lib/rpg-engine"
import { ACHIEVEMENTS, checkAchievements } from "@/lib/achievements"

const generateUUID = (): string => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface AppStore {
  // Core profile
  nurse: NurseProfile
  trainingModules: TrainingModule[]
  completedModules: TrainingModule[]
  
  // Reflections & Diary
  currentReflection: PersonalReflection | null
  reflections: PersonalReflection[]
  diaryEntries: DiaryEntry[]
  
  // Achievements & Tracking
  milestones: ProfessionalMilestone[]
  detailedTracking: DetailedTracking

  // Actions - Module Management
  completeModule: (moduleId: string) => void
  addTrainingModules: (newModules: Omit<TrainingModule, "id" | "completed" | "createdAt">[]) => void
  deleteModule: (moduleId: string) => void
  editModule: (moduleId: string, updates: Partial<TrainingModule>) => void

  // Actions - Profile Management
  updateNurse: (updates: Partial<NurseProfile>) => void
  updateNurseName: (name: string) => void
  updateTheme: (theme: Theme) => void
  addCustomAttribute: (name: string) => void
  resetNurse: () => void

  // Actions - Reflections & Diary
  setReflection: (reflection: Omit<PersonalReflection, "timestamp">) => void
  addDiaryEntry: (content: string) => Promise<void>
  convertDiaryToReflection: (diaryId: string) => Promise<void>
  deleteDiaryEntry: (diaryId: string) => void
  getReflections: () => PersonalReflection[]
  getDiaryEntries: () => DiaryEntry[]

  // Actions - Streak & Learning
  updateLearningStreak: () => void

  // Actions - Analytics
  updateDetailedTracking: () => void
  getPerformanceMetrics: () => PerformanceMetrics
  getMoodTrends: (days?: number) => MoodTrend[]
  getDomainPerformance: () => Record<string, any>
  getRealmPerformance: () => Record<string, any>
  getWeeklyStats: () => any
  getMonthlyProgress: () => any

  // Actions - Program Management
  setActiveProgram: (programId: string, startDate?: Date) => void
  clearActiveProgram: () => void
  getWeeklyProgress: () => { week: number; completedModules: number; totalModules: number }
  getProgramModules: (programId?: string) => TrainingModule[]
  getCurrentWeek: () => number
}

const createInitialDetailedTracking = (): DetailedTracking => ({
  moduleHistory: [],
  moodHistory: [],
  performanceMetrics: {
    dailyAverage: {
      modulesCompleted: 0,
      eiPointsEarned: 0,
      streakDays: 0,
    },
    weeklyStats: {
      totalModules: 0,
      totalEIPoints: 0,
      averageMood: 0,
      mostProductiveDay: "",
    },
    monthlyProgress: {
      competencyLevelUps: 0,
      milestonesUnlocked: 0,
      competencyGrowth: {},
    },
    domainPerformance: {
      "Self-Awareness & Recognition": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
      "Emotional Regulation": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
      "Empathy & Patient Care": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
      "Team Communication": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
      "Stress Management": { modulesCompleted: 0, eiPointsEarned: 0, averageDifficulty: "Beginner" },
    },
  },
  lastUpdated: new Date(),
})

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      nurse: {
        ...createInitialPlayer(),
        competencyLevel: 1,
        professionalRank: "Developing",
        eiDevelopmentPoints: 0,
        totalEIPoints: 0,
        competencies: {
          "Self-Awareness": 10,
          "Self-Management": 10,
          "Social Awareness": 10,
          "Relationship Management": 10,
          "Clinical Competence": 10,
        },
        streak: 0,
        learningStreak: 0,
        skillPoints: 0,
        customAttributes: {},
        name: "Nurse",
        theme: "ocean-breeze",
        role: "Nurse",
        department: "General",
        lastStreakDate: "",
        statBreakthroughs: {} as Record<string, any>,
        activeProgramId: null,
        enrolledPrograms: [],
      },
      trainingModules: [],
      completedModules: [],
      currentReflection: null,
      reflections: [],
      diaryEntries: [],
      milestones: ACHIEVEMENTS,
      detailedTracking: createInitialDetailedTracking(),

      // Complete Module
      completeModule: (moduleId: string) => {
        const { trainingModules, nurse, completedModules, milestones } = get()
        const module = trainingModules.find((m) => m.id === moduleId)

        if (!module || module.completed) {
          console.log("[AppStore] Module not found or already completed:", moduleId)
          return
        }

        console.log("[AppStore] Completing module:", moduleId, "- LOCAL-ONLY mode")

        // Calculate EI points gain
        const pointsGained = module.eiPoints || 10
        const newTotalXp = nurse.totalEIPoints + pointsGained

        // Check level up
        const { didLevelUp, newLevel, newRank } = checkLevelUp(newTotalXp, nurse.competencyLevel)
        const finalLevel = didLevelUp ? newLevel : nurse.competencyLevel
        const finalRank = didLevelUp ? newRank : nurse.professionalRank

        // Calculate EI points within current level
        const newCurrentLevelXp = calculateCurrentLevelXp(newTotalXp, finalLevel)
        const nextLevelXp = calculateNextLevelXp(finalLevel)

        // Calculate competency growth
        const competencyGrowth = calculateStatGrowth(module as any, nurse.competencies)
        const newCompetencies = { ...nurse.competencies }
        Object.entries(competencyGrowth).forEach(([stat, delta]) => {
          if (typeof newCompetencies[stat as keyof typeof newCompetencies] === "number" && typeof delta === "number") {
            ;(newCompetencies as Record<string, number>)[stat] =
              (newCompetencies as Record<string, number>)[stat] + delta
          }
        })

        // Calculate streak - only update once per day
        const today = new Date().toDateString()
        let newStreak = nurse.learningStreak
        let newLastStreakDate = nurse.lastStreakDate

        if (nurse.lastStreakDate !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toDateString()

          if (nurse.lastStreakDate === yesterdayStr) {
            newStreak = nurse.learningStreak + 1
          } else {
            newStreak = 1
          }
          newLastStreakDate = today
        }

        const completedModule = {
          ...module,
          completed: true,
          completedAt: new Date(),
        }

        const newStatBreakthroughs = Object.fromEntries(
          Object.entries(newCompetencies).map(([stat, value]) => [
            stat,
            calculateStatBreakthrough(value as number),
          ]),
        )

        const updatedMilestones = checkAchievements(
          {
            ...nurse,
            totalEIPoints: newTotalXp,
            competencyLevel: finalLevel,
            competencies: newCompetencies as NurseStats,
          } as any,
          [...completedModules, completedModule] as any,
          milestones as any,
        )

        // Update local state only - no DB
        set({
          trainingModules: trainingModules.filter((m) => m.id !== moduleId),
          completedModules: [...completedModules, completedModule],
          nurse: {
            ...nurse,
            eiDevelopmentPoints: newCurrentLevelXp,
            totalEIPoints: newTotalXp,
            competencyLevel: finalLevel,
            professionalRank: finalRank,
            learningStreak: newStreak,
            lastStreakDate: newLastStreakDate,
            competencies: newCompetencies as NurseStats,
            statBreakthroughs: newStatBreakthroughs,
            nextLevelPoints: nextLevelXp,
          },
          milestones: updatedMilestones,
        })

        console.log("[AppStore] Module completed - level:", finalLevel, "totalEI:", newTotalXp)
        get().updateDetailedTracking()
      },

      // Add Training Modules
      addTrainingModules: (newModules) => {
        console.log("[AppStore] Adding modules - LOCAL-ONLY mode, count:", newModules.length)

        if (newModules.length === 0) {
          console.warn("[AppStore] No modules to add")
          return
        }

        const modulesWithIds: TrainingModule[] = newModules.map((module) => ({
          ...(module as any),
          id: generateUUID(),
          completed: false,
          createdAt: new Date(),
          isOverdue: module.dueDate ? new Date() > new Date(module.dueDate) : false,
        }))

        set((state) => ({
          trainingModules: [...state.trainingModules, ...modulesWithIds],
        }))

        console.log("[AppStore] Added", modulesWithIds.length, "modules locally")
      },

      // Delete Module
      deleteModule: (moduleId: string) => {
        console.log("[AppStore] Deleting module - LOCAL-ONLY mode, moduleId:", moduleId)
        set((state) => ({
          trainingModules: state.trainingModules.filter((m) => m.id !== moduleId),
        }))
      },

      // Edit Module
      editModule: (moduleId: string, updates: Partial<TrainingModule>) => {
        console.log("[AppStore] Editing module - LOCAL-ONLY mode, moduleId:", moduleId)
        set((state) => ({
          trainingModules: state.trainingModules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m)),
        }))
      },

      // Update Nurse Profile
      updateNurse: (updates) => {
        console.log("[AppStore] Updating nurse profile")
        set((state) => ({
          nurse: { ...state.nurse, ...updates },
        }))
      },

      // Update Nurse Name
      updateNurseName: (name: string) => {
        console.log("[AppStore] Updating nurse name:", name)
        set((state) => ({
          nurse: { ...state.nurse, name },
        }))
      },

      // Update Theme
      updateTheme: (theme: Theme) => {
        console.log("[AppStore] Updating theme:", theme)
        set((state) => ({
          nurse: { ...state.nurse, theme },
        }))
      },

      // Add Custom Attribute
      addCustomAttribute: (name: string) => {
        console.log("[AppStore] Adding custom attribute:", name)
        set((state) => ({
          nurse: {
            ...state.nurse,
            customAttributes: {
              ...state.nurse.customAttributes,
              [name]: 10,
            },
          },
        }))
      },

      // Reset Nurse Profile
      resetNurse: () => {
        console.log("[AppStore] Resetting nurse profile - LOCAL-ONLY mode")

        set({
          nurse: {
            ...createInitialPlayer(),
            competencyLevel: 1,
            professionalRank: "Developing",
            eiDevelopmentPoints: 0,
            totalEIPoints: 0,
            competencies: {
              "Self-Awareness": 10,
              "Self-Management": 10,
              "Social Awareness": 10,
              "Relationship Management": 10,
              "Clinical Competence": 10,
            },
            streak: 0,
            learningStreak: 0,
            skillPoints: 0,
            customAttributes: {},
            name: "Nurse",
            theme: "ocean-breeze",
            role: "Nurse",
            department: "General",
            lastStreakDate: "",
            statBreakthroughs: {},
            activeProgramId: null,
            enrolledPrograms: [],
          },
          trainingModules: [],
          completedModules: [],
          currentReflection: null,
          reflections: [],
          diaryEntries: [],
          milestones: ACHIEVEMENTS,
          detailedTracking: createInitialDetailedTracking(),
        })
      },

      // Set Reflection
      setReflection: (reflection) => {
        console.log("[AppStore] Setting reflection - LOCAL-ONLY mode")

        const fullReflection: PersonalReflection = {
          ...reflection,
          timestamp: new Date(),
        }

        set((state) => ({
          currentReflection: fullReflection,
          reflections: [fullReflection, ...state.reflections],
        }))
      },

      // Add Diary Entry
      addDiaryEntry: async (content: string) => {
        const newEntry: DiaryEntry = {
          id: generateUUID(),
          content,
          timestamp: new Date(),
          converted: false,
        }

        console.log("[AppStore] Adding diary entry - LOCAL-ONLY mode")

        set((state) => ({
          diaryEntries: [newEntry, ...state.diaryEntries],
        }))
      },

      // Convert Diary to Reflection
      convertDiaryToReflection: async (diaryId: string) => {
        const { diaryEntries } = get()
        const diaryEntry = diaryEntries.find((d) => d.id === diaryId)

        if (!diaryEntry) {
          console.warn("[AppStore] Diary entry not found:", diaryId)
          return
        }

        console.log("[AppStore] Converting diary to reflection - LOCAL-ONLY mode")

        const reflection: PersonalReflection = {
          id: generateUUID(),
          content: diaryEntry.content,
          mood: "5",
          motivationLevel: "5",
          timestamp: diaryEntry.timestamp,
        }

        set((state) => ({
          reflections: [reflection, ...state.reflections],
          diaryEntries: state.diaryEntries.map((d) => (d.id === diaryId ? { ...d, converted: true } : d)),
        }))
      },

      // Delete Diary Entry
      deleteDiaryEntry: (diaryId: string) => {
        console.log("[AppStore] Deleting diary entry - LOCAL-ONLY mode, diaryId:", diaryId)
        set((state) => ({
          diaryEntries: state.diaryEntries.filter((e) => e.id !== diaryId),
        }))
      },

      // Get Reflections
      getReflections: () => {
        return get().reflections
      },

      // Get Diary Entries
      getDiaryEntries: () => {
        return get().diaryEntries
      },

      // Update Learning Streak
      updateLearningStreak: () => {
        const { nurse } = get()
        const today = new Date().toDateString()

        if (nurse.lastStreakDate === today) {
          return // Already updated today
        }

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toDateString()

        let newStreak = 1
        if (nurse.lastStreakDate === yesterdayStr) {
          newStreak = nurse.learningStreak + 1
        }

        console.log("[AppStore] Updating learning streak:", newStreak)

        set((state) => ({
          nurse: {
            ...state.nurse,
            learningStreak: newStreak,
            lastStreakDate: today,
          },
        }))
      },

      // Update Detailed Tracking
      updateDetailedTracking: () => {
        const { completedModules, reflections, nurse, detailedTracking } = get()

        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const weeklyModules = completedModules.filter((m) => m.completedAt && new Date(m.completedAt) >= weekAgo)

        const weeklyEIPoints = weeklyModules.reduce((sum, m) => sum + (m.eiPoints || 0), 0)

        const dayCount: Record<string, number> = {}
        weeklyModules.forEach((m) => {
          if (m.completedAt) {
            const day = new Date(m.completedAt).toLocaleDateString("en-US", { weekday: "long" })
            dayCount[day] = (dayCount[day] || 0) + 1
          }
        })
        const mostProductiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ""

        const weeklyMoods = reflections
          .filter((r) => new Date(r.timestamp) >= weekAgo)
          .map((r) => Number.parseInt(r.mood) || 0)
        const averageMood = weeklyMoods.length > 0 ? weeklyMoods.reduce((a, b) => a + b, 0) / weeklyMoods.length : 0

        const domainPerformance = { ...detailedTracking.performanceMetrics.domainPerformance }
        weeklyModules.forEach((m) => {
          const domain = m.eiDomain || "Self-Awareness & Recognition"
          if (domainPerformance[domain]) {
            domainPerformance[domain].modulesCompleted++
            domainPerformance[domain].eiPointsEarned += m.eiPoints || 0
          }
        })

        set({
          detailedTracking: {
            ...detailedTracking,
            performanceMetrics: {
              ...detailedTracking.performanceMetrics,
              dailyAverage: {
                modulesCompleted: weeklyModules.length / 7,
                eiPointsEarned: weeklyEIPoints / 7,
                streakDays: nurse.learningStreak,
              },
              weeklyStats: {
                totalModules: weeklyModules.length,
                totalEIPoints: weeklyEIPoints,
                averageMood,
                mostProductiveDay,
              },
              domainPerformance,
            },
            lastUpdated: now,
          },
        })
      },

      // Get Performance Metrics
      getPerformanceMetrics: () => {
        return get().detailedTracking.performanceMetrics
      },

      // Get Mood Trends
      getMoodTrends: (days = 7) => {
        const { reflections } = get()
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)

        return reflections
          .filter((r) => new Date(r.timestamp) >= cutoff)
          .map((r) => ({
            date: new Date(r.timestamp),
            mood: Number.parseInt(r.mood) || 0,
            motivation: Number.parseInt(r.motivationLevel) || 0,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
      },

      // Get Domain Performance
      getDomainPerformance: () => {
        return get().detailedTracking.performanceMetrics.domainPerformance
      },

      // Get Realm Performance (alias for getDomainPerformance)
      getRealmPerformance: () => {
        return get().detailedTracking.performanceMetrics.domainPerformance
      },

      // Get Weekly Stats
      getWeeklyStats: () => {
        return get().detailedTracking.performanceMetrics.weeklyStats
      },

      // Get Monthly Progress
      getMonthlyProgress: () => {
        return get().detailedTracking.performanceMetrics.monthlyProgress
      },

      // Program Management Methods
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

        return trainingModules
          .filter((m) => m.programId === targetProgramId)
          .sort((a, b) => {
            // Sort by week, then by order within week
            if (a.week !== b.week) {
              return (a.week || 0) - (b.week || 0)
            }
            return 0
          })
      },

      getCurrentWeek: () => {
        return get().nurse.currentWeek || 1
      },
    }),
    {
      name: "ei-nurse-app-storage",
      partialize: (state) => ({
        nurse: state.nurse,
        trainingModules: state.trainingModules,
        completedModules: state.completedModules,
        currentReflection: state.currentReflection,
        reflections: state.reflections,
        diaryEntries: state.diaryEntries,
        milestones: state.milestones,
        detailedTracking: state.detailedTracking,
      }),
    },
  ),
)

// Backward compatibility exports
export const useNurseStore = useAppStore
export const usePlayerStore = useAppStore
