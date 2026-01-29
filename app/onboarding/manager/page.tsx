"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BarChart3, AlertTriangle, Award } from "lucide-react"

export default function ManagerOnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Manager Onboarding</h1>
          <p className="text-foreground/70">
            Learn how to use the manager dashboard to support your team's EI development
          </p>
        </div>

        {/* Onboarding Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard Guide</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to the Manager Dashboard</CardTitle>
                <CardDescription>
                  Your guide to supporting your team's emotional intelligence development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Key Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-foreground/70">
                    <li>Monitor team EI climate (anonymized)</li>
                    <li>Receive intervention recommendations</li>
                    <li>Track team trends and patterns</li>
                    <li>Access leadership training modules</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">
                  Comprehensive guide to using the manager dashboard features would be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interventions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Intervention Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">
                  Guide on how to respond to intervention triggers and support team members would be
                  displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
