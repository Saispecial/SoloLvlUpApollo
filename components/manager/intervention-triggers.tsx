"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Heart } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function InterventionTriggers() {
  // Mock data - in production, would fetch from API
  const interventions = [
    {
      id: "1",
      type: "support",
      description: "Nurse showing signs of burnout - recommend wellness check-in",
      priority: "high",
      recommendedAt: new Date(),
    },
    {
      id: "2",
      type: "training",
      description: "Team could benefit from conflict resolution training",
      priority: "moderate",
      recommendedAt: new Date(),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Intervention Triggers
        </CardTitle>
        <CardDescription>Automated recommendations based on team EI patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {interventions.map((intervention) => (
          <Alert
            key={intervention.id}
            className={`border-${intervention.priority === "high" ? "error" : "warning"}/30`}
          >
            <Heart className="h-4 w-4" />
            <AlertTitle>{intervention.type.charAt(0).toUpperCase() + intervention.type.slice(1)} Intervention</AlertTitle>
            <AlertDescription>{intervention.description}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
