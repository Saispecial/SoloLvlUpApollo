"use client"

import React from "react"
import { ChevronDown, ChevronRight, Calendar, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Quest } from "@/lib/types"
import QuestCard from "./quest-card"
import { MobileQuestCard } from "./mobile-quest-card"
import { cn } from "@/lib/utils"

interface WeekBasedModuleGroupingProps {
  quests: Quest[]
  isMobile: boolean
  onComplete: (questId: string) => void
  onDelete: (questId: string) => void
  onEdit: (quest: Quest) => void
}

export function WeekBasedModuleGrouping({
  quests,
  isMobile,
  onComplete,
  onDelete,
  onEdit,
}: WeekBasedModuleGroupingProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0, 1]))

  // Group quests by week
  const questsByWeek = quests.reduce(
    (acc, quest) => {
      const week = quest.week || 0
      if (!acc[week]) {
        acc[week] = []
      }
      acc[week].push(quest)
      return acc
    },
    {} as Record<number, Quest[]>
  )

  // Sort weeks
  const sortedWeeks = Object.keys(questsByWeek)
    .map(Number)
    .sort((a, b) => {
      if (a === 0) return 1
      if (b === 0) return -1
      return a - b
    })

  const toggleWeek = (week: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(week)) {
      newExpanded.delete(week)
    } else {
      newExpanded.add(week)
    }
    setExpandedWeeks(newExpanded)
  }

  const getWeekTitle = (week: number) => {
    if (week === 0) return "Individual Modules"
    return `Week ${week}`
  }

  const getWeekDescription = (week: number) => {
    if (week === 0) return "Self-generated and standalone training modules"

    const weekThemes: Record<number, string> = {
      1: "Foundation - Self-Awareness Building",
      2: "Development - Emotional Recognition",
      3: "Practice - Self-Management Skills",
      4: "Application - Social Awareness",
      5: "Integration - Relationship Management",
      6: "Mastery - Clinical Application",
    }

    return weekThemes[week] || "Continued EI Development"
  }

  if (sortedWeeks.length === 0) {
    return null
  }

  // If no program-based quests, show regular grid
  if (sortedWeeks.length === 1 && sortedWeeks[0] === 0) {
    return (
      <div className={cn(isMobile ? "space-y-4 px-4" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3")}>
        {quests.map((quest) =>
          isMobile ? (
            <MobileQuestCard
              key={quest.id}
              quest={quest}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ) : (
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          )
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedWeeks.map((week) => {
        const weekQuests = questsByWeek[week]
        const isExpanded = expandedWeeks.has(week)
        const completedCount = weekQuests.filter((q) => q.completed).length
        const totalCount = weekQuests.length
        const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

        return (
          <div key={week} className={isMobile ? "mx-4" : ""}>
            <div className="card-themed overflow-hidden">
              {/* Header */}
              <div
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleWeek(week)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {week > 0 && <Calendar className="w-4 h-4 text-primary" />}
                        {getWeekTitle(week)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{getWeekDescription(week)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completedCount}/{totalCount}
                    </span>
                    {progressPercent === 100 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Done
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <motion.div
                      className="bg-primary h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-border">
                      <div
                        className={cn(
                          "pt-4",
                          isMobile ? "space-y-4" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                        )}
                      >
                        {weekQuests.map((quest) =>
                          isMobile ? (
                            <MobileQuestCard
                              key={quest.id}
                              quest={quest}
                              onComplete={onComplete}
                              onDelete={onDelete}
                              onEdit={onEdit}
                            />
                          ) : (
                            <QuestCard
                              key={quest.id}
                              quest={quest}
                              onComplete={onComplete}
                              onDelete={onDelete}
                              onEdit={onEdit}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      })}
    </div>
  )
}
