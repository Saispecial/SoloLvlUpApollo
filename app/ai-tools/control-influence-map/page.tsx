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
  Target,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  Circle,
  Zap,
  Shield,
  HandHeart,
  Footprints,
} from "lucide-react"

type Step = "input" | "control" | "influence" | "accept" | "action" | "summary" | "complete"

interface MapData {
  concern: string
  controlItems: string[]
  influenceItems: string[]
  acceptItems: string[]
  action: string
  createQuest: boolean
}

function ControlInfluenceMapContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTrainingSource = searchParams.get("source") === "training"
  const returnUrl = searchParams.get("returnUrl")
  
  const { addTrainingModules, nurse, updateNurse } = useAppStore()
  const [step, setStep] = useState<Step>("input")
  const [data, setData] = useState<MapData>({
    concern: "",
    controlItems: [""],
    influenceItems: [""],
    acceptItems: [""],
    action: "",
    createQuest: false,
  })

  const steps: Step[] = ["input", "control", "influence", "accept", "action", "summary", "complete"]
  const currentStepIndex = steps.indexOf(step)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const addItem = (field: "controlItems" | "influenceItems" | "acceptItems") => {
    setData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }))
  }

  const updateItem = (
    field: "controlItems" | "influenceItems" | "acceptItems",
    index: number,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  const removeItem = (field: "controlItems" | "influenceItems" | "acceptItems", index: number) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const handleComplete = () => {
    if (nurse) {
      updateNurse({ xp: (nurse.xp || 0) + 30 })
    }

    if (data.createQuest && data.action.trim()) {
      const quest = {
        id: `action-quest-${Date.now()}`,
        title: "Action Focus Quest",
        description: `Within the next 24 hours, take your identified action: "${data.action}". After completing it, reflect: Did this reduce mental load? Did it restore a sense of control?`,
        realm: "Self-Regulation" as const,
        xp: 35,
        difficulty: "intermediate" as const,
        duration: "1 day",
        completed: false,
        type: "daily" as const,
        week: 0,
        skillTags: [
          { skill: "Self-Regulation", points: 2 },
          { skill: "Self-Awareness", points: 1 },
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
      controlItems: [""],
      influenceItems: [""],
      acceptItems: [""],
      action: "",
      createQuest: false,
    })
    setStep("input")
  }

  const filteredItems = (items: string[]) => items.filter((item) => item.trim())

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
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Control & Influence Map</span>
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
              <Card className="bg-white border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Circle className="w-5 h-5 text-blue-600" />
                    What's weighing on you?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Describe the situation or stressor that's causing overwhelm. Be specific about what's bothering you.
                  </p>
                  <Textarea
                    placeholder="e.g., 'The unit is constantly understaffed and I feel like I can never catch up with patient care...'"
                    value={data.concern}
                    onChange={(e) => setData((prev) => ({ ...prev, concern: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setStep("control")}
                      disabled={!data.concern.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: What You Can Control */}
          {step === "control" && (
            <motion.div
              key="control"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-green-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                    What CAN you control?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-gray-700">
                    "{data.concern}"
                  </div>
                  <p className="text-sm text-gray-600">
                    List the aspects of this situation that are within your direct control.
                  </p>
                  <div className="space-y-2">
                    {data.controlItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateItem("controlItems", index, e.target.value)}
                          placeholder="e.g., My own time management, How I communicate..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {data.controlItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem("controlItems", index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addItem("controlItems")}
                      className="text-green-600"
                    >
                      + Add another
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("input")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("influence")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: What You Can Influence */}
          {step === "influence" && (
            <motion.div
              key="influence"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-amber-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-amber-600" />
                    What can you INFLUENCE?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    List things you can't directly control, but might be able to influence through your actions or communication.
                  </p>
                  <div className="space-y-2">
                    {data.influenceItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateItem("influenceItems", index, e.target.value)}
                          placeholder="e.g., Team morale, Scheduling decisions..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {data.influenceItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem("influenceItems", index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addItem("influenceItems")}
                      className="text-amber-600"
                    >
                      + Add another
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("control")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("accept")}
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

          {/* Step 4: What Must Be Accepted */}
          {step === "accept" && (
            <motion.div
              key="accept"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-purple-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HandHeart className="w-5 h-5 text-purple-600" />
                    What must you ACCEPT?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    List the aspects that are truly outside your control. Acknowledging these can reduce mental burden.
                  </p>
                  <div className="space-y-2">
                    {data.acceptItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateItem("acceptItems", index, e.target.value)}
                          placeholder="e.g., Hospital budget decisions, Patient volume..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {data.acceptItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem("acceptItems", index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addItem("acceptItems")}
                      className="text-purple-600"
                    >
                      + Add another
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("influence")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
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

          {/* Step 5: One Small Action */}
          {step === "action" && (
            <motion.div
              key="action"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-teal-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Footprints className="w-5 h-5 text-teal-600" />
                    One Small, Specific Action
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Based on what you CAN control or influence, what is ONE small, concrete action you can take within the next 24 hours?
                  </p>
                  <Textarea
                    placeholder="e.g., 'Speak with the shift lead about workload allocation tomorrow morning.'"
                    value={data.action}
                    onChange={(e) => setData((prev) => ({ ...prev, action: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("accept")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("summary")}
                      disabled={!data.action.trim()}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      View Summary
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 6: Summary */}
          {step === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                    Your Agency Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Control Section */}
                  {filteredItems(data.controlItems).length > 0 && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <h4 className="font-medium text-green-800 text-sm mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        You CAN Control
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {filteredItems(data.controlItems).map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Influence Section */}
                  {filteredItems(data.influenceItems).length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <h4 className="font-medium text-amber-800 text-sm mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        You CAN Influence
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {filteredItems(data.influenceItems).map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Accept Section */}
                  {filteredItems(data.acceptItems).length > 0 && (
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <h4 className="font-medium text-purple-800 text-sm mb-2 flex items-center gap-2">
                        <HandHeart className="w-4 h-4" />
                        To Accept
                      </h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {filteredItems(data.acceptItems).map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action */}
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
                    <h4 className="font-medium text-teal-800 text-sm mb-2 flex items-center gap-2">
                      <Footprints className="w-4 h-4" />
                      Your Action
                    </h4>
                    <p className="text-sm text-teal-700">{data.action}</p>
                  </div>

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
                        <h4 className="font-medium text-gray-900">Create Action Focus Quest</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Turn this action into a trackable quest. Earn +35 XP when completed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("action")}>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Agency Restored!</h2>
                  <p className="text-gray-600 mb-6">
                    You've earned +30 XP for mapping your control and influence.
                    {data.createQuest && " An action quest has been created to help you follow through."}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" onClick={resetTool}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Map Another Concern
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

export default function ControlInfluenceMapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center"><div className="animate-pulse text-teal-600">Loading...</div></div>}>
      <ControlInfluenceMapContent />
    </Suspense>
  )
}
