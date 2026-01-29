"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Heart, Award, Sparkles } from "lucide-react"
import { PeerCircles } from "@/components/community/peer-circles"
import { MentorRecognition } from "@/components/community/mentor-recognition"
import { GratitudeSystem } from "@/components/community/gratitude-system"

export default function PeerSupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Peer Support & Community</h1>
              <p className="text-foreground/70">
                Connect with colleagues, recognize mentors, and build a supportive nursing community
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="circles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="circles">Peer Circles</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="gratitude">Gratitude</TabsTrigger>
          </TabsList>

          <TabsContent value="circles" className="space-y-4">
            <PeerCircles />
          </TabsContent>

          <TabsContent value="mentors" className="space-y-4">
            <MentorRecognition />
          </TabsContent>

          <TabsContent value="gratitude" className="space-y-4">
            <GratitudeSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
