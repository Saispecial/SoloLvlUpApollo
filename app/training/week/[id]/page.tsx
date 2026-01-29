"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  useTrainingStore, 
  WEEKS_DATA, 
  DAY_THEMES,
  getTasksByDay,
  getDayCompletionStatus
} from "@/stores/training-store"
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  CheckCircle2,
  Circle,
  Play
} from "lucide-react"

export default function WeekViewPage() {
  const params = useParams()
  const weekId = Number.parseInt(params.id as string)
  const router = useRouter()
  
  const { 
    courseStartDate,
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
  
  // Redirect if course not started
  if (!courseStartDate) {
    router.push("/training")
    return null
  }
  
  const currentProgress = getCurrentWeekDay()
  const weekData = WEEKS_DATA.find(w => w.week === weekId)
  
  if (!weekData) {
    router.push("/training")
    return null
  }
  
  // Check if week is locked
  const isWeekLocked = weekId > currentProgress.week
  
  // Get days for this week (1-7)
  const days = Array.from({ length: 7 }, (_, i) => i + 1)
  
  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.push("/training")}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="ml-2">
              <h1 className="text-lg font-semibold text-gray-900">Week {weekId}: {weekData.title}</h1>
              <p className="text-xs text-gray-500">{weekData.description}</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Week Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {(() => {
            const weekTasks = days.flatMap(day => getTasksByDay(weekId, day))
            const weekCompleted = weekTasks.filter(t => completedTasks.some(c => c.taskId === t.id)).length
            const weekProgress = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0
            
            return (
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Week Progress</span>
                    <span className="text-sm font-medium text-teal-600">{weekProgress}%</span>
                  </div>
                  <Progress value={weekProgress} className="h-2" />
                  <div className="text-xs text-gray-500 mt-2">
                    {weekCompleted} of {weekTasks.length} tasks completed
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </motion.div>
        
        {/* Days Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Daily Training</h3>
          
          {days.map((day, index) => {
            const dayTasks = getTasksByDay(weekId, day)
            const dayStatus = getDayCompletionStatus(weekId, day, completedTasks)
            const isCurrentDay = weekId === currentProgress.week && day === currentProgress.day
            const isPastDay = weekId < currentProgress.week || (weekId === currentProgress.week && day < currentProgress.day)
            const isDayUnlocked = isTaskUnlocked(weekId, day)
            const theme = DAY_THEMES[weekId]?.[day] || `Day ${day}`
            
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`bg-white border-0 shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    isCurrentDay ? "ring-2 ring-teal-500" : ""
                  } ${!isDayUnlocked ? "opacity-60" : ""}`}
                  onClick={() => router.push(`/training/day/${weekId}/${day}`)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      {/* Day Status Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        dayStatus.isFullyCompleted ? "bg-green-100" :
                        isCurrentDay ? "bg-teal-100" :
                        isPastDay ? "bg-yellow-100" :
                        "bg-gray-100"
                      }`}>
                        {!isDayUnlocked ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : dayStatus.isFullyCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : isCurrentDay ? (
                          <Play className="w-4 h-4 text-teal-600" />
                        ) : isPastDay && dayStatus.completed > 0 ? (
                          <Circle className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <span className="text-sm font-semibold text-gray-500">{day}</span>
                        )}
                      </div>
                      
                      {/* Day Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">Day {day}</h4>
                          {isCurrentDay && (
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                          {dayStatus.isFullyCompleted && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Complete
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{theme}</p>
                        
                        {/* Tasks progress */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex gap-1">
                            {dayTasks.map((task, i) => (
                              <div
                                key={task.id}
                                className={`w-2 h-2 rounded-full ${
                                  completedTasks.some(c => c.taskId === task.id)
                                    ? "bg-green-500"
                                    : isDayUnlocked
                                    ? "bg-gray-300"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {dayStatus.completed}/{dayStatus.total} tasks
                          </span>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        {/* EI Stats Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">EI Stats Covered</h3>
          <div className="flex flex-wrap gap-2">
            {["Self-Awareness", "Self-Management", "Social Awareness", "Relationship Management", "Clinical Competence", "Resilience"].map(stat => (
              <span
                key={stat}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600"
              >
                {stat}
              </span>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
