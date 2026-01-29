"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Heart, Brain, Users, Target, CheckCircle2, ArrowRight } from "lucide-react"

const onboardingSteps = [
  {
    id: 1,
    title: "Welcome to Your EI Development Journey",
    description: "This platform helps you develop emotional intelligence through personalized training modules.",
    icon: Heart,
  },
  {
    id: 2,
    title: "Why EI Matters for Nurses",
    description:
      "Emotional intelligence helps you manage stress, build better patient relationships, and prevent burnout.",
    icon: Brain,
  },
  {
    id: 3,
    title: "Four EI Domains",
    description:
      "We focus on Self-Awareness, Self-Management, Social Awareness, and Relationship Management.",
    icon: Target,
  },
  {
    id: 4,
    title: "Get Started",
    description: "Complete your first assessment to receive a personalized development roadmap.",
    icon: CheckCircle2,
  },
]

export default function NurseOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false)

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setCompleted(true)
      // Mark onboarding as complete
      localStorage.setItem("onboarding-complete", "true")
    }
  }

  const handleSkip = () => {
    setCompleted(true)
    localStorage.setItem("onboarding-complete", "true")
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-success/20 bg-success/5">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-success/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-success" />
              </motion.div>
              <CardTitle className="text-2xl text-success">You're All Set!</CardTitle>
              <CardDescription>
                You're ready to begin your EI development journey. Start with an assessment to get
                your personalized roadmap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => (window.location.href = "/assessment")}
                className="w-full bg-warm-gradient-teal text-white"
              >
                Start Your First Assessment
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const step = onboardingSteps[currentStep]
  const Icon = step.icon
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
            <button onClick={handleSkip} className="text-foreground/60 hover:text-foreground">
              Skip
            </button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-2 border-primary/20">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Icon className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl">{step.title}</CardTitle>
                <CardDescription className="text-base mt-2">{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleNext}
                  className="w-full bg-warm-gradient-teal text-white"
                  size="lg"
                >
                  {currentStep === onboardingSteps.length - 1 ? (
                    "Complete Onboarding"
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
