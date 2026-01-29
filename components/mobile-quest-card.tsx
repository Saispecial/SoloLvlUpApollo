"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Circle, Edit, Trash2, ChevronDown, ChevronUp, Brain, Heart, Users, Target, Sparkles, Lightbulb } from "lucide-react"
import type { Quest } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MobileQuestCardProps {
  quest: Quest
  onComplete: (questId: string) => void
  onDelete: (questId: string) => void
  onEdit: (quest: Quest) => void
}

const realmConfig = {
  Mental: { icon: Brain, color: "text-blue-600" },
  Emotional: { icon: Heart, color: "text-purple-600" },
  Physical: { icon: Users, color: "text-red-600" },
  Creative: { icon: Sparkles, color: "text-green-600" },
  Social: { icon: Users, color: "text-yellow-600" },
  Professional: { icon: Target, color: "text-indigo-600" },
  "Self-Awareness Training": { icon: Brain, color: "text-teal-600" },
  "Self-Management Development": { icon: Heart, color: "text-amber-600" },
  "Social Awareness Practice": { icon: Users, color: "text-blue-600" },
  "Relationship Management": { icon: Sparkles, color: "text-emerald-600" },
  "Clinical Reflection": { icon: Lightbulb, color: "text-purple-600" },
  "Resilience Building": { icon: Target, color: "text-indigo-600" },
}

export function MobileQuestCard({ quest, onComplete, onDelete, onEdit }: MobileQuestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const realm = quest.realm as keyof typeof realmConfig
  const config = realmConfig[realm] || realmConfig["Clinical Reflection"]
  const RealmIcon = config.icon

  const getDifficultyBadge = (difficulty: string) => {
    const lower = difficulty?.toLowerCase() || "easy"
    if (lower === "easy" || lower === "foundational" || lower === "beginner") {
      return "badge-easy"
    }
    if (lower === "medium" || lower === "developing" || lower === "intermediate") {
      return "bg-yellow-100 text-yellow-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
    }
    if (lower === "hard" || lower === "proficient" || lower === "advanced") {
      return "bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
    }
    return "bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
  }

  return (
    <motion.div
      layout
      className={cn(
        "quest-card overflow-hidden",
        quest.completed && "opacity-60"
      )}
    >
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted shrink-0">
            <RealmIcon className={cn("w-5 h-5", config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-foreground mb-1",
              quest.completed && "line-through text-muted-foreground"
            )}>
              {quest.title}
            </h3>
            
            {/* Description - Collapsed/Expanded */}
            <div className="mb-3">
              <p
                className={cn(
                  "text-sm text-muted-foreground leading-relaxed transition-all duration-300",
                  !isExpanded && "line-clamp-2"
                )}
              >
                {quest.description}
              </p>
              {quest.description && quest.description.length > 100 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-1 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      View details
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={getDifficultyBadge(quest.difficulty)}>
                {quest.difficulty?.toLowerCase() || "easy"}
              </span>
              <span className="badge-daily">{quest.questType?.toLowerCase() || "daily"}</span>
              <span className="badge-xp">+{quest.xp} XP</span>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onComplete(quest.id)}
              className="btn-primary w-full py-3 text-sm"
            >
              {quest.completed ? "Completed" : "Start Quest"}
            </button>
          </div>
        </div>

        {/* Edit/Delete Buttons */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(quest)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(quest.id)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-3 bg-muted/30">
              {/* Stat Boosts */}
              {quest.statBoosts && Object.values(quest.statBoosts).some((boost) => boost && boost > 0) && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">EI Domain Development</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(quest.statBoosts)
                      .filter(([_, boost]) => boost && boost > 0)
                      .map(([stat, boost]) => (
                        <span
                          key={stat}
                          className="inline-flex items-center gap-1 text-xs bg-teal-50 border border-teal-200 text-teal-700 px-2 py-1 rounded-full"
                        >
                          <Sparkles className="w-3 h-3" />
                          {stat} +{boost}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Quest Type */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Type</h4>
                <p className="text-sm text-muted-foreground">{quest.type || realm}</p>
              </div>
              
              {/* XP Range */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Reward</h4>
                <p className="text-sm text-muted-foreground">{quest.xp >= 50 ? "35-60" : "15-30"} points</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
