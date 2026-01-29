"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/stores/app-store"
import {
  ArrowLeft,
  Users,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  MessageCircle,
  Lightbulb,
  Heart,
  Footprints,
} from "lucide-react"

type Step = "input" | "reappraisal" | "action" | "complete"

interface CompanionData {
  concern: string
  reappraisal: string
  suggestedAction: string
  reflection: string
  createQuest: boolean
  emotionBefore: number
}

function ChangeCompanionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTrainingSource = searchParams.get("source") === "training"
  const returnUrl = searchParams.get("returnUrl")
  
  const { addTrainingModules, nurse, updateNurse } = useAppStore()
  const [step, setStep] = useState<Step>("input")
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<CompanionData>({
    concern: "",
    reappraisal: "",
    suggestedAction: "",
    reflection: "",
    createQuest: false,
    emotionBefore: 5,
  })

  const steps: Step[] = ["input", "reappraisal", "action", "complete"]
  const currentStepIndex = steps.indexOf(step)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const generateReappraisal = async () => {
    if (!data.concern.trim()) return
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-tools/change-companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reappraise",
          concern: data.concern,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setData((prev) => ({
          ...prev,
          reappraisal: result.reappraisal,
          suggestedAction: result.suggestedAction,
        }))
        setStep("reappraisal")
      }
    } catch (error) {
      // Fallback responses
      setData((prev) => ({
        ...prev,
        reappraisal:
          "It sounds like you're navigating a challenging interpersonal dynamic. Consider that the other person may be operating under their own pressures and constraints that you might not be fully aware of. Their behavior might be less about you personally and more about their own situation.",
        suggestedAction:
          "Before your next interaction, take a moment to consider one positive intention the other person might have, even if their delivery was imperfect.",
      }))
      setStep("reappraisal")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    if (nurse) {
      updateNurse({ xp: (nurse.xp || 0) + 25 })
    }

    if (data.createQuest) {
      const quest = {
        id: `interpersonal-quest-${Date.now()}`,
        title: "Interpersonal Reflection Quest",
        description: `In your next interaction related to this situation, practice the reappraisal: "${data.suggestedAction.slice(0, 80)}..." Afterward, reflect on how it affected the interaction.`,
        realm: "Relationship Management" as const,
        xp: 30,
        difficulty: "intermediate" as const,
        duration: "1 day",
        completed: false,
        type: "daily" as const,
        week: 0,
        skillTags: [
          { skill: "Relationship Management", points: 2 },
          { skill: "Social Awareness", points: 1 },
        ],
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
      concern: "",
      reappraisal: "",
      suggestedAction: "",
      reflection: "",
      createQuest: false,
      emotionBefore: 5,
    })
    setStep("input")
  }

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
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">Change Companion</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>{currentStepIndex + 1} of {steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Input Concern */}
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-purple-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    What's the interpersonal challenge?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Describe a situation with a colleague, supervisor, or team member that's causing you stress. 
                    Be specific but brief (1-2 sentences).
                  </p>
                  <Textarea
                    placeholder="e.g., 'My charge nurse criticized my charting in front of others and I felt embarrassed and angry...'"
                    value={data.concern}
                    onChange={(e) => setData((prev) => ({ ...prev, concern: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />

                  {/* Emotional Intensity */}
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">
                      How intense are your emotions about this? (1 = mild, 10 = very intense)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">1</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={data.emotionBefore}
                        onChange={(e) =>
                          setData((prev) => ({ ...prev, emotionBefore: parseInt(e.target.value) }))
                        }
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-400">10</span>
                      <span className="ml-2 text-sm font-medium text-purple-600 w-6">
                        {data.emotionBefore}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={generateReappraisal}
                      disabled={!data.concern.trim() || isLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isLoading ? (
                        "Processing..."
                      ) : (
                        <>
                          Get Perspective
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Reappraisal */}
          {step === "reappraisal" && (
            <motion.div
              key="reappraisal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-purple-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    A Different Perspective
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 text-sm text-gray-700">
                    "{data.concern}"
                  </div>

                  {/* Reappraisal */}
                  <div className="p-4 rounded-lg bg-teal-50 border border-teal-100">
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-teal-800 text-sm mb-2">Cognitive Reappraisal</h4>
                        <p className="text-sm text-teal-700">{data.reappraisal}</p>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Action */}
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="flex items-start gap-3">
                      <Footprints className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800 text-sm mb-2">Suggested Next Step</h4>
                        <p className="text-sm text-amber-700">{data.suggestedAction}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("input")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Edit Concern
                    </Button>
                    <Button
                      onClick={() => setStep("action")}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Reflection & Quest */}
          {step === "action" && (
            <motion.div
              key="action"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-purple-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="w-5 h-5 text-purple-600" />
                    Your Reflection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    How does this new perspective sit with you? What might you do differently?
                  </p>
                  <Textarea
                    placeholder="Write your thoughts here..."
                    value={data.reflection}
                    onChange={(e) => setData((prev) => ({ ...prev, reflection: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />

                  {/* Quest Toggle */}
                  <div
                    onClick={() => setData((prev) => ({ ...prev, createQuest: !prev.createQuest }))}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
                        <h4 className="font-medium text-gray-900">Create Interpersonal Quest</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Practice this reappraisal in your next interaction. Track emotional intensity before & after. Earn +30 XP.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("reappraisal")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleComplete}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Complete
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                    <CheckCircle className="w-8 h-8 text-teal-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Perspective Gained!</h2>
                  <p className="text-gray-600 mb-6">
                    You've earned +25 XP for working through this interpersonal challenge.
                    {data.createQuest && " A quest has been created to practice in your next interaction."}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" onClick={resetTool}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Process Another
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

export default function ChangeCompanionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center"><div className="animate-pulse text-teal-600">Loading...</div></div>}>
      <ChangeCompanionContent />
    </Suspense>
  )
}
