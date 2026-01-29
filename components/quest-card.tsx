"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Brain,
  Heart,
  Users,
  Target,
  Sparkles,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Quest } from "@/lib/types"

interface QuestCardProps {
  quest: Quest
  onComplete?: (questId: string) => void
  onEdit?: (quest: Quest) => void
  onDelete?: (questId: string) => void
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

export default function QuestCard({ quest, onComplete, onEdit, onDelete }: QuestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const realm = quest.realm as keyof typeof realmConfig
  const config = realmConfig[realm] || realmConfig["Clinical Reflection"]
  const RealmIcon = config.icon

  // Get stat boosts that are > 0
  const activeStatBoosts = Object.entries(quest.statBoosts || {}).filter(([_, value]) => value > 0)

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
    <div
      className={cn(
        "quest-card p-4 transition-all duration-200",
        quest.completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <RealmIcon className={cn("w-5 h-5", config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={cn(
              "font-semibold text-foreground mb-1",
              quest.completed && "line-through text-muted-foreground"
            )}
          >
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

          {/* Stat boosts preview */}
          {activeStatBoosts.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2 font-medium">EI Domain Development:</div>
              <div className="flex flex-wrap gap-1.5">
                {activeStatBoosts.map(([stat, value]) => (
                  <span
                    key={stat}
                    className="inline-flex items-center gap-1 text-xs bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full"
                  >
                    <Sparkles className="w-3 h-3" />
                    {stat} +{value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 mt-4">
            {!quest.completed && onComplete && (
              <Button
                size="sm"
                onClick={() => onComplete(quest.id)}
                className="btn-dark text-xs"
              >
                Continue
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(quest)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(quest.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
