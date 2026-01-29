"use client"

import type React from "react"

import { useState, useEffect, useImperativeHandle, forwardRef, use } from "react"
import { useSearchParams } from "next/navigation"
import { generateQuests } from "@/lib/gemini-api"
import { useAppStore } from "@/stores/app-store"
import { MobileNavigation } from "./mobile-navigation"
import { ResponsiveLayout } from "./responsive-layout"
import { EnhancedDashboard } from "./enhanced-dashboard"
import { QuestForm } from "./quest-form"
import { AchievementsPanel } from "./achievements-panel"
import { StatsPanel } from "./stats-panel"
import { SettingsPage } from "./settings-page"
import { MobileQuestCard } from "./mobile-quest-card"
import { ResponsiveCard } from "./responsive-card"
import { ParticleBackground } from "./particle-background"
import { FloatingElements } from "./floating-elements"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { DiaryEntryComponent } from "./diary-entry"
import { motion } from "framer-motion"
import { Heart, ClipboardList, Plus, Sparkles, Loader2 } from "lucide-react"
import type { Quest } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { QuestReflectionModal } from "./quest-reflection-modal"
import { ProgramProgressIndicator } from "./program-progress-indicator"
import { WeekBasedModuleGrouping } from "./week-based-module-grouping"
import { ProgramCompletionCelebration, useProgramCompletionCheck } from "./program-completion-celebration"
import { useTourStore } from "@/stores/tour-store"

