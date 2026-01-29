"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Eye,
  Heart,
  Brain,
  Plus,
  ChevronLeft,
} from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import type { DiaryEntry, PersonalReflection } from "@/lib/types"

interface DiaryEntryProps {
  isMobile?: boolean
}

export function DiaryEntryComponent({ isMobile = false }: DiaryEntryProps) {
  const { addDiaryEntry, convertDiaryToReflection, deleteDiaryEntry, getDiaryEntries, getReflections } =
    useAppStore()

  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [isPrivate, setIsPrivate] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConverting, setIsConverting] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [showNewEntry, setShowNewEntry] = useState(false)

  const diaryEntries = getDiaryEntries()
  const reflections = getReflections()

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await addDiaryEntry(content.trim())
      setContent("")
      setTitle("")
      setShowNewEntry(false)
    } catch (error) {
      console.error("Error adding diary entry:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConvert = async (diaryId: string) => {
    setIsConverting(diaryId)
    try {
      await convertDiaryToReflection(diaryId)
    } catch (error) {
      console.error("Error converting diary to reflection:", error)
    } finally {
      setIsConverting(null)
    }
  }

  const handleDelete = (diaryId: string) => {
    deleteDiaryEntry(diaryId)
  }

  const getRelatedReflection = (diaryEntry: DiaryEntry): PersonalReflection | null => {
    if (!diaryEntry.reflectionId) return null
    return reflections.find((r) => r.timestamp.toString() === diaryEntry.reflectionId) || null
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // New Entry Form View
  if (showNewEntry) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        <button
          onClick={() => setShowNewEntry(false)}
          className="flex items-center gap-2 text-primary font-medium mb-6 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Journal
        </button>

        {/* New Entry Card */}
        <div className="card-themed p-6">
          <h2 className="text-xl font-bold text-foreground mb-1">New Journal Entry</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Record your thoughts, feelings, and reflections
          </p>

          <div className="space-y-5">
            {/* Title Field */}
            <div>
              <Label className="text-foreground font-medium">Title (Optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your entry a title..."
                className="input-themed mt-1.5"
              />
            </div>

            {/* Content Field */}
            <div>
              <Label className="text-foreground font-medium">Your Thoughts</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? How are you feeling? What happened today?"
                className="input-themed mt-1.5 min-h-[150px]"
                disabled={isSubmitting}
              />
            </div>

            {/* Private Entry Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Private Entry</p>
                <p className="text-sm text-muted-foreground">Only you can see this entry</p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={!content.trim() || isSubmitting} className="btn-primary">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowNewEntry(false)} className="btn-secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Main Journal View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Journal</h1>
          <p className="text-muted-foreground">
            Reflect on your experiences and track your emotional journey
          </p>
        </div>
        <Button onClick={() => setShowNewEntry(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Journal Entries or Empty State */}
      {diaryEntries.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-foreground mb-2">Start Your Journaling Journey</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            Journaling helps you process emotions, track patterns, and deepen self-awareness
          </p>
          <Button onClick={() => setShowNewEntry(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {diaryEntries.map((entry) => {
            const relatedReflection = getRelatedReflection(entry)
            const isSelected = selectedEntry?.id === entry.id

            return (
              <motion.div
                key={entry.id}
                layout
                className="card-themed p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{formatDate(entry.timestamp)}</p>
                    <p className="text-foreground line-clamp-2">{entry.content}</p>
                  </div>

                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    {entry.convertedToReflection && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mr-2">
                        <Heart className="w-3 h-3" />
                        Analyzed
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEntry(isSelected ? null : entry)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {!entry.convertedToReflection && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConvert(entry.id)}
                        disabled={isConverting === entry.id}
                        className="text-primary hover:text-primary/80"
                      >
                        {isConverting === entry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <div className="text-foreground whitespace-pre-wrap mb-4">{entry.content}</div>

                      {relatedReflection && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">AI Analysis</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Mood:</span>
                              <span className="ml-2 text-foreground">{relatedReflection.mood}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Motivation:</span>
                              <span className="ml-2 text-primary font-medium">
                                {relatedReflection.motivationLevel}/10
                              </span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Emotional State:</span>
                              <span className="ml-2 text-foreground">{relatedReflection.emotionalState}</span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Challenges:</span>
                              <span className="ml-2 text-foreground">{relatedReflection.currentChallenges}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
