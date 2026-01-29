"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users } from "lucide-react"

export function AnonymizedMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Anonymized Team Metrics
        </CardTitle>
        <CardDescription>
          Individual nurse data is anonymized. Only aggregate metrics are shown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/70">
          Detailed anonymized metrics visualization would be implemented here, showing team trends,
          department comparisons, and performance indicators without revealing individual identities.
        </p>
      </CardContent>
    </Card>
  )
}
