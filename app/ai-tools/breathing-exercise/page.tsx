"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/stores/app-store"
import {
  ArrowLeft,
  Wind,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Volume2,
  VolumeX,
  Bird,
  Droplets,
  Flame,
  Waves,
} from "lucide-react"

type Step = "setup" | "breathing" | "reflection" | "complete"
type BreathPhase = "inhale" | "hold" | "exhale" | "rest"
type AmbientSound = "none" | "birds" | "rain" | "fire" | "waves"

interface ExerciseData {
  duration: number // in minutes
  sound: AmbientSound
  reflection: string
  cyclesCompleted: number
}

const soundOptions = [
  { id: "none" as const, label: "None", icon: VolumeX },
  { id: "birds" as const, label: "Birds", icon: Bird },
  { id: "rain" as const, label: "Rain", icon: Droplets },
  { id: "fire" as const, label: "Fire", icon: Flame },
  { id: "waves" as const, label: "Waves", icon: Waves },
]

const durationOptions = [
  { value: 1, label: "1 min" },
  { value: 2, label: "2 min" },
  { value: 3, label: "3 min" },
  { value: 5, label: "5 min" },
]

// Box breathing: 4-4-4-4 pattern
const BREATH_DURATION = {
  inhale: 4,
  hold: 4,
  exhale: 4,
  rest: 4,
}

function BreathingExerciseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTrainingSource = searchParams.get("source") === "training"
  const returnUrl = searchParams.get("returnUrl")
  
  const { nurse, updateNurse } = useAppStore()
  const [step, setStep] = useState<Step>("setup")
  const [data, setData] = useState<ExerciseData>({
    duration: 2,
    sound: "none",
    reflection: "",
    cyclesCompleted: 0,
  })

  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState<BreathPhase>("inhale")
  const [phaseTime, setPhaseTime] = useState(BREATH_DURATION.inhale)
  const [totalTime, setTotalTime] = useState(0)
  const [cycles, setCycles] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const targetTime = data.duration * 60 // Convert to seconds

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Handle timer
  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setPhaseTime((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setPhase((currentPhase) => {
            const phases: BreathPhase[] = ["inhale", "hold", "exhale", "rest"]
            const currentIndex = phases.indexOf(currentPhase)
            const nextPhase = phases[(currentIndex + 1) % 4]

            if (currentPhase === "rest") {
              setCycles((c) => c + 1)
            }

            return nextPhase
          })
          return BREATH_DURATION[phase === "rest" ? "inhale" : phase === "inhale" ? "hold" : phase === "hold" ? "exhale" : "rest"]
        }
        return prev - 1
      })

      setTotalTime((prev) => {
        const newTime = prev + 1
        if (newTime >= targetTime) {
          setIsRunning(false)
          setData((d) => ({ ...d, cyclesCompleted: cycles }))
          setStep("reflection")
          return prev
        }
        return newTime
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, phase, targetTime, cycles])

  const startExercise = () => {
    setStep("breathing")
    setIsRunning(true)
    setPhase("inhale")
    setPhaseTime(BREATH_DURATION.inhale)
    setTotalTime(0)
    setCycles(0)

    // Play ambient sound if selected
    if (data.sound !== "none") {
      // Using free ambient sound URLs (would need actual audio files in production)
      const soundUrls: Record<string, string> = {
        birds: "https://assets.mixkit.co/active_storage/sfx/2433/2433-preview.mp3",
        rain: "https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3",
        fire: "https://assets.mixkit.co/active_storage/sfx/2519/2519-preview.mp3",
        waves: "https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3",
      }

      try {
        audioRef.current = new Audio(soundUrls[data.sound])
        audioRef.current.loop = true
        audioRef.current.volume = 0.3
        audioRef.current.play().catch(() => {
          // Audio autoplay might be blocked
        })
      } catch {
        // Audio not available
      }
    }
  }

  const togglePause = () => {
    setIsRunning((prev) => !prev)
    if (audioRef.current) {
      if (isRunning) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(() => {})
      }
    }
  }

  const handleComplete = () => {
    // Award XP by updating nurse profile
    if (nurse) {
      updateNurse({ xp: (nurse.xp || 0) + 20 })
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    // If from training, redirect back with completion status
    if (isTrainingSource && returnUrl) {
      router.push(returnUrl)
      return
    }
    
    setStep("complete")
  }

  const resetTool = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setData({
      duration: 2,
      sound: "none",
      reflection: "",
      cyclesCompleted: 0,
    })
    setStep("setup")
    setIsRunning(false)
    setPhase("inhale")
    setPhaseTime(BREATH_DURATION.inhale)
    setTotalTime(0)
    setCycles(0)
  }

  const phaseInstructions: Record<BreathPhase, string> = {
    inhale: "Breathe In",
    hold: "Hold",
    exhale: "Breathe Out",
    rest: "Rest",
  }

  const progressPercent = (totalTime / targetTime) * 100

  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/ai-tools">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Tools
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Breathing Exercise</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Setup Screen */}
          {step === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <Card className="bg-white border-green-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wind className="w-5 h-5 text-green-600" />
                    Box Breathing Exercise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Box breathing is a simple technique: breathe in for 4 seconds, hold for 4, breathe out for 4, rest for 4. 
                    This helps calm your nervous system and restore focus.
                  </p>

                  {/* Duration Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Duration
                    </label>
                    <div className="flex gap-2">
                      {durationOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setData((prev) => ({ ...prev, duration: option.value }))}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            data.duration === option.value
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ambient Sound Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Ambient Sound (Optional)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {soundOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.id}
                            onClick={() => setData((prev) => ({ ...prev, sound: option.id }))}
                            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg text-xs font-medium transition-all ${
                              data.sound === option.id
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={startExercise}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Exercise
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Breathing Screen */}
          {step === "breathing" && (
            <motion.div
              key="breathing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Progress Bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Breathing Circle */}
              <Card className="bg-white border-green-100">
                <CardContent className="p-8 flex flex-col items-center">
                  {/* Animated Circle */}
                  <motion.div
                    className="relative w-48 h-48 mb-8"
                    animate={{
                      scale: phase === "inhale" ? 1.2 : phase === "exhale" ? 0.8 : 1,
                    }}
                    transition={{ duration: BREATH_DURATION[phase], ease: "easeInOut" }}
                  >
                    <div className="absolute inset-0 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600">{phaseTime}</div>
                        <div className="text-lg font-medium text-green-700 mt-1">
                          {phaseInstructions[phase]}
                        </div>
                      </div>
                    </div>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="90"
                        fill="none"
                        stroke="#dcfce7"
                        strokeWidth="8"
                      />
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="90"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={565}
                        initial={{ strokeDashoffset: 565 }}
                        animate={{
                          strokeDashoffset: 565 - (565 * (BREATH_DURATION[phase] - phaseTime)) / BREATH_DURATION[phase],
                        }}
                      />
                    </svg>
                  </motion.div>

                  {/* Stats */}
                  <div className="flex gap-8 text-center mb-6">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{cycles}</div>
                      <div className="text-sm text-gray-500">Cycles</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.floor((targetTime - totalTime) / 60)}:{String((targetTime - totalTime) % 60).padStart(2, "0")}
                      </div>
                      <div className="text-sm text-gray-500">Remaining</div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={togglePause}
                      className="w-32 bg-transparent"
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setData((d) => ({ ...d, cyclesCompleted: cycles }))
                        if (audioRef.current) audioRef.current.pause()
                        setIsRunning(false)
                        setStep("reflection")
                      }}
                      className="w-32"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finish
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sound indicator */}
              {data.sound !== "none" && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Volume2 className="w-4 h-4" />
                  <span className="capitalize">{data.sound} sounds playing</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Reflection Screen */}
          {step === "reflection" && (
            <motion.div
              key="reflection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white border-green-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Exercise Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-100 text-center">
                    <div className="text-3xl font-bold text-green-600">{data.cyclesCompleted || cycles}</div>
                    <div className="text-sm text-green-700">breathing cycles completed</div>
                  </div>

                  <p className="text-sm text-gray-600">
                    Take a moment to notice how you feel. Any changes in your body or mind?
                  </p>

                  <Textarea
                    placeholder="Optional: Write a brief reflection..."
                    value={data.reflection}
                    onChange={(e) => setData((prev) => ({ ...prev, reflection: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />

                  <Button
                    onClick={handleComplete}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Complete
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Complete Screen */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-white border-teal-100">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Wind className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Well Done!</h2>
                  <p className="text-gray-600 mb-6">
                    You've earned +20 XP for taking time to breathe and ground yourself.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" onClick={resetTool}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Breathe Again
                    </Button>
                    <Link href="/ai-tools">
                      <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        Back to Tools
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function BreathingExercisePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center"><div className="animate-pulse text-teal-600">Loading...</div></div>}>
      <BreathingExerciseContent />
    </Suspense>
  )
}
