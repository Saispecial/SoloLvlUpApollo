"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Save, Plus, Calendar, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Quest, QuestType, QuestDifficulty, Realm, PlayerStats } from "@/lib/types"
import { getSuggestedStatsFromAI } from "@/lib/ai-stats"

interface QuestFormProps {
  onSubmit: (quest: Omit<Quest, "id" | "completed" | "createdAt">) => void
  onClose: () => void
  editQuest?: Quest
  isEditing?: boolean
}

export function QuestForm({ onSubmit, onClose, editQuest, isEditing = false }: QuestFormProps) {
  const [title, setTitle] = useState(editQuest?.title || "")
  const [description, setDescription] = useState(editQuest?.description || "")
  const [type, setType] = useState<QuestType>(editQuest?.type || "Daily Reflection")
  const [difficulty, setDifficulty] = useState<QuestDifficulty>(editQuest?.difficulty || "Beginner")
  const [realm, setRealm] = useState<Realm>(editQuest?.realm || "Self-Awareness & Recognition")
  const [recurring, setRecurring] = useState(editQuest?.recurring || false)
  const [dueDate, setDueDate] = useState(
    editQuest?.dueDate ? new Date(editQuest.dueDate).toISOString().slice(0, 16) : "",
  )
  const [statBoosts, setStatBoosts] = useState<Partial<PlayerStats>>(
    editQuest?.statBoosts || {},
  )
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [suggestedStats, setSuggestedStats] = useState<Partial<PlayerStats> | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const xpValues: Record<QuestDifficulty, number> = {
    Beginner: 25,
    Intermediate: 50,
    Advanced: 75,
    "Professional Milestone": 100,
  }

  // AI stat suggestions with debouncing
  useEffect(() => {
    if (isEditing) return

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (title.trim() || description.trim()) {
        setIsFetchingSuggestions(true)
        try {
          const suggestions = await getSuggestedStatsFromAI(title, description)
          setSuggestedStats(suggestions)
        } catch (error) {
          console.error("Failed to fetch AI suggestions:", error)
          setSuggestedStats(null)
        } finally {
          setIsFetchingSuggestions(false)
        }
      } else {
        setSuggestedStats(null)
      }
    }, 1000)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [title, description, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      title,
      description,
      type,
      difficulty,
      realm,
      xp: xpValues[difficulty],
      recurring,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      statBoosts,
    })

    onClose()
  }

  const applySuggestions = () => {
    if (suggestedStats) {
      setStatBoosts(suggestedStats)
      setSuggestedStats(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card-themed w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-themed-text">{isEditing ? "Edit Quest" : "Create New Quest"}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-themed-text">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-themed-text">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-themed mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-themed-text">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-themed mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-themed-text">Type</Label>
                <Select value={type} onValueChange={(value: QuestType) => setType(value)}>
                  <SelectTrigger className="input-themed mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily Reflection">Daily Reflection</SelectItem>
                    <SelectItem value="Training Module">Training Module</SelectItem>
                    <SelectItem value="Weekly Challenge">Weekly Challenge</SelectItem>
                    <SelectItem value="Professional Goal">Professional Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-themed-text">Difficulty</Label>
                <Select value={difficulty} onValueChange={(value: QuestDifficulty) => setDifficulty(value)}>
                  <SelectTrigger className="input-themed mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner (25 XP)</SelectItem>
                    <SelectItem value="Intermediate">Intermediate (50 XP)</SelectItem>
                    <SelectItem value="Advanced">Advanced (75 XP)</SelectItem>
                    <SelectItem value="Professional Milestone">Professional Milestone (100 XP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-themed-text">Realm</Label>
              <Select value={realm} onValueChange={(value: Realm) => setRealm(value)}>
                <SelectTrigger className="input-themed mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Self-Awareness & Recognition">Self-Awareness & Recognition</SelectItem>
                  <SelectItem value="Emotional Regulation">Emotional Regulation</SelectItem>
                  <SelectItem value="Empathy & Patient Care">Empathy & Patient Care</SelectItem>
                  <SelectItem value="Team Communication">Team Communication</SelectItem>
                  <SelectItem value="Stress Management">Stress Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Stat Suggestions */}
            {!isEditing && (suggestedStats || isFetchingSuggestions) && (
              <div className="bg-themed-accent/10 p-3 rounded-lg border border-themed-accent/30">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-themed-accent">
                    <Sparkles className="w-4 h-4" />
                    AI Stat Suggestions
                  </div>
                  {isFetchingSuggestions ? (
                    <span className="text-xs text-themed-text opacity-60 italic">Analyzing...</span>
                  ) : (
                    suggestedStats && (
                      <Button
                        type="button"
                        onClick={applySuggestions}
                        size="sm"
                        className="text-xs bg-themed-accent text-white hover:opacity-90"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Apply
                      </Button>
                    )
                  )}
                </div>
                {suggestedStats && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {Object.entries(suggestedStats)
                      .filter(([_, value]) => value && value > 0)
                      .map(([stat, value]) => (
                        <div key={stat} className="flex justify-between">
                          <span className="text-themed-text opacity-80">{stat}:</span>
                          <span className="font-medium text-themed-accent">+{value}</span>
                        </div>
                      ))}
                    {Object.values(suggestedStats).every((v) => !v || v === 0) && !isFetchingSuggestions && (
                      <span className="col-span-2 text-xs text-center text-themed-text opacity-60 italic">
                        No specific stat boosts suggested.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual Stat Boosts */}
            <div>
              <Label className="text-themed-text">Stat Boosts</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(Object.keys({
                  "Self-Awareness": 0,
                  "Self-Management": 0,
                  "Social Awareness": 0,
                  "Relationship Management": 0,
                  "Clinical Competence": 0,
                  Resilience: 0,
                }) as Array<keyof PlayerStats>).map((stat) => (
                  <div key={stat} className="flex items-center gap-2">
                    <Label className="text-sm text-themed-text min-w-0 flex-1">{stat}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={statBoosts[stat] || 0}
                      onChange={(e) =>
                        setStatBoosts((prev) => ({
                          ...prev,
                          [stat]: Number.parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-16 input-themed"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-themed-text flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date & Time
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-themed mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="recurring" className="text-themed-text">
                Recurring Quest
              </Label>
            </div>

            <Button type="submit" className="w-full btn-primary">
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quest
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
