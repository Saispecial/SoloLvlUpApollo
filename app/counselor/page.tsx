"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/stores/app-store"
import { useTourStore } from "@/stores/tour-store"
import {
  Send,
  Loader2,
  Sparkles,
  ChevronLeft,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Target,
  ArrowRight,
  Plus,
  Brain,
  CheckCircle2,
  Heart
} from "lucide-react"
import dynamic from "next/dynamic"

const Enhanced3DNurseScene = dynamic(() => import("@/components/counseling/Enhanced3DNurseScene"), {
  ssr: false,
  loading: () => (
     <div className="h-full w-full flex flex-col gap-3 items-center justify-center bg-black/50 text-white text-lg tracking-wide">
       <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
       <p>Loading ARIA...</p>
     </div>
   )
})

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  suggestedTool?: {
    id: string
    name: string
    description: string
    route: string
  }
  questOffer?: {
    description: string
  }
  generatedQuest?: {
    title: string
    realm: string
    xp: number
  }
}

export default function CounselorPage() {
  const router = useRouter()
  const { nurse, trainingModules, completedModules, addTrainingModules } = useAppStore()
  const { isTourActive, startTour } = useTourStore()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emotion, setEmotion] = useState("neutral")
  const [isTalking, setIsTalking] = useState(false)

  // Voice features
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [speechSupported, setSpeechSupported] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Check for speech support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setSpeechSupported(!!SpeechRecognition && !!window.speechSynthesis)
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Quick greeting animation on page load
  useEffect(() => {
    const greetingDemo = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setEmotion("hi")
      await new Promise(resolve => setTimeout(resolve, 2000))
      setEmotion("neutral")
    }

    greetingDemo()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    // Scroll to the bottom of the page when new messages arrive
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Build user context for API
  const buildUserContext = useCallback(() => {
    const activeQuests = trainingModules.filter(m => !m.completed)
    const recentCompleted = completedModules.slice(-5)

    return {
      name: nurse.name || "Friend",
      level: nurse.competencyLevel || 1,
      rank: nurse.professionalRank || "Developing",
      xp: nurse.totalEIPoints || 0,
      streak: nurse.learningStreak || 0,
      competencies: nurse.competencies || {},
      completedQuestsCount: completedModules.length,
      activeQuestsCount: activeQuests.length,
      recentQuests: [...activeQuests.slice(0, 3), ...recentCompleted.slice(0, 2)].map(q => ({
        title: q.title,
        realm: q.realm,
        completed: q.completed
      })),
      achievements: []
    }
  }, [nurse, trainingModules, completedModules])

  // Speech recognition
  const startListening = useCallback(() => {
    if (!speechSupported) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = "en-US"

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + (prev ? " " : "") + transcript)
      setIsListening(false)
    }

    recognitionRef.current.onerror = () => setIsListening(false)
    recognitionRef.current.onend = () => setIsListening(false)

    recognitionRef.current.start()
    setIsListening(true)
  }, [speechSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  // Text-to-speech with animation sync
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !voiceEnabled) return

    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    const voices = synthRef.current.getVoices()
    const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Victoria") || v.lang.includes("en-US"))
    if (femaleVoice) utterance.voice = femaleVoice

    utterance.onstart = () => {
      setIsTalking(true)
      setEmotion("talking")
    }
    utterance.onend = () => {
      setIsTalking(false)
      setEmotion("neutral")
    }
    utterance.onerror = () => {
      setIsTalking(false)
      setEmotion("neutral")
    }

    synthRef.current.speak(utterance)
  }, [voiceEnabled])

  // Handle quest generation
  const handleGenerateQuest = async (description: string) => {
    setIsLoading(true)
    setEmotion("thinking")

    try {
      const response = await fetch("/api/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          userContext: buildUserContext(),
          action: "generate_quest",
          toolId: description
        }),
      })

      if (!response.ok) throw new Error("Failed to generate quest")

      const data = await response.json()

      if (data.quest) {
        addTrainingModules([data.quest])
        const confirmMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message,
          generatedQuest: {
            title: data.quest.title,
            realm: data.quest.realm,
            xp: data.quest.xp
          }
        }
        setMessages(prev => [...prev, confirmMessage])
        if (voiceEnabled) speak(data.message)
      }
    } catch (error) {
      console.error("Quest generation error:", error)
    } finally {
      setIsLoading(false)
      if (!isTalking) setEmotion("neutral")
    }
  }

  // Main submit handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setEmotion("listening")

    try {
      const response = await fetch("/api/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userContext: buildUserContext()
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        suggestedTool: data.suggestedTool,
        questOffer: data.questOffer
      }

      setMessages(prev => [...prev, assistantMessage])
      if (voiceEnabled && data.message) speak(data.message)

    } catch (error) {
      console.error("Chat error:", error)

      // Provide helpful fallback responses based on user input
      let fallbackResponse = "I apologize, but I'm having trouble connecting right now."

      const userInput = input.toLowerCase()
      if (userInput.includes("stress") || userInput.includes("anxious") || userInput.includes("overwhelmed")) {
        fallbackResponse = "I understand you're feeling stressed. While I'm having connection issues, you might find the Reframe tool helpful for immediate emotional support, or try the Breathing Exercise for quick stress relief."
      } else if (userInput.includes("help") || userInput.includes("support")) {
        fallbackResponse = "I'm here to help! While I'm having connection issues, you can explore the AI Tools section for immediate support, or check out your training modules for structured EI development."
      } else if (userInput.includes("training") || userInput.includes("learn")) {
        fallbackResponse = "Great that you want to learn! While I'm having connection issues, you can access your training program and AI tools directly from the main dashboard."
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fallbackResponse,
        },
      ])
    } finally {
      setIsLoading(false)
      if (!isTalking) setEmotion("neutral")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#03060c] to-[#050912] text-white font-['Space_Grotesk'] pb-10">
      {/* Background Decor */}
      <div className="cosmic-glow"></div>
      <div className="noise-overlay"></div>

      {/* Header Overlay */}
      <header className="flex justify-between items-center p-6 md:px-12 z-20 relative">
        <Link href="/" className="pointer-events-auto flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-cyan-400 group-hover:bg-cyan-400/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <span className="hidden md:inline font-semibold tracking-widest text-sm uppercase">Back</span>
        </Link>

        <div className="flex items-center gap-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-12 h-12 rounded-2xl border ${voiceEnabled ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-400" : "border-white/10 bg-white/5 text-white/40"} transition-all`}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">Nurse Active</span>
            <span className="font-bold text-cyan-400 tracking-wider">ARIA v2.0</span>
          </div>
        </div>
      </header>

      {/* Main Content Area with 3D Model as Center */}
      <div className="flex-1 flex flex-col-reverse lg:flex-row gap-6 px-4 md:px-8 mb-8">
        {/* Left Sidebar - Feature Cards */}
        <aside className="lg:w-64 space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center lg:text-left mb-4 hidden lg:block"
          >
            <h1 className="text-xl font-bold mb-1">Hi! I'm ARIA</h1>
            <p className="text-xs text-white/60">Your AI Counselor</p>
          </motion.div>

          {/* Compact Feature Cards */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-left"
          >
            <Brain className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-xs font-medium">Personal EI coaching</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-left"
          >
            <Target className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-xs font-medium">Track your progress</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-left"
          >
            <Plus className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-xs font-medium">Generate quests</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-left"
          >
            <Heart className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-xs font-medium">AI tool guidance</span>
          </motion.button>

          {/* Voice Banner */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-center"
          >
            <p className="text-xs text-cyan-400">Voice enabled! 🎤</p>
          </motion.div>
        </aside>

        {/* Center - 3D Model (MAIN ATTRACTION) */}
        <section className="flex-1 w-full">
          <div className="lg:hidden text-center mb-4">
            <h1 className="text-xl font-bold mb-1">Hi! I'm ARIA</h1>
            <p className="text-xs text-white/60">Your AI Counselor</p>
          </div>

          <div className="relative h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden border-2 border-cyan-400/20 shadow-2xl shadow-cyan-400/10 bg-gradient-to-b from-cyan-900/10 to-transparent">
            
            {/* Tutorial Button */}
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-cyan-400 border border-cyan-400/30 h-8 px-3 text-xs gap-1.5 shadow-lg"
                onClick={startTour}
              >
                <div className="w-3.5 h-3.5 rounded-full border border-cyan-400 flex items-center justify-center text-[10px] font-bold">?</div>
                Need Tutorial?
              </Button>
            </div>

            <div className="absolute inset-0">
              {!isTourActive && <Enhanced3DNurseScene emotion={emotion} isTalking={isTalking} />}
            </div>

            {/* Emotion Indicator */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : emotion === 'talking' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-green-400'}`}></div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">
                {isLoading ? "Analyzing" : emotion === 'talking' ? "Speaking" : "Ready"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Action Buttons */}
      <section className="relative z-10 px-4 pb-3 md:px-12">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setInput("How am I doing?")}
            className="test-btn text-xs flex items-center gap-2 group"
          >
            <Target className="w-4 h-4 text-cyan-400" />
            How am I doing?
          </button>
          <button
            onClick={() => setInput("I'm feeling stressed")}
            className="test-btn text-xs flex items-center gap-2 group"
          >
            <Heart className="w-4 h-4 text-cyan-400" />
            I'm feeling stressed
          </button>
          <button
            onClick={() => setInput("Create a quest for me")}
            className="test-btn text-xs flex items-center gap-2 group"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            Create a quest for me
          </button>
          <button
            onClick={() => setInput("Suggest an exercise")}
            className="test-btn text-xs flex items-center gap-2 group"
          >
            <Brain className="w-4 h-4 text-cyan-400" />
            Suggest an exercise
          </button>
        </div>
      </section>

      {/* Chat Container - Enhanced Visibility */}
      <section className="w-full bg-black/60 border-t-2 border-cyan-400/30 backdrop-blur-xl px-4 py-4 md:px-8 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {/* Chat Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Chat with ARIA
            </h2>
            <div className="text-xs text-white/40">AI Counselor</div>
          </div>
          {/* Messages Loop */}
          <div className="min-h-[200px] space-y-4 mb-6">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center opacity-40 px-4 py-8"
                >
                  <Sparkles className="w-8 h-8 mb-4 text-cyan-400" />
                  <p className="text-sm font-medium leading-relaxed">
                    How are you feeling today? Share your thoughts or ask for EI guidance to begin our session.
                  </p>
                </motion.div>
              ) : (
                messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`message ${m.role === "user" ? "user-message" : "ai-message shadow-lg border-white/10"} max-w-[85%] relative group`}>
                      <p className="text-sm leading-relaxed">{m.content}</p>

                      {m.suggestedTool && (
                        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 overflow-hidden">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                              <Target className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">{m.suggestedTool.name}</p>
                              <p className="text-[10px] text-white/50">{m.suggestedTool.description}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => router.push(m.suggestedTool!.route)}
                            className="shimmer-btn text-[10px] font-bold h-8 px-4"
                          >
                            OPEN
                          </Button>
                        </div>
                      )}

                      {m.generatedQuest && (
                        <div className="mt-4 p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Quest Unlocked</p>
                            <p className="text-[10px] text-white/80">{m.generatedQuest.title} (+{m.generatedQuest.xp} XP)</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-[10px] h-8 text-emerald-400 hover:bg-emerald-400/10">VIEW</Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            {isLoading && (
              <div className="flex justify-start">
                <div className="typing bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
            <div className="relative flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  id="user-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Talk to the nurse..."
                  className="chat-input w-full min-h-[60px] max-h-32 rounded-2xl border-white/10 bg-white/5 px-6 py-4 pr-14 text-white placeholder-white/20 focus:outline-none focus:ring-0 resize-none transition-all scrollbar-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                />
                {speechSupported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-white/30 hover:text-cyan-400 hover:bg-white/5'}`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
              </div>
              <Button
                id="send-btn"
                onClick={() => handleSubmit()}
                disabled={isLoading || !input.trim()}
                className="shimmer-btn h-full aspect-square rounded-2xl flex items-center justify-center group disabled:opacity-50 disabled:grayscale transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
              </Button>
            </div>
          </div>

          {/* Quick Tags / Suggestions */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Stress Level", emotion: "happy" },
              { label: "Medication", emotion: "thinking" },
              { label: "Check-in", emotion: "hi" }
            ].map((tag) => (
              <button
                key={tag.label}
                onClick={() => {
                  setInput(`I'd like to check my ${tag.label.toLowerCase()}.`)
                  setEmotion(tag.emotion)
                }}
                className="test-btn text-[10px] flex items-center gap-2 group"
              >
                <span className="w-1 h-1 rounded-full bg-cyan-400 group-hover:scale-150 transition-transform"></span>
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #22d3ee, #9333ea);
            border-radius: 10px;
        }
        .scrollbar-none::-webkit-scrollbar {
            display: none;
        }
        .shimmer-btn {
            position: relative;
            overflow: hidden;
        }
        .shimmer-btn::after {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                60deg,
                transparent,
                rgba(255, 255, 255, 0.1),
                transparent
            );
            transform: rotate(45deg);
            animation: shimmer-swipe 3s infinite;
        }
        @keyframes shimmer-swipe {
            0% { transform: translateX(-150%) rotate(45deg); }
            100% { transform: translateX(150%) rotate(45deg); }
        }
      `}</style>
    </div>
  )
}
