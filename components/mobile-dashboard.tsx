"use client"

import type React from "react"
import { motion } from "framer-motion"
import {
  Target,
  Brain,
  BookOpen,
  MessageSquare,
  Flame,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Heart,
  BarChart3,
  HelpCircle,
} from "lucide-react"
import type { PlayerProfile, Quest, Achievement } from "@/lib/types"
import { Button } from "./ui/button"
import Enhanced3DNurseScene from "@/components/counseling/Enhanced3DNurseScene"
import { useTourStore } from "@/stores/tour-store"

interface MobileDashboardProps {
  player: PlayerProfile
  quests: Quest[]
  achievements: Achievement[]
}

export function MobileDashboard({ player, quests, achievements }: MobileDashboardProps) {
  const { isTourActive, startTour } = useTourStore()
  const completedQuests = quests.filter((q) => q.completed)
  const activeQuests = quests.filter((q) => !q.completed)
  const xpProgress = player.nextLevelXp > 0 ? (player.xp / player.nextLevelXp) * 100 : 0

  return (
    <div className="space-y-4 px-4 pb-20">
      {/* 3D Model (Main Attraction) */}
      <div className="relative h-[350px] w-[calc(100%+2rem)] -ml-4 bg-gradient-to-b from-teal-50/30 to-white rounded-b-3xl overflow-hidden mb-6 shadow-sm border-b border-teal-100/50">
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-medium text-teal-700 border border-teal-100">
           Interactive AI Companion
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white text-teal-700 border border-teal-100 h-7 px-2 text-[10px] gap-1 shadow-sm"
          onClick={startTour}
        >
          <HelpCircle className="w-3 h-3" />
          Tutorial
        </Button>
        {!isTourActive && <Enhanced3DNurseScene emotion="neutral" isTalking={false} />}
      </div>

      {/* Hero Profile Card */}
      <motion.div
        className="bg-gradient-to-br from-blue-500 via-blue-600 to-teal-500 rounded-2xl p-5 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{player.name}</h1>
            <p className="text-white/70 text-sm">{player.rank || "Frontline Nurse"}</p>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1">
            <span className="text-sm font-medium">Level {player.level}</span>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-white/70 text-xs mb-1">
            <span>XP Progress</span>
            <span>{player.xp} / {player.nextLevelXp}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 opacity-70" />
            <p className="text-lg font-bold">{completedQuests.length}</p>
            <p className="text-white/60 text-xs">Quests</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Flame className="w-4 h-4 mx-auto mb-1 opacity-70" />
            <p className="text-lg font-bold">{player.streak}</p>
            <p className="text-white/60 text-xs">Streak</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 opacity-70" />
            <p className="text-lg font-bold">{player.level}</p>
            <p className="text-white/60 text-xs">Level</p>
          </div>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-3">
        <FeatureCard
          icon={<Target className="w-5 h-5 text-teal-600" />}
          title="Active Quests"
          value={activeQuests.length.toString()}
          href="/?tab=quests"
        />
        <FeatureCard
          icon={<Brain className="w-5 h-5 text-blue-600" />}
          title="Assessment"
          subtitle="Track growth"
          href="/assessment"
        />
        <FeatureCard
          icon={<BookOpen className="w-5 h-5 text-teal-600" />}
          title="Journal"
          subtitle="Reflect"
          href="/?tab=diary"
        />
        <FeatureCard
          icon={<Heart className="w-5 h-5 text-pink-600" />}
          title="Reflection"
          subtitle="Daily check-in"
          href="/reflection"
        />
        <FeatureCard
          icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
          title="AI Counselor"
          subtitle="Get support"
          href="/counselor"
        />
        <FeatureCard
          icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
          title="Progress"
          subtitle="Analytics"
          href="/?tab=analytics"
        />
      </div>

      {/* Daily Quests */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Daily Quests</h2>
          <a 
            href="/?tab=quests" 
            className="text-teal-600 text-sm font-medium flex items-center"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="space-y-3">
          {activeQuests.slice(0, 3).map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}

          {activeQuests.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">No active quests</p>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => (window.location.href = "/?tab=quests")}
              >
                Create Quest
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// Feature Card
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  value?: string
  subtitle?: string
  href: string
}

function FeatureCard({ icon, title, value, subtitle, href }: FeatureCardProps) {
  return (
    <a
      href={href}
      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="mb-2">{icon}</div>
      <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
      {value && <p className="text-2xl font-bold text-blue-600">{value}</p>}
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </a>
  )
}

// Quest Card
interface QuestCardProps {
  quest: Quest
}

function QuestCard({ quest }: QuestCardProps) {
  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "self-awareness training":
      case "mental":
        return <Brain className="w-4 h-4 text-teal-600" />
      default:
        return <Target className="w-4 h-4 text-teal-600" />
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-teal-50 shrink-0">
          {getIcon(quest.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm mb-1">{quest.title}</h3>
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{quest.description}</p>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              {quest.difficulty?.toLowerCase() || "easy"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {quest.questType?.toLowerCase() || "daily"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">
              +{quest.xp} XP
            </span>
          </div>
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm py-2"
            onClick={() => (window.location.href = "/?tab=quests")}
          >
            Start Quest
          </Button>
        </div>
      </div>
    </div>
  )
}
