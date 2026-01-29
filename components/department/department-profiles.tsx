"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Users } from "lucide-react"

interface DepartmentProfilesProps {
  department: string
}

const departmentBenchmarks: Record<string, any> = {
  ICU: {
    description: "High-stress environment requiring exceptional emotional resilience",
    eiBenchmarks: {
      "Self-Awareness": 55,
      "Self-Management": 60,
      "Social Awareness": 58,
      "Relationship Management": 57,
    },
    activeModules: [
      "Compassion Fatigue Prevention",
      "Critical Incident Processing",
      "High-Stress Communication",
    ],
  },
  Pediatrics: {
    description: "Requires high empathy and family communication skills",
    eiBenchmarks: {
      "Self-Awareness": 58,
      "Self-Management": 56,
      "Social Awareness": 65,
      "Relationship Management": 62,
    },
    activeModules: [
      "Pediatric Empathy Scenarios",
      "Family Communication Skills",
      "Emotional Support for Children",
    ],
  },
  ER: {
    description: "Fast-paced environment with trauma exposure",
    eiBenchmarks: {
      "Self-Awareness": 54,
      "Self-Management": 59,
      "Social Awareness": 56,
      "Relationship Management": 55,
    },
    activeModules: [
      "Trauma Response Training",
      "Crisis Communication",
      "Rapid Emotional Regulation",
    ],
  },
  Oncology: {
    description: "Emotionally intense specialty requiring compassion and resilience",
    eiBenchmarks: {
      "Self-Awareness": 57,
      "Self-Management": 58,
      "Social Awareness": 60,
      "Relationship Management": 59,
    },
    activeModules: [
      "End-of-Life Communication",
      "Compassion Resilience",
      "Grief Processing Support",
    ],
  },
  General: {
    description: "General nursing practice with diverse patient interactions",
    eiBenchmarks: {
      "Self-Awareness": 50,
      "Self-Management": 50,
      "Social Awareness": 50,
      "Relationship Management": 50,
    },
    activeModules: [
      "General EI Development",
      "Patient Communication",
      "Team Collaboration",
    ],
  },
}

export function DepartmentProfiles({ department }: DepartmentProfilesProps) {
  const profile = departmentBenchmarks[department] || departmentBenchmarks.General

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>{department} Department Profile</CardTitle>
            <CardDescription>{profile.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EI Benchmarks */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Department EI Benchmarks
          </h4>
          {Object.entries(profile.eiBenchmarks).map(([domain, benchmark]) => (
            <div key={domain} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{domain}</span>
                <span className="font-medium">{benchmark}</span>
              </div>
              <Progress value={benchmark} className="h-2" />
            </div>
          ))}
        </div>

        {/* Active Modules */}
        <div className="space-y-2">
          <h4 className="font-semibold">Active Training Modules</h4>
          <div className="space-y-2">
            {profile.activeModules.map((module: string, idx: number) => (
              <div key={idx} className="p-3 rounded-warm bg-primary/5 border border-primary/20">
                <p className="text-sm">{module}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
