"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Building2, Users, Target } from "lucide-react"
import { DepartmentProfiles } from "@/components/department/department-profiles"

export default function DepartmentSettingsPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("General")

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Department & Specialty Settings</h1>
          <p className="text-foreground/70">
            Customize your EI development experience based on your department and specialty
          </p>
        </div>

        {/* Department Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Select Your Department</CardTitle>
                <CardDescription>
                  Choose your department to receive customized training modules and benchmarks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="ER">Emergency Room</SelectItem>
                  <SelectItem value="Oncology">Oncology</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-warm-gradient-teal text-white">Save Department Settings</Button>
          </CardContent>
        </Card>

        {/* Department Profile */}
        <DepartmentProfiles department={selectedDepartment} />
      </div>
    </div>
  )
}
