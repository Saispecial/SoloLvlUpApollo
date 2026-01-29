"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Download, FileText, BarChart3, TrendingUp } from "lucide-react"
import { DataExport } from "@/components/research/data-export"
import { StatisticalSummaries } from "@/components/research/statistical-summaries"
import { CorrelationDashboard } from "@/components/research/correlation-dashboard"

export default function ResearchModePage() {
  const [researchModeEnabled, setResearchModeEnabled] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Research Mode</h1>
          <p className="text-foreground/70">
            Configure research settings and export anonymized data for academic studies
          </p>
        </div>

        {/* Research Mode Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Research Mode Configuration</CardTitle>
            <CardDescription>
              Enable research mode to participate in EI development studies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="research-mode">Enable Research Mode</Label>
                <p className="text-sm text-foreground/60">
                  Allow your anonymized data to be used for research purposes
                </p>
              </div>
              <Switch
                id="research-mode"
                checked={researchModeEnabled}
                onCheckedChange={setResearchModeEnabled}
              />
            </div>

            {researchModeEnabled && (
              <div className="p-4 rounded-warm bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground/80">
                  Research mode is enabled. Your data will be fully anonymized before export. All
                  identifying information will be removed to protect your privacy.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Research Features */}
        {researchModeEnabled && (
          <div className="space-y-6">
            <StatisticalSummaries />
            <CorrelationDashboard />
            <DataExport />
          </div>
        )}
      </div>
    </div>
  )
}
