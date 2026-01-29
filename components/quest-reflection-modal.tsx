"use client"

import { useState, useEffect } from "react"
import type { Quest } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Sparkles, BookOpen } from "lucide-react"

interface QuestReflectionModalProps {
  quest: Quest
  onClose: () => void
  onComplete: (questId: string, reflection: string) => void
}

export function QuestReflectionModal({ quest, onClose, onComplete }: QuestReflectionModalProps) {
  const [reflection, setReflection] = useState(quest.reflectionNote || "")
  const [touched, setTouched] = useState(false)

  const minLength = 20
  const isValid = reflection.trim().length >= minLength

  useEffect(() => {
    setReflection(quest.reflectionNote || "")
  }, [quest])

  const handleComplete = () => {
    setTouched(true)
    if (!isValid) return
    onComplete(quest.id, reflection.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Quest in progress</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{quest.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {quest.type && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700">
                  daily
                </Badge>
              )}
              {quest.difficulty && (
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-xs font-medium text-sky-700">
                  {quest.difficulty.toLowerCase()}
                </Badge>
              )}
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs font-medium text-amber-700">
                +{quest.xp} XP
              </Badge>
              {quest.realm && (
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
                  {quest.realm}
                </Badge>
              )}
            </div>

            <p className="text-sm text-slate-700">{quest.description}</p>

            <div className="space-y-2 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Instructions
              </div>
              <p className="text-xs text-slate-700">
                Take a few minutes to actually complete this quest during your shift. Once you&apos;re done, use the
                reflection box below as proof of completion.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Sparkles className="h-4 w-4" />
                Reflection prompts
              </div>
              <ul className="list-disc space-y-1 pl-4 text-xs text-emerald-900">
                <li>What did you notice about your emotions during this quest?</li>
                <li>How did this activity impact your patients, team, or yourself?</li>
                <li>What will you carry forward into your next shift?</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Your reflection</p>
              <p className="text-xs text-slate-600">
                Write a short reflection as evidence that you completed this quest. Minimum {minLength} characters.
              </p>
            </div>

            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="What did you learn? How did you grow? What will you do differently next time?"
              className="min-h-[120px] resize-none text-sm"
            />

            {touched && !isValid && (
              <p className="text-xs font-medium text-rose-600">
                Please add a bit more detail to your reflection before completing this quest.
              </p>
            )}

            <div className="mt-auto flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleComplete}
                disabled={!isValid}
                className="w-full bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200"
              >
                Complete Quest (+{quest.xp} XP)
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
              >
                I&apos;ll finish this later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
