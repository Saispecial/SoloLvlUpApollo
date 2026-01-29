"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  useTrainingStore, 
  WEEKS_DATA, 
  TRAINING_TASKS,
  getDayCompletionStatus 
} from "@/stores/training-store"
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  Play,
  BookOpen,
  Target,
  Clock
} from "lucide-react"

export default function TrainingOverviewPage() {
  const router = useRouter()
  const { 
    courseStartDate, 
    startCourse, 
    getCurrentWeekDay, 
    completedTasks,
    isTaskUnlocked 
  } = useTrainingStore()
  
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center">
        <div className="animate-pulse text-teal-600">Loading...</div>
      </div>
    )
  }
  
  const currentProgress = getCurrentWeekDay()
  
  // Calculate overall progress
  const totalTasks = TRAINING_TASKS.length
  const completedCount = completedTasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  
  // If course not started, show welcome screen
  if (!courseStartDate) {
    return (
      <div className="min-h-screen bg-[#F0FDFA]">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <button 
              onClick={() => router.push("/")}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 ml-2">EI Course</h1>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-teal-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Welcome to EI Training
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              A 4-week structured program to develop your emotional intelligence skills through daily practice and reflection.
            </p>
            
            {/* Program Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-teal-600">4</div>
                <div className="text-sm text-gray-600">Weeks</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-teal-600">28</div>
                <div className="text-sm text-gray-600">Days</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-teal-600">6</div>
                <div className="text-sm text-gray-600">EI Stats</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-teal-600">5</div>
                <div className="text-sm text-gray-600">Tools</div>
              </div>
            </div>
            
            <Button 
              onClick={startCourse}
              className="btn-primary px-8 py-3 text-base"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Your Journey
            </Button>
          </motion.div>
        </main>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.push("/")}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 ml-2">EI Course</h1>
          </div>
          <div className="text-sm text-gray-500">
            Week {currentProgress.week}, Day {currentProgress.day}
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
                  <p className="text-sm text-gray-500">{completedCount} of {totalTasks} tasks completed</p>
                </div>
                <div className="text-2xl font-bold text-teal-600">{progressPercent}%</div>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Weeks Timeline */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Training Weeks</h3>
          
          {WEEKS_DATA.map((week, index) => {
            const isCurrentWeek = week.week === currentProgress.week
            const isPastWeek = week.week < currentProgress.week
            const isLocked = week.week > currentProgress.week
            
            // Calculate week progress
            let weekTasks = TRAINING_TASKS.filter(t => t.week === week.week)
            let weekCompleted = weekTasks.filter(t => completedTasks.some(c => c.taskId === t.id)).length
            let weekProgress = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0
            
            // For locked weeks, show 0
            if (isLocked) {
              weekTasks = []
              weekCompleted = 0
              weekProgress = 0
            }
            
            return (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`bg-white border-0 shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    isCurrentWeek ? "ring-2 ring-teal-500" : ""
                  } ${isLocked ? "opacity-60" : ""}`}
                  onClick={() => !isLocked && router.push(`/training/week/${week.week}`)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      {/* Week indicator */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                        isPastWeek ? "bg-green-100" :
                        isCurrentWeek ? "bg-teal-100" :
                        "bg-gray-100"
                      }`}>
                        {isLocked ? (
                          <Lock className="w-5 h-5 text-gray-400" />
                        ) : isPastWeek ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className={`text-lg font-bold ${isCurrentWeek ? "text-teal-600" : "text-gray-600"}`}>
                            {week.week}
                          </span>
                        )}
                      </div>
                      
                      {/* Week info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">Week {week.week}: {week.title}</h4>
                          {isCurrentWeek && (
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{week.description}</p>
                        
                        {!isLocked && (
                          <div className="mt-2 flex items-center gap-3">
                            <Progress value={weekProgress} className="h-1.5 flex-1 max-w-[200px]" />
                            <span className="text-xs text-gray-500">{weekProgress}%</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow */}
                      {!isLocked && (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{completedCount}</div>
              <div className="text-xs text-gray-500">Tasks Done</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">
                {Math.floor((new Date().getTime() - new Date(courseStartDate).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-gray-500">Days Active</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">
                {currentProgress.week}
              </div>
              <div className="text-xs text-gray-500">Current Week</div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
