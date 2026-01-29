import type { PlayerProfile, PlayerStats, Quest } from "./types"

export const RANK_ORDER = ["Developing", "Competent", "Proficient", "Advanced", "Expert", "Master"] as const

export function calculateNextLevelXp(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function calculateCurrentLevelXp(totalXp: number, currentLevel: number): number {
  // Calculate total XP needed to reach current level
  let totalXpForCurrentLevel = 0
  for (let i = 1; i < currentLevel; i++) {
    totalXpForCurrentLevel += calculateNextLevelXp(i)
  }
  
  // Return XP within current level
  return totalXp - totalXpForCurrentLevel
}

export function checkLevelUp(
  currentXp: number,
  level: number,
): { didLevelUp: boolean; levelUp: boolean; newLevel: number; newRank: string } {
  let newLevel = level
  let totalXpNeeded = 0

  while (true) {
    const xpForNextLevel = calculateNextLevelXp(newLevel)
    if (currentXp >= totalXpNeeded + xpForNextLevel) {
      totalXpNeeded += xpForNextLevel
      newLevel++
    } else {
      break
    }
  }

  const didLevelUp = newLevel > level
  const newRank = calculateRank(newLevel)

  return { didLevelUp, levelUp: didLevelUp, newLevel, newRank }
}

export function calculateRank(level: number): string {
  if (level >= 50) return "Master"
  if (level >= 40) return "Expert"
  if (level >= 30) return "Advanced"
  if (level >= 20) return "Proficient"
  if (level >= 10) return "Competent"
  return "Developing"
}

export function calculateStatBreakthrough(statValue: number): string {
  if (statValue >= 100) return "Master"
  if (statValue >= 80) return "Expert"
  if (statValue >= 60) return "Advanced"
  if (statValue >= 40) return "Proficient"
  if (statValue >= 20) return "Competent"
  return "Developing"
}

export function calculateStatGrowth(quest: Quest, currentStats: PlayerStats): PlayerStats {
  const newStats = { ...currentStats }
  const growthAmount = Math.floor(quest.xp / 10) || 1

  switch (quest.realm) {
    case "Self-Awareness & Recognition":
      newStats["Self-Awareness"] += growthAmount
      if (quest.difficulty === "Advanced" || quest.difficulty === "Professional Milestone") {
        newStats["Clinical Competence"] += Math.floor(growthAmount / 2)
      }
      break

    case "Emotional Regulation":
      newStats["Self-Management"] += growthAmount
      if (quest.difficulty === "Advanced" || quest.difficulty === "Professional Milestone") {
        newStats.Resilience += Math.floor(growthAmount / 2)
      }
      break

    case "Empathy & Patient Care":
      newStats["Social Awareness"] += growthAmount
      if (quest.difficulty === "Advanced" || quest.difficulty === "Professional Milestone") {
        newStats["Relationship Management"] += Math.floor(growthAmount / 2)
      }
      break

    case "Team Communication":
      newStats["Relationship Management"] += growthAmount
      if (quest.difficulty === "Advanced" || quest.difficulty === "Professional Milestone") {
        newStats["Social Awareness"] += Math.floor(growthAmount / 2)
      }
      break

    case "Stress Management":
      newStats.Resilience += growthAmount
      if (quest.difficulty === "Advanced" || quest.difficulty === "Professional Milestone") {
        newStats["Self-Management"] += Math.floor(growthAmount / 2)
      }
      break
  }

  return newStats
}

export function createInitialPlayer(): PlayerProfile {
  return {
    level: 1,
    rank: "Developing",
    xp: 0,
    totalXp: 0,
    stats: {
      "Self-Awareness": 10,
      "Self-Management": 10,
      "Social Awareness": 10,
      "Relationship Management": 10,
      "Clinical Competence": 10,
      Resilience: 10,
    },
    nextLevelXp: calculateNextLevelXp(1),
    streak: 0,
    skillPoints: 0,
    customAttributes: {},
    name: "Nurse",
    theme: "ocean-breeze",
    role: "Nurse",
  }
}
