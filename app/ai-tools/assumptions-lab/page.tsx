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
  Lightbulb,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  Sparkles,
  Brain,
  Target,
  Plus,
} from "lucide-react"

type Step = "input" | "counter-frame" | "reflection" | "quest" | "complete"

interface AssumptionData {
  assumption: string
  counterFrame: string
  reflection: string
  createQuest: boolean
}

function AssumptionsLabContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTrainingSource = searchParams.get("source") === "training"
  const returnUrl = searchParams.get("returnUrl")
  
  const { addTrainingModules, nurse, updateNurse } = useAppStore()
  const [step, setStep] = useState<Step>("input")
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<AssumptionData>({
    assumption: "",
    counterFrame: "",
    reflection: "",
    createQuest: false,
  })

  const steps: Step[] = ["input", "counter-frame", "reflection", "quest", "complete"]
  const currentStepIndex = steps.indexOf(step)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const generateCounterFrame = async () => {
    if (!data.assumption.trim()) return
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-tools/assumptions-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "counter-frame",
          assumption: data.assumption,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setData((prev) => ({ ...prev, counterFrame: result.counterFrame }))
        setStep("counter-frame")
      }
    } catch (error) {
      // Fallback counter-frame
      const fallbackFrames = [
        `What if the opposite were true? Consider: "${data.assumption}" might actually be protecting you from growth.`,
        `This belief may have served you once, but ask yourself: Is it still serving you now?`,
        `Try this perspective: What would someone who disagrees with this assumption say? What evidence might they have?`,
      ]
      setData((prev) => ({
        ...prev,
        counterFrame: fallbackFrames[Math.floor(Math.random() * fallbackFrames.length)],
      }))
      setStep("counter-frame")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    // Award XP
    if (nurse) {
      updateNurse({ xp: (nurse.xp || 0) + 25 })
    }

    // Create quest if selected
    if (data.createQuest) {
      const quest = {
        id: `assumption-quest-${Date.now()}`,
        title: "Cognitive Practice Quest",
        description: `Practice the reframe: Challenge your assumption "${data.assumption.slice(0, 50)}..." by noticing when it appears today and consciously applying the counter-frame.`,
        realm: "Self-Awareness" as const,
        xp: 30,
        difficulty: "intermediate" as const,
        duration: "1 day",
        completed: false,
        type: "daily" as const,
        week: 0,
        skillTags: [
          { skill: "Self-Awareness", points: 2 },
          { skill: "Self-Regulation", points: 1 },
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
      assumption: "",
      counterFrame: "",
      reflection: "",
      createQuest: false,
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
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-gray-900">Assumptions Lab</span>
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
          {/* Step 1: Input Assumption */}
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-amber-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-amber-600" />
                    What assumption is weighing on you?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Share a belief or assumption that might be limiting you. This could be about yourself, 
                    your work, your colleagues, or your situation.
                  </p>
                  <Textarea
                    placeholder="e.g., 'I'm not experienced enough to speak up in team meetings' or 'If I ask for help, people will think I'm incompetent'"
                    value={data.assumption}
                    onChange={(e) => setData((prev) => ({ ...prev, assumption: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={generateCounterFrame}
                      disabled={!data.assumption.trim() || isLoading}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isLoading ? (
                        "Analyzing..."
                      ) : (
                        <>
                          Challenge This
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Counter-Frame */}
          {step === "counter-frame" && (
            <motion.div
              key="counter-frame"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-amber-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    Consider This Perspective
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-sm text-gray-500 mb-2">Your assumption:</p>
                    <p className="text-gray-700 italic">"{data.assumption}"</p>
                  </div>

                  <div className="p-4 rounded-lg bg-teal-50 border border-teal-100">
                    <p className="text-sm text-teal-600 font-medium mb-2">Counter-frame:</p>
                    <p className="text-gray-700">{data.counterFrame}</p>
                  </div>

                  <p className="text-sm text-gray-600">
                    Take a moment to sit with this alternative perspective. Does it offer any new insights?
                  </p>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("input")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Edit Assumption
                    </Button>
                    <Button
                      onClick={() => setStep("reflection")}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Reflect on This
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Reflection */}
          {step === "reflection" && (
            <motion.div
              key="reflection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-amber-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-amber-600" />
                    Reflection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    What insights emerged from considering the counter-frame? How might this change 
                    your approach?
                  </p>
                  <Textarea
                    placeholder="Write your reflection here..."
                    value={data.reflection}
                    onChange={(e) => setData((prev) => ({ ...prev, reflection: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("counter-frame")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("quest")}
                      disabled={!data.reflection.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Quest Option */}
          {step === "quest" && (
            <motion.div
              key="quest"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-amber-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-amber-600" />
                    Create a Practice Quest?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Turn this insight into action. Create a quest to practice this reframe throughout your day.
                  </p>

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
                        <h4 className="font-medium text-gray-900">Cognitive Practice Quest</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Practice the reframe by noticing when the assumption appears and consciously 
                          applying the counter-frame. Earn +30 XP and boost Self-Awareness.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("reflection")}>
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

          {/* Step 5: Complete */}
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
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Belief Challenged!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    You've earned +25 XP for completing this cognitive exercise.
                    {data.createQuest && " A new quest has been added to help you practice."}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" onClick={resetTool}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Challenge Another
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

export default function AssumptionsLabPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center"><div className="animate-pulse text-teal-600">Loading...</div></div>}>
      <AssumptionsLabContent />
    </Suspense>
  )
}
