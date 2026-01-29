"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Lightbulb,
  Target,
  Users,
  RefreshCw,
  Wind,
  ChevronRight,
  Brain,
  Shield,
  Heart,
  Sparkles,
} from "lucide-react"

const tools = [
  {
    id: "assumptions-lab",
    title: "Assumptions Lab",
    description: "Deep cognitive belief challenge",
    longDescription: "Challenge deeply held assumptions and beliefs. Transform limiting thoughts into growth opportunities through guided cognitive exercises.",
    icon: Lightbulb,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    benefits: ["Challenge limiting beliefs", "Build cognitive flexibility", "Earn XP & badges"],
  },
  {
    id: "control-influence-map",
    title: "Control & Influence Map",
    description: "Agency restoration under stress",
    longDescription: "Separate what you can control from what you can influence or must accept. Convert overwhelm into focused action.",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    benefits: ["Reduce helplessness", "Clarify priorities", "Generate action quests"],
  },
  {
    id: "change-companion",
    title: "Change Companion",
    description: "Interpersonal reappraisal & relational resilience",
    longDescription: "Navigate workplace relationships with clarity. Separate facts from interpretations and choose constructive responses.",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    benefits: ["Manage relational stress", "Prevent escalation", "Build team resilience"],
  },
  {
    id: "reframe",
    title: "Reframe",
    description: "Emotional first aid (rapid regulation)",
    longDescription: "Quick cognitive reframing for immediate emotional regulation. Fast, lightweight, and emotionally safe.",
    icon: RefreshCw,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    benefits: ["Rapid relief", "Validate emotions", "Shift perspective"],
  },
  {
    id: "breathing-exercise",
    title: "Breathing Exercise",
    description: "Physiological regulation & grounding",
    longDescription: "Guided breathing exercises with ambient sounds. Calm your nervous system and restore focus.",
    icon: Wind,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    benefits: ["Reduce stress", "Ground yourself", "Improve focus"],
  },
]

export default function AIToolsPage() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-teal-100">
              <Brain className="w-6 h-6 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AI Cognitive Tools</h1>
          </div>
          <p className="text-gray-600 ml-12">
            Evidence-based tools for emotional regulation, cognitive reframing, and stress management.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-white border-gray-100">
            <CardContent className="p-4 text-center">
              <Shield className="w-5 h-5 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-xs text-gray-500">Available Tools</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-100">
            <CardContent className="p-4 text-center">
              <Heart className="w-5 h-5 text-pink-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">EI</div>
              <div className="text-xs text-gray-500">Growth Focus</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-100">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">XP</div>
              <div className="text-xs text-gray-500">Earn Rewards</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tools Grid */}
        <div className="space-y-4">
          {tools.map((tool, index) => {
            const Icon = tool.icon
            const isHovered = hoveredTool === tool.id

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link href={`/ai-tools/${tool.id}`}>
                  <Card
                    className={`bg-white border-l-4 ${tool.borderColor} hover:shadow-md transition-all cursor-pointer`}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-xl ${tool.bgColor} shrink-0`}>
                          <Icon className={`w-6 h-6 ${tool.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                            <ChevronRight
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                isHovered ? "translate-x-1" : ""
                              }`}
                            />
                          </div>
                          <p className="text-sm text-teal-600 font-medium mb-2">
                            {tool.description}
                          </p>
                          <p className="text-sm text-gray-500 mb-3">
                            {tool.longDescription}
                          </p>

                          {/* Benefits */}
                          <div className="flex flex-wrap gap-2">
                            {tool.benefits.map((benefit) => (
                              <span
                                key={benefit}
                                className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                              >
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-lg bg-teal-50 border border-teal-100"
        >
          <p className="text-sm text-teal-800 text-center">
            These tools are designed specifically for healthcare professionals. 
            Complete exercises to earn XP and build your emotional intelligence.
          </p>
        </motion.div>
      </main>
    </div>
  )
}
