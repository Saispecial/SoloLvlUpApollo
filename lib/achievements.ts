import type { Achievement, NurseProfile, Quest } from "./types"

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_module",
    title: "First Steps in EI",
    description: "Complete your first training module",
    icon: "🎯",
    unlocked: false,
    requirement: { type: "modules_completed", value: 1 },
  },
  {
    id: "level_5",
    title: "Growing Professional",
    description: "Reach level 5 - Developing competence",
    icon: "⭐",
    unlocked: false,
    requirement: { type: "competency_level", value: 5 },
  },
  {
    id: "level_10",
    title: "Competent Practitioner",
    description: "Reach level 10 - Competent rank achieved",
    icon: "🌟",
    unlocked: false,
    requirement: { type: "competency_level", value: 10 },
  },
  {
    id: "streak_7",
    title: "Weekly Commitment",
    description: "Maintain a 7-day learning streak",
    icon: "🔥",
    unlocked: false,
    requirement: { type: "learning_streak", value: 7 },
  },
  {
    id: "streak_30",
    title: "Monthly Dedication",
    description: "Maintain a 30-day learning streak",
    icon: "💎",
    unlocked: false,
    requirement: { type: "learning_streak", value: 30 },
  },
  {
    id: "module_master",
    title: "Training Master",
    description: "Complete 50 training modules",
    icon: "👑",
    unlocked: false,
    requirement: { type: "modules_completed", value: 50 },
  },
  {
    id: "self_awareness_master",
    title: "Self-Awareness Champion",
    description: "Reach 50 in Self-Awareness",
    icon: "🧠",
    unlocked: false,
    requirement: { type: "ei_threshold", value: 50, competency: "Self-Awareness" },
  },
  {
    id: "resilience_master",
    title: "Resilience Expert",
    description: "Reach 50 in Resilience",
    icon: "💪",
    unlocked: false,
    requirement: { type: "ei_threshold", value: 50, competency: "Resilience" },
  },
  {
    id: "xp_1000",
    title: "Knowledge Collector",
    description: "Earn 1000 total EI points",
    icon: "⚡",
    unlocked: false,
    requirement: { type: "total_ei_points", value: 1000 },
  },
  {
    id: "reflection_streak_7",
    title: "Reflective Practitioner",
    description: "Complete 7 days of reflections",
    icon: "🧘",
    unlocked: false,
    requirement: { type: "reflection_streak", value: 7 },
  },
  {
    id: "reflection_streak_30",
    title: "Mindful Professional",
    description: "Complete 30 days of reflections",
    icon: "🕉️",
    unlocked: false,
    requirement: { type: "reflection_streak", value: 30 },
  },
  {
    id: "perfect_week",
    title: "Perfect Week",
    description: "Complete all daily reflections for 7 consecutive days",
    icon: "✨",
    unlocked: false,
    requirement: { type: "perfect_week", value: 7 },
  },
  {
    id: "domain_expert_awareness",
    title: "Self-Awareness Domain Expert",
    description: "Complete 25 Self-Awareness modules",
    icon: "🧠",
    unlocked: false,
    requirement: { type: "domain_expert", value: 25, domain: "Self-Awareness & Recognition" },
  },
  {
    id: "domain_expert_regulation",
    title: "Emotional Regulation Expert",
    description: "Complete 25 Emotional Regulation modules",
    icon: "💖",
    unlocked: false,
    requirement: { type: "domain_expert", value: 25, domain: "Emotional Regulation" },
  },
  {
    id: "domain_expert_empathy",
    title: "Empathy & Care Champion",
    description: "Complete 25 Empathy & Patient Care modules",
    icon: "❤️",
    unlocked: false,
    requirement: { type: "domain_expert", value: 25, domain: "Empathy & Patient Care" },
  },
  {
    id: "domain_expert_communication",
    title: "Communication Master",
    description: "Complete 25 Team Communication modules",
    icon: "💬",
    unlocked: false,
    requirement: { type: "domain_expert", value: 25, domain: "Team Communication" },
  },
  {
    id: "domain_expert_stress",
    title: "Stress Management Expert",
    description: "Complete 25 Stress Management modules",
    icon: "🌊",
    unlocked: false,
    requirement: { type: "domain_expert", value: 25, domain: "Stress Management" },
  },
  {
    id: "consistent_learner",
    title: "Consistent Learner",
    description: "Complete at least 3 modules every day for 14 days",
    icon: "👑",
    unlocked: false,
    requirement: { type: "consistent_learner", value: 14 },
  },
  {
    id: "empathy_champion",
    title: "Empathy Champion",
    description: "Reach 75 in Social Awareness - exceptional patient empathy",
    icon: "💝",
    unlocked: false,
    requirement: { type: "ei_threshold", value: 75, competency: "Social Awareness" },
  },
  {
    id: "xp_5000",
    title: "Knowledge Legend",
    description: "Earn 5000 total EI points",
    icon: "🏆",
    unlocked: false,
    requirement: { type: "total_ei_points", value: 5000 },
  },
  {
    id: "level_25",
    title: "Advanced Practitioner",
    description: "Reach level 25 - Advanced rank",
    icon: "🔱",
    unlocked: false,
    requirement: { type: "competency_level", value: 25 },
  },
  {
    id: "level_50",
    title: "Master Nurse Educator",
    description: "Reach level 50 - Master rank achieved",
    icon: "⚜️",
    unlocked: false,
    requirement: { type: "competency_level", value: 50 },
  },
]