const Dashboard = forwardRef(function Dashboard(props, ref) {
  // Use unified app store
  const {
    nurse,
    trainingModules,
    completedModules,
    milestones,
    currentReflection,
    reflections,
    addTrainingModules,
    completeModule,
    deleteModule,
    editModule,
    resetNurse,
    setReflection,
    addCustomAttribute,
    updateNurseName,
    updateTheme,
    getReflections,
    getDiaryEntries,
    setActiveProgram,
    getProgramModules,
    getCurrentWeek,
  } = useAppStore()

  // Aliases for compatibility
  const player = nurse
  const quests = trainingModules
  const completedQuests = completedModules
  const achievements = milestones
  const addQuests = addTrainingModules
  const completeQuest = completeModule
  const deleteQuest = deleteModule
  const editQuest = editModule
  const resetPlayer = resetNurse
  const updatePlayerName = updateNurseName

  // Read tab from URL query parameter
  const [activeTab, setActiveTab] = useState("dashboard")
  
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const tabParam = searchParams?.get("tab")
    if (tabParam && ["dashboard", "quests", "assessment", "reflection", "diary", "analytics", "stats", "achievements", "settings"].includes(tabParam)) {
      setActiveTab(tabParam)
    } else if (!tabParam) {
        setActiveTab("dashboard")
    }
  }, [searchParams])
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [motivation, setMotivation] = useState("")
  const [emotionalGuidance, setEmotionalGuidance] = useState("")
  const [newAttributeName, setNewAttributeName] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [mood, setMood] = useState("")
  const [emotionalState, setEmotionalState] = useState("")
  const [currentChallenges, setCurrentChallenges] = useState("")
  const [motivationLevel, setMotivationLevel] = useState("")
  const [reflectionError, setReflectionError] = useState("")
  const [activeQuestForReflection, setActiveQuestForReflection] = useState<Quest | null>(null)
  
  // Program completion check
  const { completedProgram, clearCelebration } = useProgramCompletionCheck()

  // Tour Trigger Logic
  const { hasSeenTour, showNewUserPopup, setShowNewUserPopup } = useTourStore()

  useEffect(() => {
    // Trigger tour popup if user has a name (not default) and hasn't seen tour yet
    // and is on the main dashboard view
    if (nurse.name && nurse.name !== "Nurse" && !hasSeenTour && !showNewUserPopup && activeTab === "dashboard") {
      setShowNewUserPopup(true)
    }
  }, [nurse.name, hasSeenTour, showNewUserPopup, activeTab, setShowNewUserPopup])

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === "undefined") return
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    if (typeof document !== "undefined") {
      document.documentElement.className = `theme-${player.theme}`
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [player.theme])

  const generateNewQuests = async () => {
    console.log("Generating new quests...")
    setIsGenerating(true)
    try {
      const diaryEntries = getDiaryEntries()
      console.log("Player profile:", player)
      console.log("Current reflection:", currentReflection)

      const response = await generateQuests(player, currentReflection || undefined, diaryEntries)
      console.log("Generated quests response:", response)

      if (response.quests && Array.isArray(response.quests)) {
        addQuests(response.quests)
        setMotivation(response.suggestions.motivation)
        setEmotionalGuidance(response.suggestions.emotionalGuidance)
        console.log("Successfully added", response.quests.length, "quests")
      } else {
        console.error("Invalid response format:", response)
        setMotivation("Unable to generate quests right now, please try again later.")
      }
    } catch (err) {
      console.error("Quest generation failed:", err)
      setMotivation("Unable to generate quests right now, please try again later.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleQuestSubmit = (questData: Omit<Quest, "id" | "completed" | "createdAt">) => {
    if (editingQuest) {
      editModule(editingQuest.id, questData)
      setEditingQuest(null)
    } else {
      addTrainingModules([questData])
    }
    setShowQuestForm(false)
  }

  const activeQuests = quests.filter((q) => !q.completed)
  
  // Debug logging
  useEffect(() => {
    console.log("[Dashboard] Quest state:", {
      questsCount: quests.length,
      activeQuestsCount: activeQuests.length,
      activeTab,
    })
  }, [quests, activeQuests, activeTab])

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mood || !emotionalState || !currentChallenges || !motivationLevel) {
      setReflectionError("Please fill in all fields.")
      return
    }
    setReflectionError("")
    setReflection({ mood, emotionalState, currentChallenges, motivationLevel, source: "manual" })
    setMood("")
    setEmotionalState("")
    setCurrentChallenges("")
    setMotivationLevel("")
  }

  const openQuestReflection = (quest: Quest) => {
    // Mark quest as started (only once)
    if (!quest.startedAt) {
      editModule(quest.id, { startedAt: new Date() })
    }
    setActiveQuestForReflection(quest)
  }

  const handleQuestReflectionComplete = (questId: string, reflectionText: string) => {
    editModule(questId, {
      startedAt: trainingModules.find((q) => q.id === questId)?.startedAt ?? new Date(),
      reflectionNote: reflectionText,
    })
    completeModule(questId)
    setActiveQuestForReflection(null)
  }

  useImperativeHandle(ref, () => ({
    setActiveTab,
    generateNewQuests,
    setShowQuestForm,
    setEditingQuest,
    setReflection,
    handleQuestSubmit,
    handleReflectionSubmit,
  }))

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <EnhancedDashboard player={player} quests={quests} achievements={achievements} />

      case "assessment":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <div className="text-center space-y-4 py-8">
              <h2 className="text-2xl font-bold">EI Assessment Center</h2>
              <p className="text-foreground/70">
                Complete a validated assessment to establish your baseline
              </p>
              <Button
                onClick={() => (window.location.href = "/assessment")}
                className="bg-warm-gradient-teal text-white"
              >
                Start Assessment
              </Button>
            </div>
          </motion.div>
        )

      case "quests":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-4 ${isMobile ? "pb-24" : ""}`}
          >
            {/* Program Progress Indicator */}
            <div className={isMobile ? "px-4" : ""}>
              <ProgramProgressIndicator />
            </div>

            <ResponsiveCard
              mobileClassName="mx-4"
              className="bg-gradient-to-r from-themed-primary/10 to-themed-accent/10"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-themed-text">
                    Active Training Modules ({activeQuests.length})
                  </h2>
                  <p className="text-sm text-themed-text opacity-70">
                    Complete training modules to develop your emotional intelligence competencies
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"
                    onClick={() => {
                      setEditingQuest(null)
                      setShowQuestForm(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {isMobile ? "New" : "New Activity"}
                  </button>
                  <button
                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
                    disabled={isGenerating}
                    onClick={generateNewQuests}
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? "Generating..." : isMobile ? "AI" : "AI Suggestions"}
                  </button>
                </div>
              </div>
            </ResponsiveCard>

            {/* Motivation Messages */}
            {motivation && (
              <ResponsiveCard mobileClassName="mx-4" className="bg-themed-primary/10 border-themed-primary/30">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-themed-primary flex-shrink-0 mt-0.5" />
                  <p className="text-themed-text text-sm leading-relaxed">{motivation}</p>
                </div>
              </ResponsiveCard>
            )}

            {emotionalGuidance && (
              <ResponsiveCard mobileClassName="mx-4" className="bg-themed-accent/10 border-themed-accent/30">
                <div className="flex items-start gap-3">
                  <ClipboardList className="h-5 w-5 text-themed-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-themed-accent text-sm font-medium mb-1">Clinical Guidance:</p>
                    <p className="text-themed-text text-sm leading-relaxed">{emotionalGuidance}</p>
                  </div>
                </div>
              </ResponsiveCard>
            )}

            {/* Week-Based Module Grouping */}
            <WeekBasedModuleGrouping
              quests={activeQuests}
              isMobile={isMobile}
              onComplete={(questId) => {
                const target = quests.find((q) => q.id === questId)
                if (target) {
                  openQuestReflection(target)
                }
              }}
              onDelete={deleteQuest}
              onEdit={(q) => {
                setEditingQuest(q)
                setShowQuestForm(true)
              }}
            />

            {activeQuests.length === 0 && (
              <ResponsiveCard mobileClassName="mx-4" className="text-center py-8">
                <div className="text-themed-text opacity-60">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-themed-primary/20 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-themed-primary" />
                  </div>
                  <p className="mb-2 font-medium">No active EI activities yet</p>
                  <p className="text-sm mb-4">Start your emotional intelligence development journey</p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setEditingQuest(null)
                      setShowQuestForm(true)
                    }}
                  >
                    Create Your First Activity
                  </button>
                </div>
              </ResponsiveCard>
            )}
          </motion.div>
        )

      case "reflection":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-4 ${isMobile ? "pb-24 px-4" : ""}`}
          >
            <ResponsiveCard>
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-6 w-6 text-themed-primary" />
                <h3 className="text-lg font-semibold text-themed-text">Clinical Reflection</h3>
              </div>
              <p className="text-themed-text opacity-70 text-sm mb-6 leading-relaxed">
                Reflect on your clinical experiences and emotional responses to receive personalized EI development
                activities
              </p>
              <form onSubmit={handleReflectionSubmit} className="space-y-4">
                <div>
                  <Label className="text-themed-text font-medium">Current Emotional State</Label>
                  <Input
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="How are you feeling today?"
                    className="input-themed mt-1"
                  />
                </div>
                <div>
                  <Label className="text-themed-text font-medium">Clinical Experience</Label>
                  <Textarea
                    value={emotionalState}
                    onChange={(e) => setEmotionalState(e.target.value)}
                    placeholder="Describe a recent patient interaction or clinical situation..."
                    className="input-themed mt-1"
                    rows={4}
                  />
                </div>
                <div>
                  <Label className="text-themed-text font-medium">Current Challenges</Label>
                  <Textarea
                    value={currentChallenges}
                    onChange={(e) => setCurrentChallenges(e.target.value)}
                    placeholder="What challenges are you facing in your practice?"
                    className="input-themed mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-themed-text font-medium">Wellbeing & Resilience</Label>
                  <Input
                    value={motivationLevel}
                    onChange={(e) => setMotivationLevel(e.target.value)}
                    placeholder="How are your energy levels and professional satisfaction?"
                    className="input-themed mt-1"
                  />
                </div>
                {reflectionError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{reflectionError}</div>}
                <Button type="submit" className="btn-primary w-full mt-2">
                  Save Reflection
                </Button>
              </form>
            </ResponsiveCard>

            <ResponsiveCard>
              <h4 className="text-md font-semibold text-themed-text mb-3">Reflection History</h4>
              {getReflections().length === 0 ? (
                <div className="text-themed-text opacity-60 text-sm p-4 text-center bg-themed-secondary/30 rounded">
                  No reflections yet. Your clinical reflections will appear here.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-themed-border">
                  {getReflections().map((reflection, idx) => (
                    <div key={idx} className="py-3 px-2 hover:bg-themed-secondary/20 rounded transition-colors">
                      <div className="text-xs text-themed-text opacity-60 mb-2">
                        {new Date(reflection.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium text-themed-primary">Emotional State:</span> {reflection.mood}
                        </div>
                        <div>
                          <span className="font-medium text-themed-primary">Clinical Experience:</span>{" "}
                          {reflection.emotionalState}
                        </div>
                        <div>
                          <span className="font-medium text-themed-primary">Challenges:</span>{" "}
                          {reflection.currentChallenges}
                        </div>
                        <div>
                          <span className="font-medium text-themed-primary">Wellbeing:</span>{" "}
                          {reflection.motivationLevel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ResponsiveCard>
          </motion.div>
        )

      case "stats":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <StatsPanel stats={player.stats || player.competencies} customAttributes={player.customAttributes} />
          </motion.div>
        )

      case "achievements":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <AchievementsPanel achievements={achievements} completedQuests={completedQuests} />
          </motion.div>
        )

      case "analytics":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <AnalyticsDashboard isMobile={isMobile} />
          </motion.div>
        )

      case "diary":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <DiaryEntryComponent isMobile={isMobile} />
          </motion.div>
        )

      case "settings":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? "pb-24 px-4" : ""}`}
          >
            <SettingsPage
              player={player}
              onUpdateName={updatePlayerName}
              onThemeChange={updateTheme}
              onReset={resetPlayer}
            />
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Navigation */}
      <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Background Effects - Only on Desktop */}
        {!isMobile && (
          <>
            <ParticleBackground />
            <FloatingElements />
          </>
        )}

        {/* Main Content */}
        <div className={`relative z-20 ${!isMobile ? "max-w-6xl mx-auto px-6 py-6" : "pt-4"}`}>
          {renderTabContent()}
        </div>

        {/* Quest Form Modal */}
        {showQuestForm && (
          <QuestForm
            onSubmit={handleQuestSubmit}
            onClose={() => {
              setShowQuestForm(false)
              setEditingQuest(null)
            }}
            editQuest={editingQuest || undefined}
            isEditing={Boolean(editingQuest)}
          />
        )}

        {/* Quest Reflection Modal */}
        {activeQuestForReflection && (
          <QuestReflectionModal
            quest={activeQuestForReflection}
            onClose={() => setActiveQuestForReflection(null)}
            onComplete={handleQuestReflectionComplete}
          />
        )}

        {/* Program Completion Celebration */}
        {completedProgram && (
          <ProgramCompletionCelebration
            programId={completedProgram.programId}
            programName={completedProgram.programName}
            onClose={clearCelebration}
          />
        )}
      </motion.div>
    </div>
  )
})

export default Dashboard
