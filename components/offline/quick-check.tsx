"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, CheckCircle2 } from "lucide-react"

export function QuickCheck() {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const emotions = [
    { value: 1, label: "Struggling", emoji: "😔" },
    { value: 2, label: "Tired", emoji: "😴" },
    { value: 3, label: "Neutral", emoji: "😐" },
    { value: 4, label: "Okay", emoji: "🙂" },
    { value: 5, label: "Good", emoji: "😊" },
  ]

  const handleSubmit = () => {
    // Save quick check
    const checkIn = {
      date: new Date(),
      emotion: selected,
    }
    localStorage.setItem(`quick-check-${new Date().toDateString()}`, JSON.stringify(checkIn))
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setSelected(null)
    }, 2000)
  }

  if (submitted) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="font-semibold text-success">Check-in saved!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Quick Emotional Check</CardTitle>
            <CardDescription>One-tap check-in for busy shifts</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {emotions.map((emotion) => (
            <button
              key={emotion.value}
              onClick={() => setSelected(emotion.value)}
              className={`p-4 rounded-warm border-2 transition-all ${
                selected === emotion.value
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-1">{emotion.emoji}</div>
              <div className="text-xs">{emotion.label}</div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-warm-gradient-teal text-white"
          disabled={selected === null}
        >
          Save Check-In
        </Button>
      </CardContent>
    </Card>
  )
}
