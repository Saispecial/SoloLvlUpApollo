"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Brain, Heart, Users, Sparkles, TrendingUp, Download, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppStore } from "@/stores/app-store"
import type { EIAssessment } from "@/lib/types"

interface AssessmentResultsProps {
  results: EIAssessment
}

export function AssessmentResults({ results }: AssessmentResultsProps) {
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [roadmapGenerated, setRoadmapGenerated] = useState(false)
  const [programInfo, setProgramInfo] = useState<{
    name: string
    duration: number
    rationale: string
  } | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { addTrainingModules, nurse, setActiveProgram } = useAppStore()
  const domainIcons = {
    selfAwareness: Brain,
    selfManagement: Heart,
    socialAwareness: Users,
    relationshipManagement: Sparkles,
  }

  const domainLabels = {
    selfAwareness: "Self-Awareness",
    selfManagement: "Self-Management",
    socialAwareness: "Social Awareness",
    relationshipManagement: "Relationship Management",
  }

  const domainColors = {
    selfAwareness: "primary",
    selfManagement: "secondary",
    socialAwareness: "success",
    relationshipManagement: "accent",
  }

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true)
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: results,
          nurseProfile: nurse,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate roadmap")
      }

      const data = await response.json()

      if (data.modules && Array.isArray(data.modules) && data.modules.length > 0) {
        console.log("[AssessmentResults] Roadmap modules received:", data.modules)

        // Store program information
        if (data.program) {
          setProgramInfo({
            name: data.program.name,
            duration: data.program.duration,
            rationale: data.program.rationale,
          })

          // Set active program in nurse store
          if (data.program.id) {
            setActiveProgram(data.program.id, new Date())
          }
        }

        // Ensure modules have all required fields
        const formattedModules = data.modules.map((module: any) => ({
          ...module,
          // Ensure legacy fields are present
          xp: module.eiPoints || module.xp || 35,
          realm: module.eiDomain || module.realm || "Self-Awareness & Recognition",
          statBoosts: module.statBoosts || module.competencyBoosts || {},
          // Ensure new fields are present
          eiPoints: module.eiPoints || module.xp || 35,
          eiDomain: module.eiDomain || module.realm || "Self-Awareness & Recognition",
          competencyBoosts: module.competencyBoosts || module.statBoosts || {},
          completed: false,
          createdAt: new Date(),
        }))

        console.log("[AssessmentResults] Formatted modules:", formattedModules)

        // Add modules to the store
        console.log("[AssessmentResults] Calling addTrainingModules with:", formattedModules)
        addTrainingModules(formattedModules)

        // Wait a bit to ensure store is persisted and Zustand has time to update
        await new Promise(resolve => setTimeout(resolve, 800))

        // Verify modules were added by checking the store directly
        const storeState = useAppStore.getState()
        const addedModules = storeState.trainingModules.slice(-formattedModules.length)

        console.log("[AssessmentResults] Store verification:", {
          totalTrainingModules: storeState.trainingModules.length,
          expectedCount: formattedModules.length,
          addedModulesCount: addedModules.length,
          addedModules: addedModules.map(m => ({ id: m.id, title: m.title })),
          questsCount: storeState.quests?.length || 0,
        })

        if (addedModules.length === 0) {
          console.error("[AssessmentResults] WARNING: Modules were not added to store!")
          toast({
            title: "Warning",
            description: "Modules generated but may not have been saved. Please check your Training Modules page.",
            variant: "destructive",
            duration: 5000,
          })
        }

        setRoadmapGenerated(true)

        toast({
          title: "Roadmap Generated!",
          description: `Added ${addedModules.length || data.modules.length} training modules. Redirecting to Training Modules...`,
          duration: 3000,
        })

        // Use Next.js router for navigation (preserves state better than window.location)
        setTimeout(() => {
          router.push("/?tab=quests")
        }, 1500)
      } else {
        console.error("[AssessmentResults] Invalid roadmap response:", data)
        throw new Error("Invalid roadmap response - no modules received")
      }
    } catch (error) {
      console.error("Error generating roadmap:", error)
      toast({
        title: "Error",
        description: "Failed to generate roadmap. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingRoadmap(false)
    }
  }

  const handleExportReport = async () => {
    setIsExporting(true)
    try {
      // Create a comprehensive report object
      const report = {
        assessment: {
          tool: results.tool,
          baselineScore: results.baselineScore,
          domainScores: results.domainScores,
          strengths: results.strengths,
          gaps: results.gaps,
          assessmentDate: results.assessmentDate,
          completedAt: results.completedAt,
        },
        metadata: {
          exportDate: new Date().toISOString(),
          platform: "SoloLvlUp Healthcare EI Platform",
          version: "1.0",
        },
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(report, null, 2)

      // Create blob and download
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `EI_Assessment_Report_${results.tool}_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Report Exported",
        description: "Your assessment report has been downloaded successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
          <TrendingUp className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-3xl font-bold">Assessment Complete</h1>
        <p className="text-foreground/70">Your EI baseline has been established</p>
      </motion.div>

      {/* Overall Score */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle>Overall EI Baseline Score</CardTitle>
          <CardDescription>Based on {results.tool} assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">{Math.round(results.baselineScore)}</div>
            <Progress value={results.baselineScore} className="h-4" />
            <p className="text-sm text-foreground/70">
              Assessment completed on {new Date(results.assessmentDate).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Domain Scores */}
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(results.domainScores).map(([domain, score]) => {
          const Icon = domainIcons[domain as keyof typeof domainIcons]
          const label = domainLabels[domain as keyof typeof domainLabels]
          const color = domainColors[domain as keyof typeof domainColors]

          return (
            <Card key={domain} className={`border-${color}/20`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${color}/10 text-${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <CardDescription>Domain Score</CardDescription>
                  </div>
                  <div className="text-2xl font-bold">{Math.round(score)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={score} className="h-2" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Strengths & Gaps */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-success/20 bg-success/5">
          <CardHeader>
            <CardTitle className="text-success">Strengths</CardTitle>
            <CardDescription>Areas where you excel</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="capitalize">{strength.replace(/([A-Z])/g, " $1").trim()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning">Development Areas</CardTitle>
            <CardDescription>Areas for growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.gaps.map((gap, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="capitalize">{gap.replace(/([A-Z])/g, " $1").trim()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleGenerateRoadmap}
          disabled={isGeneratingRoadmap || roadmapGenerated}
          className="flex-1 !bg-transparent !border-2 !border-black !text-black hover:!bg-teal-600 hover:!border-teal-600 hover:!text-white disabled:opacity-50 shadow-sm"
        >
          {isGeneratingRoadmap ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Roadmap...
            </>
          ) : roadmapGenerated ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Roadmap Generated!
            </>
          ) : (
            "Generate Development Roadmap"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleExportReport}
          disabled={isExporting}
          className="flex items-center gap-2 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Report
            </>
          )}
        </Button>
      </div>

      {/* Program Recommendation (shown after roadmap generation) */}
      {programInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Recommended Program
              </CardTitle>
              <CardDescription>Personalized based on your assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-xl font-semibold text-accent">{programInfo.name}</h3>
                <p className="text-sm text-foreground/70 mt-1">
                  Duration: {programInfo.duration} weeks
                </p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {programInfo.rationale}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
