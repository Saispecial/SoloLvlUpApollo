"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function TeamEIClimate() {
  // Mock data - in production, would fetch from API
  const teamData = {
    averageEI: 58,
    trend: "up" as "up" | "down" | "stable",
    climate: "positive" as "positive" | "neutral" | "concerning",
    domainAverages: {
      "Self-Awareness": 56,
      "Self-Management": 59,
      "Social Awareness": 60,
      "Relationship Management": 57,
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Team EI Climate
        </CardTitle>
        <CardDescription>Anonymized team emotional intelligence overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Team EI</span>
            <span className="text-2xl font-bold text-primary">{teamData.averageEI}</span>
          </div>
          <Progress value={teamData.averageEI} className="h-3" />
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            {teamData.trend === "up" && <TrendingUp className="w-4 h-4 text-success" />}
            {teamData.trend === "down" && <TrendingDown className="w-4 h-4 text-error" />}
            {teamData.trend === "stable" && <Minus className="w-4 h-4 text-foreground/40" />}
            <span>Trending {teamData.trend}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Domain Averages</h4>
          {Object.entries(teamData.domainAverages).map(([domain, score]) => (
            <div key={domain} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{domain}</span>
                <span className="font-medium">{score}</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
