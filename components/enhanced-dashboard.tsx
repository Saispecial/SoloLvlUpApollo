"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { PlayerProfile, Quest, Achievement } from "@/lib/types"
import { MobileDashboard } from "./mobile-dashboard"
import { Target, Brain, BookOpen, MessageSquare, BarChart3, ChevronRight, CheckCircle2, Flame, TrendingUp, Heart, Mic, MicOff, Volume2, VolumeX, Keyboard } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Enhanced3DNurseScene from "@/components/counseling/Enhanced3DNurseScene"
import { useTourStore } from "@/stores/tour-store"
import { HelpCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EnhancedDashboardProps {
  player: PlayerProfile
  quests: Quest[]
  achievements: Achievement[]
}

export function EnhancedDashboard({ player, quests, achievements }: EnhancedDashboardProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isTourActive, startTour } = useTourStore()
  const [isTalking, setIsTalking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showCommandInput, setShowCommandInput] = useState(false)
  const [commandInput, setCommandInput] = useState("")
  const { toast } = useToast()

  // Voice Command Logic
  const handleVoiceCommand = (command: string) => {
    const lowerCmd = command.toLowerCase()
    console.log("Voice Command Received:", lowerCmd)

    // Helper to speak confirmation
    const speakConfirmation = (text: string) => {
      if (isMuted) return
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis?.speak(utterance)
    }

    let actionTaken = false
    let responseText = ""

    if (lowerCmd.includes("dashboard") || lowerCmd.includes("home")) {
      responseText = "Opening Dashboard"
      window.location.href = "/?tab=dashboard"
      actionTaken = true
    } else if (lowerCmd.includes("quest") || lowerCmd.includes("activity")) {
      responseText = "Opening Quests"
      window.location.href = "/?tab=quests"
      actionTaken = true
    } else if (lowerCmd.includes("assessment") || lowerCmd.includes("test")) {
      responseText = "Opening Assessment Center"
      window.location.href = "/assessment"
      actionTaken = true
    } else if (lowerCmd.includes("journal") || lowerCmd.includes("diary")) {
      responseText = "Opening Journal"
      window.location.href = "/?tab=diary"
      actionTaken = true
    } else if (lowerCmd.includes("counselor") || lowerCmd.includes("chat")) {
      responseText = "Opening Counselor"
      window.location.href = "/counselor"
      actionTaken = true
    } else if (lowerCmd.includes("stats") || lowerCmd.includes("progress")) {
      responseText = "Opening Statistics"
      window.location.href = "/?tab=stats"
      actionTaken = true
    } else if (lowerCmd.includes("achievements") || lowerCmd.includes("awards")) {
      responseText = "Opening Achievements"
      window.location.href = "/?tab=achievements"
      actionTaken = true
    } else if (lowerCmd.includes("settings") || lowerCmd.includes("config")) {
      responseText = "Opening Settings"
      window.location.href = "/?tab=settings"
      actionTaken = true
    }

    if (actionTaken) {
      speakConfirmation(responseText)
      toast({
        title: "Voice Command Recognized",
        description: `"${command}" → ${responseText}`,
        variant: "default",
      })
    } else {
      speakConfirmation("I didn't catch that command.")
      toast({
        title: "Command Not Understood",
        description: `Heard: "${command}". Try "Open Dashboard" or "Open Quests".`,
        variant: "destructive",
      })
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.")
      return
    }

    // @ts-ignore - SpeechRecognition types might be missing
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      toast({
        title: "Listening...",
        description: "Speak a command now.",
      })
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      handleVoiceCommand(transcript)
    }

    recognition.onerror = (event: any) => {
      console.warn("Speech Recognition Error:", event.error)
      setIsListening(false)

      if (event.error === 'no-speech') {
        // Just timeout, no need to alert user aggressively
        return
      }

      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice commands.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Microphone Error",
          description: "Could not hear you. Please try again.",
          variant: "destructive",
        })
      }
    }

    recognition.start()
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      // Optional: Speak confirmation
    } else {
      setIsMuted(true)
      window.speechSynthesis?.cancel()
      setIsTalking(false)
    }
  }

  // Import dialogues (lazy inline or top level, assuming import added)
  // We need to add the import statement at the top, but since I can't do multiple chunks easily without risk, 
  // I will assume I'll add the import in a separate step or use a require if needed, 
  // but better to added the logic here and then add the import.
  // Actually, I can add the logic and the import in one go if I include the top of the file, 
  // but that's a huge replacement.
  // I'll add the logic inside the component first.

  useEffect(() => {
    // Only speak on dashboard mount if tour is NOT active
    if (isTourActive) return;

    const speakRandomDialogue = async () => {
      // Dynamic import to avoid top-level dependency issues if any
      const { DASHBOARD_DIALOGUES } = await import("@/lib/constants/dashboard-dialogues")
      const randomMsg = DASHBOARD_DIALOGUES[Math.floor(Math.random() * DASHBOARD_DIALOGUES.length)]

      const utterance = new SpeechSynthesisUtterance(randomMsg)
      const voices = window.speechSynthesis?.getVoices() || []
      const femaleVoice = voices.find(v =>
        v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English')
      )

      if (femaleVoice) utterance.voice = femaleVoice
      utterance.rate = 1.0
      utterance.pitch = 1.1

      utterance.onstart = () => setIsTalking(true)
      utterance.onend = () => setIsTalking(false)
      utterance.onerror = () => setIsTalking(false)

      // Small delay to ensure interaction/loading
      setTimeout(() => {
        window.speechSynthesis?.speak(utterance)
      }, 1000)
    }

    // Only run once on mount
    speakRandomDialogue()

    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [isTourActive])

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === "undefined") return
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    setMounted(true)
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [])

  if (!mounted) return null

  if (isMobile) {
    return <MobileDashboard player={player} quests={quests} achievements={achievements} />
  }

  const completedQuests = quests.filter((q) => q.completed)
  const activeQuests = quests.filter((q) => !q.completed)

  const xpProgress = player.nextLevelXp > 0 ? (player.xp / player.nextLevelXp) * 100 : 0

  return (
    <motion.div
      className="space-y-8 max-w-6xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Attraction Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[500px]">
        {/* Left Column: Profile & Progress (3 cols) */}
        <motion.div
          className="lg:col-span-3 bg-gradient-to-br from-blue-500 via-blue-600 to-teal-500 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{player.name}</h1>
                <p className="text-white/80 text-sm">{player.rank || "Frontline Nurse"}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white font-semibold text-sm">Lvl {player.level}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-white/80 text-xs mb-2">
                <span>XP Progress</span>
                <span>{player.xp} / {player.nextLevelXp}</span>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/90 rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-white/80" />
              <div>
                <p className="text-lg font-bold text-white leading-none">{completedQuests.length}</p>
                <p className="text-white/70 text-xs">Completed Quests</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <Flame className="w-5 h-5 text-white/80" />
              <div>
                <p className="text-lg font-bold text-white leading-none">{player.streak}</p>
                <p className="text-white/70 text-xs">Day Streak</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center Column: 3D Model (Main Attraction) (6 cols) */}
        <motion.div
          className="lg:col-span-6 relative rounded-2xl overflow-hidden bg-gradient-to-b from-teal-50/50 to-white border border-teal-100 shadow-2xl flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-teal-700 border border-teal-100 shadow-sm">
            Interactive AI Companion
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white text-teal-700 border border-teal-100 h-8 px-3 text-xs gap-2 shadow-sm transition-all hover:scale-105"
            onClick={startTour}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Need Tutorial?
          </Button>

          {/* Tutorial Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white text-teal-700 border border-teal-100 h-8 px-3 text-xs gap-1.5 shadow-sm"
            onClick={startTour}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Need Tutorial?
          </Button>

          {/* Mute Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-16 right-4 z-10 backdrop-blur-sm border shadow-sm transition-all hover:scale-105 ${isMuted
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              : "bg-white/80 text-teal-700 border-teal-100 hover:bg-white"
              }`}
            onClick={toggleMute}
            title={isMuted ? "Unmute Bot" : "Mute Bot"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          {/* Voice Command Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-28 right-4 z-10 backdrop-blur-sm border shadow-sm transition-all hover:scale-105 ${isListening
              ? "bg-red-500 text-white border-red-600 animate-pulse hover:bg-red-600"
              : "bg-white/80 text-teal-700 border-teal-100 hover:bg-white"
              }`}
            onClick={startListening}
            title="Voice Commands"
          >
            {isListening ? <div className="animate-pulse"><Mic className="w-5 h-5" /></div> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Text Command Button (Fallback) */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-40 right-4 z-10 backdrop-blur-sm border shadow-sm transition-all hover:scale-105 ${showCommandInput
                ? "bg-teal-600 text-white border-teal-700 hover:bg-teal-700"
                : "bg-white/80 text-teal-700 border-teal-100 hover:bg-white"
              }`}
            onClick={() => setShowCommandInput(!showCommandInput)}
            title="Type Command"
          >
            <Keyboard className="w-5 h-5" />
          </Button>

          {/* Text Command Input Field */}
          {showCommandInput && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-40 right-16 z-20 w-64"
              onSubmit={(e) => {
                e.preventDefault()
                if (commandInput.trim()) {
                  handleVoiceCommand(commandInput)
                  setCommandInput("")
                  setShowCommandInput(false)
                }
              }}
            >
              <div className="flex gap-2 p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-teal-100">
                <input
                  autoFocus
                  type="text"
                  placeholder="Type 'Open Quests'..."
                  className="flex-1 bg-transparent border-none text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 px-2 bg-teal-600 text-white hover:bg-teal-700"
                >
                  Go
                </Button>
              </div>
            </motion.form>
          )}

          <div className="flex-1 w-full relative min-h-[400px]">
            <div className={`w-full h-full transition-opacity duration-300 ${isTourActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {!isTourActive && <Enhanced3DNurseScene emotion={isTalking ? "talking" : "neutral"} isTalking={isTalking} />}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Quick Actions / Daily (3 cols) */}
        <motion.div
          className="lg:col-span-3 flex flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
            <Target className="w-10 h-10 text-teal-600 mb-3 bg-teal-50 p-2 rounded-full" />
            <h3 className="font-semibold text-gray-900 mb-1">Active Quests</h3>
            <p className="text-3xl font-bold text-teal-600 mb-2">{activeQuests.length}</p>
            <Button
              variant="outline"
              className="w-full mt-auto"
              onClick={() => (window.location.href = "/?tab=quests")}
            >
              View Details
            </Button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
            <MessageSquare className="w-10 h-10 text-purple-600 mb-3 bg-purple-50 p-2 rounded-full" />
            <h3 className="font-semibold text-gray-900 mb-1">AI Counselor</h3>
            <p className="text-sm text-gray-500 mb-4">Talk through your day</p>
            <Button
              className="w-full mt-auto bg-purple-600 hover:bg-purple-700"
              onClick={() => (window.location.href = "/counselor")}
            >
              Start Session
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Feature Cards Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Active Quests Card */}
        <FeatureCard
          icon={<Target className="w-6 h-6 text-teal-600" />}
          title="Active Quests"
          subtitle="Continue your journey"
          value={activeQuests.length.toString()}
          actionLabel="View Quests"
          actionVariant="outline"
          onClick={() => (window.location.href = "/?tab=quests")}
        />

        {/* EI Assessment Card */}
        <FeatureCard
          icon={<Brain className="w-6 h-6 text-blue-600" />}
          title="EI Assessment"
          subtitle="Track your growth"
          description="Measure your emotional intelligence"
          actionLabel="Start Assessment"
          actionVariant="primary"
          onClick={() => (window.location.href = "/assessment")}
        />

        {/* Journal Card */}
        <FeatureCard
          icon={<BookOpen className="w-6 h-6 text-teal-600" />}
          title="Journal"
          subtitle="Reflect and grow"
          description="Record your thoughts and feelings"
          actionLabel="Open Journal"
          actionVariant="primary"
          onClick={() => (window.location.href = "/?tab=diary")}
        />

        {/* Reflection Card */}
        <FeatureCard
          icon={<Heart className="w-6 h-6 text-pink-600" />}
          title="Reflection"
          subtitle="Daily check-in"
          description="Track mood and generate quests"
          actionLabel="Start Reflection"
          actionVariant="primary"
          onClick={() => (window.location.href = "/reflection")}
        />

        {/* AI Counselor Card */}
        <FeatureCard
          icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
          title="AI Counselor"
          subtitle="Get support anytime"
          description="Talk through challenges"
          actionLabel="Start Session"
          actionVariant="accent"
          onClick={() => (window.location.href = "/counselor")}
        />

        {/* Progress/Analytics Card */}
        <FeatureCard
          icon={<BarChart3 className="w-6 h-6 text-indigo-600" />}
          title="Progress"
          subtitle="View your analytics"
          description="Track your growth over time"
          actionLabel="View Progress"
          actionVariant="outline"
          onClick={() => (window.location.href = "/?tab=analytics")}
        />
      </motion.div>

      {/* Daily Quests Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Daily Quests</h2>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => (window.location.href = "/?tab=quests")}
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeQuests.slice(0, 3).map((quest) => (
            <QuestPreviewCard key={quest.id} quest={quest} />
          ))}

          {activeQuests.length === 0 && (
            <div className="col-span-full empty-state">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">No active quests</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start your journey by creating a quest
              </p>
              <Button
                className="mt-4 btn-primary"
                onClick={() => (window.location.href = "/?tab=quests")}
              >
                Create Quest
              </Button>
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  description?: string
  value?: string
  actionLabel: string
  actionVariant: "primary" | "outline" | "accent"
  onClick: () => void
}

function FeatureCard({
  icon,
  title,
  subtitle,
  description,
  value,
  actionLabel,
  actionVariant,
  onClick,
}: FeatureCardProps) {
  return (
    <div className="feature-card flex flex-col">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-2">{subtitle}</p>

      {value && <p className="text-3xl font-bold text-blue-600 mb-4">{value}</p>}

      {description && <p className="text-sm text-muted-foreground mb-4 flex-1">{description}</p>}

      <Button
        className={
          actionVariant === "primary"
            ? "btn-primary w-full"
            : actionVariant === "accent"
              ? "bg-green-600 hover:bg-green-700 text-white w-full"
              : "btn-secondary w-full"
        }
        onClick={onClick}
      >
        {actionLabel}
      </Button>
    </div>
  )
}

// Quest Preview Card Component
interface QuestPreviewCardProps {
  quest: Quest
}

function QuestPreviewCard({ quest }: QuestPreviewCardProps) {
  const getQuestIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "self-awareness training":
      case "mental":
        return <Brain className="w-5 h-5 text-teal-600" />
      case "self-management development":
        return <Target className="w-5 h-5 text-amber-600" />
      case "social awareness practice":
        return <MessageSquare className="w-5 h-5 text-blue-600" />
      case "relationship management":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      default:
        return <Target className="w-5 h-5 text-teal-600" />
    }
  }

  return (
    <div className="quest-card p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted">{getQuestIcon(quest.type)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">{quest.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{quest.description}</p>

          <div className="flex items-center gap-2 mb-4">
            <span className="badge-easy">{quest.difficulty?.toLowerCase() || "easy"}</span>
            <span className="badge-daily">{quest.questType?.toLowerCase() || "daily"}</span>
            <span className="badge-xp">+{quest.xp} XP</span>
          </div>

          <Button
            className="btn-primary w-full"
            onClick={() => (window.location.href = "/?tab=quests")}
          >
            Start Quest
          </Button>
        </div>
      </div>
    </div>
  )
}
