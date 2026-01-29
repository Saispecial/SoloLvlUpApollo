"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, CheckCircle2 } from "lucide-react"

export function DataExport() {
  const [exportFormat, setExportFormat] = useState("csv")
  const [exported, setExported] = useState(false)

  const handleExport = async () => {
    // In production, would fetch anonymized data from API
    const data = {
      studyId: "EI-2024-001",
      participantId: "ANON-" + Math.random().toString(36).substr(2, 9),
      preAssessment: null,
      postAssessment: null,
      interventions: [],
      outcomes: {
        attendance: 0,
        teamworkScore: 0,
        patientSatisfaction: 0,
      },
      exportDate: new Date(),
    }

    if (exportFormat === "csv") {
      // Convert to CSV
      const csv = "Study ID,Participant ID,Export Date\n" + `${data.studyId},${data.participantId},${data.exportDate}`
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `research-data-${Date.now()}.csv`
      a.click()
    } else {
      // JSON export
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `research-data-${Date.now()}.json`
      a.click()
    }

    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Export Research Data</CardTitle>
            <CardDescription>Download anonymized datasets for research purposes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 rounded-warm bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground/80">
            All exported data is fully anonymized. No personally identifiable information is included.
            Data meets IRB/ethics requirements for research use.
          </p>
        </div>

        <Button
          onClick={handleExport}
          className="w-full bg-warm-gradient-teal text-white"
          disabled={exported}
        >
          {exported ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Exported
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
