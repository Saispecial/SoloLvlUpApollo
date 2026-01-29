"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/stores/app-store"
import { ACHIEVEMENTS } from "@/lib/achievements"
import {
  ArrowLeft,
  Award,
  Trophy,
  Star,
  Flame,
  Target,
  Brain,
  Heart,
  Zap,
  Crown,
  Shield,
  Gem,
  Medal,
  Lock,
  CheckCircle2,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"

// Badge component with unique designs for each achievement type
function AchievementBadge({ 
  achievement, 
  size = "md" 
}: { 
  achievement: typeof ACHIEVEMENTS[0] & { unlocked: boolean; unlockedAt?: Date }
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  }
  
  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10"
  }

  // Get badge color based on achievement type
  const getBadgeStyle = () => {
    const req = achievement.requirement
    
    if (req.type === "level") {
      if (req.value >= 50) return { bg: "from-yellow-400 via-amber-500 to-orange-600", ring: "ring-yellow-300", icon: Crown }
      if (req.value >= 25) return { bg: "from-purple-400 via-violet-500 to-purple-600", ring: "ring-purple-300", icon: Shield }
      if (req.value >= 10) return { bg: "from-blue-400 via-blue-500 to-indigo-600", ring: "ring-blue-300", icon: Star }
      return { bg: "from-teal-400 via-teal-500 to-emerald-600", ring: "ring-teal-300", icon: Star }
    }
    
    if (req.type === "streak") {
      if (req.value >= 30) return { bg: "from-orange-400 via-red-500 to-rose-600", ring: "ring-orange-300", icon: Flame }
      return { bg: "from-amber-400 via-orange-500 to-red-500", ring: "ring-amber-300", icon: Flame }
    }
    
    if (req.type === "modules_completed") {
      if (req.value >= 50) return { bg: "from-yellow-400 via-amber-500 to-yellow-600", ring: "ring-yellow-300", icon: Crown }
      return { bg: "from-emerald-400 via-green-500 to-teal-600", ring: "ring-emerald-300", icon: Target }
    }
    
    if (req.type === "ei_threshold") {
      return { bg: "from-pink-400 via-rose-500 to-red-500", ring: "ring-pink-300", icon: Brain }
    }
    
    if (req.type === "total_xp") {
      if (req.value >= 5000) return { bg: "from-yellow-300 via-amber-400 to-orange-500", ring: "ring-yellow-200", icon: Trophy }
      return { bg: "from-blue-400 via-cyan-500 to-teal-500", ring: "ring-blue-300", icon: Zap }
    }
    
    if (req.type === "reflection_streak" || req.type === "perfect_week") {
      return { bg: "from-violet-400 via-purple-500 to-indigo-600", ring: "ring-violet-300", icon: Heart }
    }
    
    if (req.type === "domain_expert") {
      return { bg: "from-cyan-400 via-blue-500 to-indigo-600", ring: "ring-cyan-300", icon: Medal }
    }
    
    if (req.type === "consistent_learner") {
      return { bg: "from-emerald-400 via-teal-500 to-cyan-600", ring: "ring-emerald-300", icon: Gem }
    }
    
    return { bg: "from-gray-400 via-slate-500 to-gray-600", ring: "ring-gray-300", icon: Award }
  }
  
  const style = getBadgeStyle()
  const IconComponent = style.icon

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Outer glow for unlocked */}
      {achievement.unlocked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} rounded-full blur-md opacity-50 animate-pulse`} />
      )}
      
      {/* Badge body */}
      <div 
        className={`
          relative ${sizeClasses[size]} rounded-full 
          ${achievement.unlocked 
            ? `bg-gradient-to-br ${style.bg} ring-2 ${style.ring} shadow-lg` 
            : "bg-gradient-to-br from-gray-300 to-gray-400 ring-2 ring-gray-200"
          }
          flex items-center justify-center transition-all duration-300
        `}
      >
        {achievement.unlocked ? (
          <IconComponent className={`${iconSizeClasses[size]} text-white drop-shadow-md`} />
        ) : (
          <Lock className={`${iconSizeClasses[size]} text-gray-500`} />
        )}
      </div>
      
      {/* Checkmark for unlocked */}
      {achievement.unlocked && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  )
}

export default function AchievementsPage() {
  const { nurse, completedModules, reflections } = useAppStore()
  const [activeTab, setActiveTab] = useState<"achievements" | "quests">("achievements")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [questFilter, setQuestFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [expandedAchievement, setExpandedAchievement] = useState<string | null>(null)

  // Get achievements with unlock status
  const achievements = ACHIEVEMENTS.map(achievement => {
    const existing = nurse.achievements?.find(a => a.id === achievement.id)
    return existing || { ...achievement, unlocked: false }
  })

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100)

  // Get completed quests
  const completedQuests = completedModules.filter(m => m.completed)

  // Filter completed quests based on timeframe
  const getFilteredQuests = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return completedQuests
      .filter((quest) => {
        if (!quest.completedAt) return true
        const completedDate = new Date(quest.completedAt)

        switch (questFilter) {
          case "today":
            return completedDate >= today
          case "week":
            return completedDate >= weekAgo
          case "month":
            return completedDate >= monthAgo
          default:
            return true
        }
      })
      .sort((a, b) => {
        if (!a.completedAt || !b.completedAt) return 0
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      })
  }

  const filteredQuests = getFilteredQuests()

  // Group achievements by category
  const getCategory = (achievement: typeof ACHIEVEMENTS[0]) => {
    const type = achievement.requirement.type
    if (type === "level") return "Level Milestones"
    if (type === "streak") return "Streaks"
    if (type === "modules_completed") return "Quest Mastery"
    if (type === "ei_threshold") return "EI Growth"
    if (type === "total_xp") return "XP Milestones"
    if (type === "reflection_streak" || type === "perfect_week") return "Reflection"
    if (type === "domain_expert") return "Domain Expertise"
    if (type === "consistent_learner") return "Consistency"
    return "Other"
  }

  const categories = [...new Set(achievements.map(getCategory))]

  const filteredAchievements = achievements.filter(a => {
    if (categoryFilter !== "all" && getCategory(a) !== categoryFilter) return false
    if (showUnlockedOnly && !a.unlocked) return false
    return true
  })

  // Calculate progress for each achievement
  const getProgress = (achievement: typeof ACHIEVEMENTS[0]) => {
    if (achievement.unlocked) return 100
    const req = achievement.requirement
    
    switch (req.type) {
      case "level":
        return Math.min(100, (nurse.level / req.value) * 100)
      case "modules_completed":
        return Math.min(100, (completedQuests.length / req.value) * 100)
      case "streak":
        return Math.min(100, (nurse.streak / req.value) * 100)
      case "total_xp":
        return Math.min(100, ((nurse.totalXp || nurse.xp) / req.value) * 100)
      case "ei_threshold":
        const stat = req.stat as keyof typeof nurse.stats
        return Math.min(100, ((nurse.stats?.[stat] || 0) / req.value) * 100)
      case "reflection_streak":
        return Math.min(100, (reflections.length / req.value) * 100)
      default:
        return 0
    }
  }

  const getTotalXpEarned = () => {
    return filteredQuests.reduce((total, quest) => total + (quest.xp || 0), 0)
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Achievements & Progress</h1>
              <p className="text-sm text-gray-500">Track your accomplishments</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Overall Progress Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{unlockedCount} / {totalCount}</h2>
                  <p className="text-teal-100">Achievements Unlocked</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{completionPercentage}%</div>
                <p className="text-teal-100">Complete</p>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-3 bg-white/20" />
          </div>
          
          {/* Quick Stats */}
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{nurse.totalXp || nurse.xp || 0}</p>
                <p className="text-xs text-gray-500">Total XP</p>
              </div>
              <div>
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{nurse.streak || 0}</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </div>
              <div>
                <Target className="w-6 h-6 text-teal-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{completedQuests.length}</p>
                <p className="text-xs text-gray-500">Quests Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "achievements"
                  ? "bg-teal-500 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Award className="w-4 h-4" />
              Achievements
            </button>
            <button
              onClick={() => setActiveTab("quests")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "quests"
                  ? "bg-teal-500 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Completed Quests ({completedQuests.length})
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "achievements" ? (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filters */}
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showUnlockedOnly}
                      onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                      className="rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                    />
                    Unlocked only
                  </label>
                </div>
              </Card>

              {/* Featured Achievements (Recently Unlocked) */}
              {achievements.filter(a => a.unlocked && a.unlockedAt).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Recently Unlocked
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {achievements
                      .filter(a => a.unlocked && a.unlockedAt)
                      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
                      .slice(0, 5)
                      .map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          whileHover={{ scale: 1.05 }}
                          className="flex-shrink-0 bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center min-w-[120px]"
                        >
                          <AchievementBadge achievement={achievement} size="md" />
                          <p className="text-xs font-medium text-gray-900 mt-2 line-clamp-2">{achievement.title}</p>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              {/* All Achievements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAchievements.map((achievement) => {
                  const progress = getProgress(achievement)
                  const isExpanded = expandedAchievement === achievement.id
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card 
                        className={`overflow-hidden transition-all cursor-pointer ${
                          achievement.unlocked 
                            ? "border-teal-200 bg-gradient-to-br from-white to-teal-50/30" 
                            : "border-gray-200"
                        }`}
                        onClick={() => setExpandedAchievement(isExpanded ? null : achievement.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <AchievementBadge achievement={achievement} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className={`font-semibold ${achievement.unlocked ? "text-gray-900" : "text-gray-500"}`}>
                                    {achievement.title}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-0.5">{achievement.description}</p>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                              
                              {/* Progress bar for locked achievements */}
                              {!achievement.unlocked && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                </div>
                              )}
                              
                              {/* Unlock date for unlocked achievements */}
                              {achievement.unlocked && achievement.unlockedAt && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Badge variant="outline" className="text-xs">
                                      {getCategory(achievement)}
                                    </Badge>
                                    {achievement.requirement.stat && (
                                      <Badge variant="outline" className="text-xs">
                                        {achievement.requirement.stat}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="quests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Quest Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <Trophy className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{filteredQuests.length}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </Card>
                <Card className="p-4 text-center">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{getTotalXpEarned()}</p>
                  <p className="text-sm text-gray-500">XP Earned</p>
                </Card>
                <Card className="p-4 text-center">
                  <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{nurse.level || 1}</p>
                  <p className="text-sm text-gray-500">Current Level</p>
                </Card>
              </div>

              {/* Time Filter */}
              <Card className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Filter className="w-4 h-4 text-gray-500" />
                  {[
                    { id: "all", label: "All Time" },
                    { id: "today", label: "Today" },
                    { id: "week", label: "This Week" },
                    { id: "month", label: "This Month" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setQuestFilter(filter.id as any)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        questFilter === filter.id
                          ? "bg-teal-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Completed Quests List */}
              <div className="space-y-3">
                {filteredQuests.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {questFilter === "all"
                        ? "No completed quests yet. Start your journey!"
                        : `No quests completed ${questFilter === "today" ? "today" : questFilter === "week" ? "this week" : "this month"}.`}
                    </p>
                  </Card>
                ) : (
                  filteredQuests.map((quest) => (
                    <Card key={quest.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <h3 className="font-medium text-gray-900">{quest.title}</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{quest.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {quest.realm}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {quest.difficulty}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-yellow-500">+{quest.xp} XP</div>
                            {quest.completedAt && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(quest.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
