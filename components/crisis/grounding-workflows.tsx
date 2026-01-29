"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Heart, Wind, Eye, Hand, CheckCircle2 } from "lucide-react"

interface GroundingExercise {
  id: string
  title: string
  description: string
  duration: number // in seconds
  steps: string[]
  icon: React.ReactNode
}

const groundingExercises: GroundingExercise[] = [
  {
    id: "5-4-3-2-1",
    title: "5-4-3-2-1 Grounding",
    description: "Use your senses to ground yourself in the present moment",
    duration: 120,
    steps: [
      "Name 5 things you can see around you",
      "Name 4 things you can touch",
      "Name 3 things you can hear",
      "Name 2 things you can smell",
      "Name 1 thing you can taste",
    ],
    icon: <Eye className="w-6 h-6" />,
  },
  {
    id: "breathing",
    title: "4-7-8 Breathing",
    description: "Calm your nervous system with controlled breathing",
    duration: 60,
    steps: [
      "Inhale through your nose for 4 counts",
      "Hold your breath for 7 counts",
      "Exhale through your mouth for 8 counts",
      "Repeat 3-4 times",
    ],
    icon: <Wind className="w-6 h-6" />,
  },
  {
    id: "body-scan",
    title: "Body Scan",
    description: "Bring awareness to your body to reduce tension",
    duration: 90,
    steps: [
      "Start at your toes, notice any sensations",
      "Slowly move up through your legs",
      "Continue through your torso",
      "Notice your arms and hands",
      "Finally, notice your head and face",
      "Take a deep breath and release",
    ],
    icon: <Hand className="w-6 h-6" />,
  },
]

interface GroundingWorkflowsProps {
  onComplete?: () => void
}

export function GroundingWorkflows({ onComplete }: GroundingWorkflowsProps) {
  const [selectedExercise, setSelectedExercise] = useState<GroundingExercise | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const startExercise = (exercise: GroundingExercise) => {
    setSelectedExercise(exercise)
    setCurrentStep(0)
    setTimeRemaining(exercise.duration)
    setIsActive(true)
  }

  const nextStep = () => {
    if (!selectedExercise) return

    if (currentStep < selectedExercise.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Exercise complete
      setIsActive(false)
      if (onComplete) {
        onComplete()
      }
    }
  }

  if (!selectedExercise) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Choose a Grounding Exercise</h3>
          <p className="text-sm text-foreground/70">
            These exercises are safe, non-clinical tools to help you feel more grounded and present.
          </p>
        </div>

        <div className="grid gap-4">
          {groundingExercises.map((exercise) => (
            <motion.div
              key={exercise.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => startExercise(exercise)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">{exercise.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{exercise.title}</CardTitle>
                      <CardDescription>{exercise.description}</CardDescription>
                    </div>
                    <span className="text-sm text-foreground/60">
                      {Math.floor(exercise.duration / 60)} min
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {currentStep + 1} of {selectedExercise.steps.length}
          </span>
          <span className="text-foreground/60">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </span>
        </div>
        <Progress
          value={((currentStep + 1) / selectedExercise.steps.length) * 100}
          className="h-2"
        />
      </div>

      {/* Current Step */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              {selectedExercise.icon}
            </div>
            <div>
              <CardTitle>{selectedExercise.title}</CardTitle>
              <CardDescription>Step {currentStep + 1}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <p className="text-2xl font-semibold text-foreground mb-4">
              {selectedExercise.steps[currentStep]}
            </p>
            <p className="text-sm text-foreground/60">
              Take your time. There's no rush.
            </p>
          </motion.div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            <Button
              onClick={nextStep}
              className="flex-1 bg-warm-gradient-teal text-white"
            >
              {currentStep < selectedExercise.steps.length - 1 ? (
                "Next Step"
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All Steps Preview */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm">All Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            {selectedExercise.steps.map((step, idx) => (
              <li
                key={idx}
                className={idx === currentStep ? "font-semibold text-primary" : "text-foreground/70"}
              >
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
