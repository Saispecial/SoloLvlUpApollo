import { Brain, Heart, Users, Lightbulb, Sparkles, HelpCircle, Star } from "lucide-react"
import type { PlayerStats } from "@/lib/types"

interface StatsPanelProps {
  stats: PlayerStats
  customAttributes?: Record<string, number>
}

const statIcons = {
  "Self-Awareness": Brain,
  "Self-Management": Heart,
  "Social Awareness": Users,
  "Relationship Management": Sparkles,
  "Clinical Reasoning": Lightbulb,
  Resilience: HelpCircle,
}

export function StatsPanel({ stats, customAttributes = {} }: StatsPanelProps) {
  return (
    <div className="card-themed p-6">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-6 w-6 text-themed-primary" />
        <h2 className="text-xl font-semibold text-themed-text">Emotional Intelligence Domains</h2>
      </div>
      <p className="text-sm text-themed-text opacity-70 mb-6 leading-relaxed">
        Track your development across the four core EI competencies for nursing excellence
      </p>

      <div className="space-y-5">
        {Object.entries(stats).map(([stat, value]) => {
          const Icon = statIcons[stat as keyof typeof statIcons] || Star
          return (
            <div key={stat} className="bg-themed-secondary/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-themed-primary/10">
                  <Icon className="w-5 h-5 text-themed-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center text-sm text-themed-text mb-1">
                    <span className="font-medium">{stat}</span>
                    <span className="text-themed-primary font-semibold">{value}/100</span>
                  </div>
                </div>
              </div>
              <div className="progress-bar h-2.5">
                <div className="progress-fill" style={{ width: `${Math.min((value / 100) * 100, 100)}%` }} />
              </div>
            </div>
          )
        })}

        {Object.keys(customAttributes).length > 0 && (
          <>
            <div className="border-t border-themed-border pt-5 mt-6">
              <h4 className="text-sm font-medium text-themed-text mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-themed-accent" />
                Additional Competencies
              </h4>
              {Object.entries(customAttributes).map(([name, value]) => (
                <div key={name} className="bg-themed-secondary/30 p-4 rounded-lg mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-4 h-4 text-themed-accent" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-themed-text mb-1">
                        <span className="font-medium">{name}</span>
                        <span className="text-themed-accent font-semibold">{value}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar h-2">
                    <div className="progress-fill" style={{ width: `${Math.min((value / 100) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
