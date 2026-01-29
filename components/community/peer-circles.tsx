"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Lock, MessageCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function PeerCircles() {
  const [enabled, setEnabled] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Peer Support Circles</CardTitle>
            <CardDescription>
              Join anonymous peer support groups for emotional support and shared learning
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="peer-circles">Enable Peer Support Circles</Label>
            <p className="text-sm text-foreground/60">
              Participate in anonymous peer support groups (your identity is protected)
            </p>
          </div>
          <Switch id="peer-circles" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <div className="space-y-4">
            <div className="p-4 rounded-warm bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Privacy Protected</span>
              </div>
              <p className="text-sm text-foreground/70">
                All peer interactions are fully anonymized. Your identity is never revealed to other
                participants.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Active Circles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">3</p>
                  <p className="text-sm text-foreground/60">Support groups you're part of</p>
                </CardContent>
              </Card>

              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-secondary">12</p>
                  <p className="text-sm text-foreground/60">Unread peer messages</p>
                </CardContent>
              </Card>
            </div>

            <Button className="w-full bg-warm-gradient-teal text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              Join a Peer Circle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
