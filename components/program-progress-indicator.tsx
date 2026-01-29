"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Target, TrendingUp, Award, Clock } from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { motion } from "framer-motion"

export function ProgramProgressIndicator() {
  const { nurse, getWeeklyProgress, getProgramModules, getCurrentWeek } = useAppStore()
  
  // Check if user has an active program
  if (!nurse.activeProgramId) {
    return null
  }

  const weeklyProgress = getWeeklyProgress()
  const programModules = getProgramModules()
  const currentWeek = getCurrentWeek()
  
  // Calculate overall program progress
  const completedModules = programModules.filter(m => m.completed).length
  const totalModules = programModules.length
  const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0
  
  // Calculate weeks since start
  const startDate = nurse.programStartDate ? new Date(nurse.programStartDate) : new Date()
  const now = new Date()
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const weeksSinceStart = Math.floor(daysSinceStart / 7) + 1
  
  // Get program name from ID (simplified mapping)
  const programNames: Record<string, string> = {
    'intensive-6week': '6-Week Intensive EI Development',
    'focused-4week': '4-Week Focused EI Training',
    'maintenance-2week': '2-Week EI Maintenance',
    'balanced-5week': '5-Week Balanced EI Program',
    'advanced-4week': '4-Week Advanced EI Mastery'
  }
  
  const programName = programNames[nurse.activeProgramId] || 'EI Development Program'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-800">Current Program</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Week {currentWeek}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Program Info */}
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">{programName}</h3>
            <div className="flex items-center gap-4 text-sm text-blue-700">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Started {startDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{daysSinceStart} days active</span>
              </div>
            </div>
          </div>
          
          {/* Weekly Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">This Week Progress</span>
                <span className="text-sm text-blue-600">
                  {weeklyProgress.completedModules}/{weeklyProgress.totalModules} modules
                </span>
              </div>
              <Progress 
                value={weeklyProgress.totalModules > 0 ? (weeklyProgress.completedModules / weeklyProgress.totalModules) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Overall Progress</span>
                <span className="text-sm text-blue-600">
                  {completedModules}/{totalModules} total
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>
          
          {/* Progress Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-blue-700">
                <TrendingUp className="w-4 h-4" />
                <span>{Math.round(overallProgress)}% Complete</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-700">
                <Award className="w-4 h-4" />
                <span>{completedModules} Modules Done</span>
              </div>
            </div>
            
            {overallProgress >= 100 && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                🎉 Program Complete!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
