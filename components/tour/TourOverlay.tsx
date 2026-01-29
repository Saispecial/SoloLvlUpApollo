"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { useTourStore, TOUR_STEPS } from "@/stores/tour-store"
import { Button } from "@/components/ui/button"
import Enhanced3DNurseScene from "@/components/counseling/Enhanced3DNurseScene"
import { ChevronRight, X } from "lucide-react"

export function TourOverlay() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    isTourActive,
    currentStepIndex,
    showNewUserPopup,
    startTour,
    endTour,
    nextStep,
    setShowNewUserPopup,
    setHasSeenTour,
  } = useTourStore()

  const currentStep = TOUR_STEPS[currentStepIndex]
  const [isTalking, setIsTalking] = useState(false)

  // Voice Synthesis Logic
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      window.speechSynthesis?.cancel()
      return
    }

    const speak = (text: string) => {
      // Cancel previous speech
      window.speechSynthesis?.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Attempt to find a female voice
      const voices = window.speechSynthesis?.getVoices() || []
      const femaleVoice = voices.find(v => 
        v.name.includes('Female') || 
        v.name.includes('Zira') || 
        v.name.includes('Samantha') ||
        v.name.includes('Google US English')
      )
      
      if (femaleVoice) {
        utterance.voice = femaleVoice
      }
      
      utterance.rate = 1.0
      utterance.pitch = 1.1 // Slightly higher pitch for friendlier tone

      utterance.onstart = () => setIsTalking(true)
      utterance.onend = () => setIsTalking(false)
      utterance.onerror = () => setIsTalking(false)

      window.speechSynthesis?.speak(utterance)
    }

    // Small delay to allow page transition before speaking
    const timer = setTimeout(() => {
      speak(currentStep.text)
    }, 500)

    return () => {
      clearTimeout(timer)
      window.speechSynthesis?.cancel()
    }
  }, [isTourActive, currentStep])

  // Handle navigation when step changes
  useEffect(() => {
    if (isTourActive && currentStep) {
      // Check if we need to navigate
      // Note: simple check, might need more robust matching for query params
      const targetPath = currentStep.route.split('?')[0]
      const currentPath = pathname
      
      if (currentPath !== targetPath) {
        router.push(currentStep.route)
      } else if (currentStep.route.includes('?')) {
        // Force push if query params differ (simplified)
        router.push(currentStep.route)
      }
      
      // Start talking animation (fallback if speech synthesis fails/delays)
      setIsTalking(true)
    }
  }, [isTourActive, currentStepIndex, currentStep, router, pathname])

  // New User Popup
  if (showNewUserPopup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border-2 border-teal-100 text-center relative overflow-hidden"
        >
          {/* Decorative background */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-teal-50 to-transparent -z-10" />
          
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            👋
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600 mb-6">
            Are you a new user? I'd love to show you around and explain how everything works.
          </p>
          
          <div className="space-y-3">
            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg h-12 rounded-xl"
              onClick={() => {
                // Immediately mark as seen so it doesn't pop up again if they refresh/re-navigate
                setHasSeenTour(true) 
                startTour()
              }}
            >
              Yes, show me around!
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setShowNewUserPopup(false)
                setHasSeenTour(true)
              }}
            >
              No thanks, I'll explore myself
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Tour Overlay
  if (isTourActive && currentStep) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end pb-0 sm:pb-8">
        {/* Dimmed Background - transparent to see app behind */}
        <div className="absolute inset-0 bg-black/10 pointer-events-auto" />

        {/* Tour Content Container */}
        <div className="relative w-full max-w-md mx-auto pointer-events-auto">
          
          {/* 3D Model Container - Positioned to not block center content completely */}
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 right-0 w-48 h-64 sm:w-64 sm:h-80 z-10"
          >
             <Enhanced3DNurseScene emotion="happy" isTalking={isTalking} />
          </motion.div>

          {/* Speech Bubble / Control Panel */}
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 sm:left-0 sm:right-auto sm:w-[calc(100%-14rem)] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-teal-100 mb-20 sm:mb-0 mr-36 sm:mr-0"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-teal-700 text-sm uppercase tracking-wider mb-1">
                  Step {currentStepIndex + 1}/{TOUR_STEPS.length}: {currentStep.id.replace('-', ' ')}
                </h3>
                <p className="text-gray-800 text-sm leading-relaxed">
                  {currentStep.text}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 text-xs"
                onClick={endTour}
              >
                End Tour
              </Button>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50"
                onClick={nextStep}
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return null
}
