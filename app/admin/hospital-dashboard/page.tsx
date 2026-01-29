"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, TrendingUp, Users, BarChart3 } from "lucide-react"
import { DepartmentComparison } from "@/components/admin/department-comparison"
import { AttritionCorrelation } from "@/components/admin/attrition-correlation"

export default function HospitalDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Hospital-Wide EI Dashboard</h1>
              <p className="text-foreground/70">
                Organization-level emotional intelligence insights and analytics
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Nurses</CardDescription>
              <CardTitle className="text-2xl">247</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average EI Score</CardDescription>
              <CardTitle className="text-2xl">57</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Departments</CardDescription>
              <CardTitle className="text-2xl">12</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overall Climate</CardDescription>
              <CardTitle className="text-2xl text-success">Positive</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="attrition">Attrition</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hospital-Wide EI Climate</CardTitle>
                <CardDescription>Organization-level emotional intelligence overview</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">
                  Comprehensive hospital-wide analytics and insights would be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <DepartmentComparison />
          </TabsContent>

          <TabsContent value="attrition" className="space-y-4">
            <AttritionCorrelation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
