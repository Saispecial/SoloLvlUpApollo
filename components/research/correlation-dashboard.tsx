"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function CorrelationDashboard() {
  // Mock correlation data
  const correlations = [
    { metric: "EI ↔ Burnout", value: -0.65, direction: "negative" },
    { metric: "EI ↔ Teamwork", value: 0.72, direction: "positive" },
    { metric: "EI ↔ Patient Satisfaction", value: 0.58, direction: "positive" },
    { metric: "EI ↔ Attendance", value: 0.45, direction: "positive" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correlation Dashboard</CardTitle>
        <CardDescription>EI correlations with key healthcare outcomes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {correlations.map((corr, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{corr.metric}</span>
              <div className="flex items-center gap-2">
                {corr.direction === "positive" ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-error" />
                )}
                <span className="font-semibold">{corr.value.toFixed(2)}</span>
              </div>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  corr.direction === "positive" ? "bg-success" : "bg-error"
                }`}
                style={{ width: `${Math.abs(corr.value) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
