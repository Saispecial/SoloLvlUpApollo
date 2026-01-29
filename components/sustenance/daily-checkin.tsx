"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, CheckCircle2 } from "lucide-react"

export function DailyCheckIn() {
  const [completed, setCompleted] = useState(false)
  const [response, setResponse] = useState("")

  const handleSubmit = () => {
    // Save check-in
    const checkIn = {
      date: new Date(),
      response,
    }
    localStorage.setItem(`checkin-${new Date().toDateString()}`, JSON.stringify(checkIn))
    setCompleted(true)
  }

  if (completed) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/20">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <p className="font-semibold text-success">Check-in Complete!</p>
          <p className="text-sm text-foreground/70">Thank you for taking a moment for yourself today.</p>
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
            <CardTitle>Daily Emotional Check-In</CardTitle>
            <CardDescription>Take a moment to reflect on how you're feeling today</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="How are you feeling today? What's on your mind?"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          className="min-h-[120px]"
        />
        <Button onClick={handleSubmit} className="w-full bg-warm-gradient-teal text-white">
          Complete Check-In
        </Button>
      </CardContent>
    </Card>
  )
}
