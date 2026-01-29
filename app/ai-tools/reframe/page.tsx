"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/stores/app-store"
import {
  ArrowLeft,
  RefreshCw,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  Heart,
  Sparkles,
  MessageCircle,
} from "lucide-react"

type Step = "input" | "reframe" | "complete"

interface ReframeData {
  thought: string
  detectedEmotion: string
  validation: string
  perspective: string
  reflectionPrompt: string
  createQuest: boolean
}

const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
  frustrated: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  anxious: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  sad: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  overwhelmed: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  angry: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  disappointed: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  worried: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  stressed: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  default: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
}

function ReframeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTrainingSource = searchParams.get("source") === "training"
  const returnUrl = searchParams.get("returnUrl")
  
  const { addTrainingModules, nurse, updateNurse } = useAppStore()
  const [step, setStep] = useState<Step>("input")
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<ReframeData>({
    thought: "",
    detectedEmotion: "",
    validation: "",
    perspective: "",
    reflectionPrompt: "",
    createQuest: false,
  })

  const generateReframe = async () => {
    if (!data.thought.trim()) return
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-tools/reframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thought: data.thought,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setData((prev) => ({
          ...prev,
          detectedEmotion: result.emotion,
          validation: result.validation,
          perspective: result.perspective,
          reflectionPrompt: result.reflectionPrompt,
        }))
        setStep("reframe")
      }
    } catch (error) {
      // Fallback
      setData((prev) => ({
        ...prev,
        detectedEmotion: "stressed",
        validation: "It makes complete sense that you're feeling this way. These feelings are valid responses to a challenging situation.",
        perspective: "Consider that this moment, as difficult as it is, is temporary. You've navigated hard moments before, and you have more resources than you might realize right now.",
        reflectionPrompt: "In the next hour, notice one small thing that goes well, even if it's minor.",
      }))
      setStep("reframe")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    if (nurse) {
      updateNurse({ xp: (nurse.xp || 0) + 15 })
    }

    if (data.createQuest) {
      const quest = {
        id: `reframe-quest-${Date.now()}`,
        title: "Reflection Nudge",
        description: `For the next interaction today, notice one moment where you respond differently than before. At the end of the day, reflect briefly on what you noticed.`,
        realm: "Self-Awareness" as const,
        xp: 15,
        difficulty: "beginner" as const,
        duration: "1 day",
        completed: false,
        type: "daily" as const,
        week: 0,
        skillTags: [{ skill: "Self-Awareness", points: 1 }],
      }
      addTrainingModules([quest])
    }

    // If from training, redirect back with completion status
    if (isTrainingSource && returnUrl) {
      router.push(returnUrl)
      return
    }

    setStep("complete")
  }

  const resetTool = () => {
    setData({
      thought: "",
      detectedEmotion: "",
      validation: "",
      perspective: "",
      reflectionPrompt: "",
      createQuest: false,
    })
    setStep("input")
  }

  const emotionStyle = emotionColors[data.detectedEmotion.toLowerCase()] || emotionColors.default

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
              <RefreshCw className="w-5 h-5 text-teal-600" />
              <span className="font-medium text-gray-900">Reframe</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white border-teal-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="w-5 h-5 text-teal-600" />
                    What's on your mind?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Express a raw emotional thought or feeling. This is a safe space for rapid emotional first aid.
                  </p>
                  <Textarea
                    placeholder="e.g., 'I feel like I can never do anything right' or 'Everything is falling apart today...'"
                    value={data.thought}
                    onChange={(e) => setData((prev) => ({ ...prev, thought: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={generateReframe}
                      disabled={!data.thought.trim() || isLoading}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      {isLoading ? (
                        "Processing..."
                      ) : (
                        <>
                          Get Support
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Reframe Response */}
          {step === "reframe" && (
            <motion.div
              key="reframe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Detected Emotion */}
              <Card className={`bg-white ${emotionStyle.border}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full ${emotionStyle.bg}`}>
                      <span className={`text-sm font-medium ${emotionStyle.text} capitalize`}>
                        {data.detectedEmotion}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">Detected emotion</span>
                  </div>
                </CardContent>
              </Card>

              {/* Validation */}
              <Card className="bg-white border-pink-100">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">Validation</h4>
                      <p className="text-sm text-gray-600">{data.validation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* New Perspective */}
              <Card className="bg-white border-teal-100">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">A Different Lens</h4>
                      <p className="text-sm text-gray-600">{data.perspective}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reflection Prompt */}
              <Card className="bg-white border-amber-100">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">Micro-Reflection</h4>
                      <p className="text-sm text-gray-600">{data.reflectionPrompt}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Optional Quest Toggle */}
              <Card className="bg-white border-gray-100">
                <CardContent className="p-4">
                  <div
                    onClick={() => setData((prev) => ({ ...prev, createQuest: !prev.createQuest }))}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      data.createQuest
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          data.createQuest ? "border-teal-500 bg-teal-500" : "border-gray-300"
                        }`}
                      >
                        {data.createQuest && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Create Reflection Nudge (Optional)</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          A gentle quest to notice different responses today. +15 XP
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("input")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
                <Button
                  onClick={handleComplete}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Done
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Complete */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-white border-teal-100">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-teal-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Take Care</h2>
                  <p className="text-gray-600 mb-6">
                    You've earned +15 XP. Remember, it's okay to need a moment to reset.
                    {data.createQuest && " A gentle reflection nudge has been added."}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" onClick={resetTool}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reframe Another
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

export default function ReframePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center"><div className="animate-pulse text-teal-600">Loading...</div></div>}>
      <ReframeContent />
    </Suspense>
  )
}
