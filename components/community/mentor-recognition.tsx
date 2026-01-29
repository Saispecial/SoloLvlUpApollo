"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Star, Heart } from "lucide-react"

export function MentorRecognition() {
  // Mock mentor data
  const mentors = [
    { id: "1", name: "Mentor A", recognitionCount: 15, specialty: "ICU" },
    { id: "2", name: "Mentor B", recognitionCount: 12, specialty: "Pediatrics" },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Award className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <CardTitle>Mentor Recognition</CardTitle>
            <CardDescription>
              Recognize and appreciate mentor nurses who have supported your growth
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="p-4 rounded-warm bg-secondary/5 border border-secondary/20 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{mentor.name}</p>
                <p className="text-sm text-foreground/60">{mentor.specialty} • {mentor.recognitionCount} recognitions</p>
              </div>
              <Button variant="outline" size="sm">
                <Star className="w-4 h-4 mr-2" />
                Recognize
              </Button>
            </div>
          ))}
        </div>

        <Button className="w-full bg-warm-gradient-peach text-white">
          <Heart className="w-4 h-4 mr-2" />
          Tag a New Mentor
        </Button>
      </CardContent>
    </Card>
  )
}
