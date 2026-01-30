"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle2 } from "lucide-react"

interface AssessmentTool {
  id: string
  name: string
  fullName: string
  description: string
  items: number
  duration: string
  validated: boolean
  icon: React.ReactNode
}

const assessmentTools: AssessmentTool[] = [
  {
    id: "TEIQue-SF",
    name: "TEIQue-SF",
    fullName: "Trait Emotional Intelligence Questionnaire - Short Form",
    description:
      "A comprehensive 30-item assessment measuring trait emotional intelligence across four domains. Widely validated in healthcare settings.",
    items: 30,
    duration: "10-12 minutes",
    validated: true,
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: "SSEIT",
    name: "SSEIT",
    fullName: "Schutte Self-Report Emotional Intelligence Test",
    description:
      "A 33-item self-report measure focusing on emotional perception, regulation, and utilization. Excellent for nursing professionals.",
    items: 33,
    duration: "12-15 minutes",
    validated: true,
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: "HEIT",
    name: "HEIT",
    fullName: "Hall Emotional Intelligence Test",
    description:
      "A validated assessment tool specifically designed for healthcare professionals, measuring emotional skills in clinical contexts.",
    items: 30,
    duration: "10-12 minutes",
    validated: true,
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: "Nurse-EI",
    name: "Nurse EI Questionnaire",
    fullName: "Nurse Emotional Intelligence Questionnaire (Naser & Taha)",
    description:
      "A specialized assessment tool developed specifically for nurses, measuring EI competencies in nursing practice contexts.",
    items: 28,
    duration: "10-12 minutes",
    validated: true,
    icon: <FileText className="w-6 h-6" />,
  },
]

interface AssessmentSelectorProps {
  onSelectTool: (toolId: string) => void
}

export function AssessmentSelector({ onSelectTool }: AssessmentSelectorProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {assessmentTools.map((tool, index) => (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="h-full cursor-pointer hover:border-primary transition-all border-2 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">{tool.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{tool.fullName}</CardDescription>
                  </div>
                </div>
                {tool.validated && (
                  <div className="flex items-center gap-1 text-success text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validated</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/70">{tool.description}</p>

              <div className="flex items-center gap-4 text-xs text-foreground/60">
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{tool.items} items</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{tool.duration}</span>
                </div>
              </div>

              <Button
                onClick={() => onSelectTool(tool.id)}
                className="w-full !bg-transparent !border-2 !border-black !text-black hover:!bg-teal-600 hover:!border-teal-600 hover:!text-white shadow-sm transition-all hover:scale-[1.02]"
              >
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
