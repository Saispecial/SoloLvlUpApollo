"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  ChevronLeft, 
  Brain, 
  Heart, 
  Sparkles, 
  Target,
  Loader2,
  CheckCircle2,
  Lightbulb
} from "lucide-react"
import Link from "next/link"
import { useAppStore } from "@/stores/app-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

const moodOptions = [
  { value: "1", label: "Very Low", color: "bg-red-500" },
  { value: "2", label: "Low", color: "bg-orange-500" },
  { value: "3", label: "Somewhat Low", color: "bg-yellow-500" },
  { value: "4", label: "Neutral", color: "bg-gray-400" },
  { value: "5", label: "Okay", color: "bg-blue-400" },
  { value: "6", label: "Good", color: "bg-blue-500" },
  { value: "7", label: "Pretty Good", color: "bg-teal-400" },
  { value: "8", label: "Great", color: "bg-teal-500" },
  { value: "9", label: "Very Good", color: "bg-green-500" },
  { value: "10", label: "Excellent", color: "bg-green-600" },
]

const emotionOptions = [
  "Calm", "Happy", "Grateful", "Hopeful", "Proud",
  "Anxious", "Stressed", "Frustrated", "Sad", "Tired",
  "Overwhelmed", "Confused", "Motivated", "Content", "Energized"
]

export default function ReflectionPage() {
  const { 
    setReflection,
    addDiaryEntry,
    getReflections,
    trainingModules,
    addTrainingModules
  } = useAppStore()

  const [step, setStep] = useState(1)
  const [mood, setMood] = useState("")
  const [emotions, setEmotions] = useState<string[]>([])
  const [thoughts, setThoughts] = useState("")
  const [challenge, setChallenge] = useState("")
  const [gratitude, setGratitude] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingQuests, setIsGeneratingQuests] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [generatedQuests, setGeneratedQuests] = useState<any[]>([])

  const recentReflections = getReflections().slice(0, 5)
  const activeModules = trainingModules.filter(m => !m.completed)

  const toggleEmotion = (emotion: string) => {
    if (emotions.includes(emotion)) {
      setEmotions(emotions.filter(e => e !== emotion))
    } else if (emotions.length < 3) {
      setEmotions([...emotions, emotion])
    }
  }

  const handleSubmit = async () => {
    if (!mood || emotions.length === 0) return

    setIsSubmitting(true)
    try {
      // Create the reflection object
      const reflection = {
        mood: parseInt(mood),
        emotions,
        challenges: challenge ? [challenge] : [],
        insights: thoughts ? [thoughts] : [],
        gratitude: gratitude ? [gratitude] : [],
        energyLevel: parseInt(mood),
        motivationLevel: parseInt(mood),
      }

      // Add to diary as well
      const diaryContent = `
Mood: ${mood}/10
Emotions: ${emotions.join(", ")}
${thoughts ? `\nThoughts: ${thoughts}` : ""}
${challenge ? `\nChallenge: ${challenge}` : ""}
${gratitude ? `\nGrateful for: ${gratitude}` : ""}
      `.trim()

      await addDiaryEntry(diaryContent)
      setReflection(reflection)
      
      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting reflection:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateQuests = async () => {
    setIsGeneratingQuests(true)
    try {
      // Call the API to generate quests based on reflection
      const response = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reflection: {
            mood: parseInt(mood),
            emotions,
            challenges: challenge ? [challenge] : [],
            insights: thoughts ? [thoughts] : [],
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.quests && data.quests.length > 0) {
          setGeneratedQuests(data.quests)
          // Add quests to the store
          addTrainingModules(data.quests.map((q: any) => ({
            title: q.title,
            description: q.description,
            xp: q.xp || 20,
            realm: q.realm || "Self-Awareness Training",
            difficulty: q.difficulty || "Foundational",
            questType: "daily",
            statBoosts: q.statBoosts || {},
          })))
        }
      }
    } catch (error) {
      console.error("Error generating quests:", error)
    } finally {
      setIsGeneratingQuests(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setMood("")
    setEmotions([])
    setThoughts("")
    setChallenge("")
    setGratitude("")
    setSubmitted(false)
    setGeneratedQuests([])
  }

  // Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F0FDFA]">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
            <Link href="/" className="flex items-center gap-1 text-teal-600 font-medium">
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reflection Saved!</h2>
            <p className="text-gray-600 mb-6">
              Great job taking time to reflect. Would you like personalized quests based on your reflection?
            </p>

            {generatedQuests.length > 0 ? (
              <div className="text-left mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Suggested Quests:</h3>
                <div className="space-y-3">
                  {generatedQuests.slice(0, 3).map((quest, index) => (
                    <div key={index} className="bg-teal-50 rounded-lg p-4 border-l-4 border-teal-500">
                      <h4 className="font-medium text-gray-900">{quest.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{quest.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerateQuests}
                disabled={isGeneratingQuests}
                className="btn-primary mb-4"
              >
                {isGeneratingQuests ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Quests...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Quests
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={resetForm}>
                New Reflection
              </Button>
              <Link href="/">
                <Button className="btn-primary">Back to Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-teal-600 font-medium">
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <span className="text-sm text-gray-500">Step {step} of 3</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">Daily Reflection</h1>
          <p className="text-gray-600 mt-1">
            Take a moment to check in with yourself
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Steps */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">How are you feeling?</h2>
                  <p className="text-sm text-gray-500">Rate your current mood</p>
                </div>
              </div>

              {/* Mood Selector */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Current Mood (1-10)
                </Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${option.color}`} />
                          {option.value} - {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Emotion Tags */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Select up to 3 emotions
                </Label>
                <div className="flex flex-wrap gap-2">
                  {emotionOptions.map((emotion) => (
                    <button
                      key={emotion}
                      onClick={() => toggleEmotion(emotion)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        emotions.includes(emotion)
                          ? "bg-teal-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {emotion}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!mood || emotions.length === 0}
                className="btn-primary w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Your Thoughts</h2>
                  <p className="text-sm text-gray-500">Share what's on your mind</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  What's on your mind today?
                </Label>
                <Textarea
                  value={thoughts}
                  onChange={(e) => setThoughts(e.target.value)}
                  placeholder="Write freely about your day, thoughts, or anything you'd like to process..."
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Any challenges you're facing? (Optional)
                </Label>
                <Textarea
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  placeholder="Describe a challenge or difficulty you're working through..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="btn-primary flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Gratitude & Insights</h2>
                  <p className="text-sm text-gray-500">End on a positive note</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  What are you grateful for today?
                </Label>
                <Textarea
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  placeholder="Name something you're thankful for, big or small..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Summary Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Reflection Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Mood:</span> {mood}/10</p>
                  <p><span className="text-gray-500">Emotions:</span> {emotions.join(", ")}</p>
                  {thoughts && <p><span className="text-gray-500">Thoughts:</span> {thoughts.substring(0, 50)}...</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Complete Reflection"
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Reflections */}
        {recentReflections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Recent Reflections</h3>
            <div className="space-y-3">
              {recentReflections.map((reflection, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        reflection.mood >= 7 ? "bg-green-500" :
                        reflection.mood >= 4 ? "bg-yellow-500" : "bg-red-500"
                      }`}>
                        {reflection.mood}
                      </div>
                      <span className="text-sm text-gray-600">
                        {reflection.emotions?.join(", ") || "No emotions recorded"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(reflection.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Modules Connection */}
        {activeModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Related Quests</h3>
            <div className="space-y-3">
              {activeModules.slice(0, 3).map((module) => (
                <div 
                  key={module.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 border-l-4 border-l-teal-500"
                >
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{module.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
