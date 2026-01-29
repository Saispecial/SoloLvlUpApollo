"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Heart, ClipboardCheck, ChevronLeft } from "lucide-react"
import { AssessmentSelector } from "@/components/assessment/assessment-selector"
import { TEIQueSFForm } from "@/components/assessment/teique-sf-form"
import { SSEITForm } from "@/components/assessment/sseit-form"
import { HEITForm } from "@/components/assessment/heit-form"
import { NurseEIForm } from "@/components/assessment/nurse-ei-form"
import { AssessmentResults } from "@/components/assessment/assessment-results"

export default function AssessmentPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [assessmentResults, setAssessmentResults] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<"select" | "assess" | "results">("select")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool)
    setCurrentStep("assess")
  }

  const handleAssessmentComplete = (results: any) => {
    setAssessmentResults(results)
    setCurrentStep("results")
  }

  if (currentStep === "results" && assessmentResults) {
    return (
      <div className="min-h-screen bg-[#F0FDFA]">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-1 text-teal-600 text-sm font-medium">
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </a>
            <span className="text-lg font-bold text-teal-600">SoloLvlUp</span>
          </div>
        </header>

        <div className={`${isMobile ? "px-4 py-4" : "max-w-6xl mx-auto p-6"}`}>
          <AssessmentResults results={assessmentResults} />
        </div>
      </div>
    )
  }

  if (currentStep === "assess" && selectedTool) {
    return (
      <div className="min-h-screen bg-[#F0FDFA]">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <button 
              onClick={() => setCurrentStep("select")}
              className="flex items-center gap-1 text-teal-600 text-sm font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Selection
            </button>
            <span className="text-lg font-bold text-teal-600">SoloLvlUp</span>
          </div>
        </header>

        <div className={`${isMobile ? "px-4 py-4" : "max-w-4xl mx-auto p-6"}`}>
          {selectedTool === "TEIQue-SF" && (
            <TEIQueSFForm onComplete={handleAssessmentComplete} />
          )}
          {selectedTool === "SSEIT" && (
            <SSEITForm onComplete={handleAssessmentComplete} />
          )}
          {selectedTool === "HEIT" && (
            <HEITForm onComplete={handleAssessmentComplete} />
          )}
          {selectedTool === "Nurse-EI" && (
            <NurseEIForm onComplete={handleAssessmentComplete} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1 text-teal-600 text-sm font-medium">
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </a>
          <span className="text-lg font-bold text-teal-600">SoloLvlUp</span>
        </div>
      </header>

      <div className={`${isMobile ? "px-4 py-4 space-y-4" : "max-w-6xl mx-auto p-6 space-y-6"}`}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-2">
            <Brain className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className={`font-bold text-gray-900 ${isMobile ? "text-2xl" : "text-3xl"}`}>
            EI Assessment Center
          </h1>
          <p className={`text-gray-500 max-w-2xl mx-auto ${isMobile ? "text-sm" : "text-base"}`}>
            Complete a validated emotional intelligence assessment to establish your baseline and receive
            a personalized development roadmap.
          </p>
        </motion.div>

        {/* Assessment Tool Selection */}
        <AssessmentSelector onSelectTool={handleToolSelect} />

        {/* Information Cards */}
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-2"}`}>
          <Card className="bg-white border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-50">
                  <Heart className="w-5 h-5 text-teal-600" />
                </div>
                <CardTitle className="text-base">Why Assess?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Understanding your current EI baseline helps us create personalized training modules
                tailored to your specific development needs across all four EI domains.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-base">What to Expect</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Each assessment takes 10-15 minutes. You'll receive immediate results with domain-wise
                analysis and a personalized development roadmap.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
