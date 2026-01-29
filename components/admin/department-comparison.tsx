"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export function DepartmentComparison() {
  // Mock department data
  const departments = [
    { name: "ICU", avgEI: 58, nurses: 24 },
    { name: "Pediatrics", avgEI: 62, nurses: 18 },
    { name: "ER", avgEI: 55, nurses: 32 },
    { name: "Oncology", avgEI: 59, nurses: 15 },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Department Comparison</CardTitle>
            <CardDescription>
              Compare EI development across departments (anonymized aggregate data)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {departments.map((dept) => (
          <div key={dept.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{dept.name}</span>
              <span>
                {dept.avgEI} (n={dept.nurses})
              </span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${dept.avgEI}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
