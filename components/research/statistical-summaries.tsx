"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp } from "lucide-react"

export function StatisticalSummaries() {
  // Mock data - in production, would calculate from actual assessment data
  const stats = {
    preAssessment: {
      mean: 52.3,
      stdDev: 8.2,
      n: 24,
    },
    postAssessment: {
      mean: 58.7,
      stdDev: 7.5,
      n: 24,
    },
    improvement: 6.4,
    pValue: 0.001,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Statistical Summaries</CardTitle>
            <CardDescription>Pre/post assessment statistical analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-warm bg-primary/5">
            <h4 className="font-semibold mb-2">Pre-Assessment</h4>
            <div className="space-y-1 text-sm">
              <p>Mean: {stats.preAssessment.mean}</p>
              <p>SD: {stats.preAssessment.stdDev}</p>
              <p>N: {stats.preAssessment.n}</p>
            </div>
          </div>
          <div className="p-4 rounded-warm bg-success/5">
            <h4 className="font-semibold mb-2">Post-Assessment</h4>
            <div className="space-y-1 text-sm">
              <p>Mean: {stats.postAssessment.mean}</p>
              <p>SD: {stats.postAssessment.stdDev}</p>
              <p>N: {stats.postAssessment.n}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-warm bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <h4 className="font-semibold">Improvement</h4>
          </div>
          <p className="text-2xl font-bold text-success">+{stats.improvement} points</p>
          <p className="text-sm text-foreground/60 mt-1">p &lt; {stats.pValue} (statistically significant)</p>
        </div>
      </CardContent>
    </Card>
  )
}
