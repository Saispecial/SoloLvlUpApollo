"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown, TrendingUp } from "lucide-react"

export function AttritionCorrelation() {
  // Mock correlation data
  const correlations = [
    { metric: "EI ↔ Attrition Rate", value: -0.68, direction: "negative" },
    { metric: "EI ↔ Absenteeism", value: -0.52, direction: "negative" },
    { metric: "EI ↔ Job Satisfaction", value: 0.74, direction: "positive" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attrition & Absenteeism Correlation</CardTitle>
        <CardDescription>
          Relationship between EI development and workforce retention metrics
        </CardDescription>
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