export function checkAchievements(
  player: NurseProfile,
  completedQuests: Quest[],
  achievements: Achievement[],
  reflections: any[] = [],
  detailedTracking?: any,
): Achievement[] {
  return achievements.map((achievement) => {
    if (achievement.unlocked) return achievement

    let shouldUnlock = false
    const req = achievement.requirement

    // Support both new and legacy field names
    const level = player.competencyLevel ?? player.level ?? 1
    const streak = player.learningStreak ?? player.streak ?? 0
    const totalPoints = player.totalEIPoints ?? player.totalXp ?? 0
    const competencies = player.competencies ?? player.stats

    switch (req.type) {
      case "competency_level":
        shouldUnlock = level >= req.value
        break
      case "modules_completed":
        shouldUnlock = completedQuests.length >= req.value
        break
      case "learning_streak":
        shouldUnlock = streak >= req.value
        break
      case "ei_threshold":
        if (req.competency && competencies) {
          shouldUnlock = (competencies[req.competency] ?? 0) >= req.value
        }
        break
      case "total_ei_points":
        shouldUnlock = totalPoints >= req.value
        break
      case "reflection_streak":
        shouldUnlock = checkReflectionStreak(reflections, req.value)
        break
      case "perfect_week":
        shouldUnlock = checkPerfectWeek(completedQuests, req.value)
        break
      case "domain_expert":
        if (req.domain) {
          shouldUnlock = completedQuests.filter((q) => (q.eiDomain ?? q.realm) === req.domain).length >= req.value
        }
        break
      case "consistent_learner":
        shouldUnlock = checkConsistentLearner(completedQuests, req.value)
        break
    }

    if (shouldUnlock) {
      return {
        ...achievement,
        unlocked: true,
        unlockedAt: new Date(),
      }
    }

    return achievement
  })
}

function checkReflectionStreak(reflections: any[], requiredDays: number): boolean {
  if (reflections.length < requiredDays) return false

  const sortedReflections = reflections
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, requiredDays)

  const dates = sortedReflections.map((r) => new Date(r.timestamp).toDateString())
  const uniqueDates = [...new Set(dates)]

  return uniqueDates.length >= requiredDays
}

function checkPerfectWeek(completedQuests: Quest[], requiredDays: number): boolean {
  const now = new Date()
  const last7Days = Array.from({ length: requiredDays }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    return date.toDateString()
  })

  return last7Days.every((date) => {
    const dayQuests = completedQuests.filter((q) => q.completedAt && new Date(q.completedAt).toDateString() === date)
    return dayQuests.some((q) => q.type === "Daily Reflection")
  })
}

function checkSpeedRunner(completedQuests: Quest[], requiredCount: number): boolean {
  const speedQuests = completedQuests.filter((quest) => {
    if (!quest.completedAt || !quest.createdAt) return false
    const timeDiff = new Date(quest.completedAt).getTime() - new Date(quest.createdAt).getTime()
    return timeDiff <= 60 * 60 * 1000 // 1 hour in milliseconds
  })

  return speedQuests.length >= requiredCount
}

function checkConsistencyKing(completedQuests: Quest[], requiredDays: number): boolean {
  const now = new Date()
  const lastDays = Array.from({ length: requiredDays }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    return date.toDateString()
  })

  return lastDays.every((date) => {
    const dayQuests = completedQuests.filter((q) => q.completedAt && new Date(q.completedAt).toDateString() === date)
    return dayQuests.length >= 3
  })
}

function checkConsistentLearner(completedQuests: Quest[], requiredDays: number): boolean {
  const now = new Date()
  const lastDays = Array.from({ length: requiredDays }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    return date.toDateString()
  })

  return lastDays.every((date) => {
    const dayQuests = completedQuests.filter((q) => q.completedAt && new Date(q.completedAt).toDateString() === date)
    return dayQuests.length >= 3
  })
}
