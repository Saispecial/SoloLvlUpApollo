"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Send } from "lucide-react"

export function GratitudeSystem() {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    // In production, would send to API
    console.log("Gratitude message:", message)
    setMessage("")
    alert("Gratitude message sent! (In production, this would be sent to your colleague)")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Heart className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle>Gratitude & Appreciation</CardTitle>
            <CardDescription>
              Send appreciation messages to colleagues who have supported you
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Appreciation Message</label>
          <Textarea
            placeholder="Thank a colleague for their support, empathy, or teamwork..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <Button
          onClick={handleSend}
          className="w-full bg-warm-gradient-lavender text-white"
          disabled={!message.trim()}
        >
          <Send className="w-4 h-4 mr-2" />
          Send Appreciation
        </Button>

        <div className="p-4 rounded-warm bg-accent/5 border border-accent/20">
          <p className="text-sm text-foreground/70">
            Your appreciation messages help build a positive team culture and recognize the
            emotional intelligence contributions of your colleagues.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
