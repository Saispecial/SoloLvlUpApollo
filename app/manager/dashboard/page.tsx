"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, AlertTriangle, Award, BarChart3 } from "lucide-react"
import { TeamEIClimate } from "@/components/manager/team-ei-climate"
import { AnonymizedMetrics } from "@/components/manager/anonymized-metrics"
import { InterventionTriggers } from "@/components/manager/intervention-triggers"

export default function ManagerDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-foreground/70">
            Monitor team emotional intelligence climate and support your nurses' wellbeing
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Team Size</CardDescription>
              <CardTitle className="text-2xl">24</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average EI Score</CardDescription>
              <CardTitle className="text-2xl">58</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>At Risk Nurses</CardDescription>
              <CardTitle className="text-2xl text-warning">3</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Team Climate</CardDescription>
              <CardTitle className="text-2xl text-success">Positive</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="climate">Team Climate</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <TeamEIClimate />
          </TabsContent>

          <TabsContent value="climate" className="space-y-4">
            <TeamEIClimate />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <AnonymizedMetrics />
          </TabsContent>

          <TabsContent value="interventions" className="space-y-4">
            <InterventionTriggers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
