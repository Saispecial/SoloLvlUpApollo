"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  useTrainingStore, 
  getTasksByDay,
  DAY_THEMES,
  EI_STAT_COLORS
} from "@/stores/training-store"
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  CheckCircle2,
  Play,
  Video,
  ListChecks,
  Brain,
  Target,
  ArrowRight
} from "lucide-react"

function DayTaskViewContent() {
  const params = useParams()
  const weekId = Number.parseInt(params.week as string)
  const dayId = Number.parseInt(params.day as string)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const { 
    courseStartDate,
    getCurrentWeekDay, 
    completedTasks,
    isTaskUnlocked,
    isTaskCompleted,
    completeTask
  } = useTrainingStore()
  
  const [mounted, setMounted] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  
  useEffect(() => {
    setMounted(true)
    
    // Check for completion status from URL
    const status = searchParams.get("status")
    const taskId = searchParams.get("taskId")
    if (status === "completed" && taskId) {
      // Mark task as completed
      completeTask({
        taskId,
        toolUsed: true
      })
    }
  }, [searchParams, completeTask])
  
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
  const dayTasks = getTasksByDay(weekId, dayId)
  const theme = DAY_THEMES[weekId]?.[dayId] || `Day ${dayId}`
  const isDayUnlocked = isTaskUnlocked(weekId, dayId)
  const isCurrentDay = weekId === currentProgress.week && dayId === currentProgress.day
  const isPastDay = weekId < currentProgress.week || (weekId === currentProgress.week && dayId < currentProgress.day)
  
  // Get selected task details
  const activeTask = selectedTask ? dayTasks.find(t => t.id === selectedTask) : null
  
  const handleStartTask = (taskId: string, toolRoute: string) => {
    // Redirect to tool with source=training flag
    const returnUrl = `/training/day/${weekId}/${dayId}?status=completed&taskId=${taskId}`
    router.push(`${toolRoute}?source=training&taskId=${taskId}&returnUrl=${encodeURIComponent(returnUrl)}`)
  }
  
  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.push(`/training/week/${weekId}`)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="ml-2">
              <h1 className="text-lg font-semibold text-gray-900">Week {weekId}, Day {dayId}</h1>
              <p className="text-xs text-gray-500">{theme}</p>
            </div>
          </div>
          {isCurrentDay && (
            <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
              Active Day
            </span>
          )}
          {!isDayUnlocked && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Day Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{theme}</h2>
                  <p className="text-sm text-gray-500">
                    {dayTasks.length} training tasks covering 6 EI dimensions
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-teal-600">
                    {dayTasks.filter(t => isTaskCompleted(t.id)).length}/{dayTasks.length}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Task List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Training Tasks</h3>
          
          {dayTasks.map((task, index) => {
            const isCompleted = isTaskCompleted(task.id)
            const isSelected = selectedTask === task.id
            const colorClasses = EI_STAT_COLORS[task.eiStat] || "text-gray-600 bg-gray-50"
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`bg-white border-0 shadow-sm overflow-hidden transition-all ${
                    isSelected ? "ring-2 ring-teal-500" : ""
                  } ${isCompleted ? "bg-green-50/50" : ""}`}
                >
                  <CardContent className="p-0">
                    {/* Task Header - Always Visible */}
                    <div 
                      className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedTask(isSelected ? null : task.id)}
                    >
                      {/* Status Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        isCompleted ? "bg-green-100" : "bg-gray-100"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Brain className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Task Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses}`}>
                            {task.eiStat}
                          </span>
                          {task.video && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 flex items-center gap-1">
                              <Video className="w-3 h-3" /> Video
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mt-1">{task.focus}</h4>
                        <p className="text-sm text-gray-500">Tool: {task.tool}</p>
                      </div>
                      
                      {/* Expand/Collapse */}
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                    </div>
                    
                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                            {/* Video (if present) */}
                            {task.video && (
                              <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Video className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-medium text-purple-900">Video Content</span>
                                </div>
                                <p className="text-sm text-purple-700">{task.video.intent}</p>
                                <p className="text-xs text-purple-500 mt-1">(Video will play when available)</p>
                              </div>
                            )}
                            
                            {/* Core Flow */}
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <ListChecks className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-900">Core Flow</span>
                              </div>
                              <ol className="space-y-2">
                                {task.coreFlow.map((step, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center flex-shrink-0">
                                      {i + 1}
                                    </span>
                                    <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                            
                            {/* Start Task Button */}
                            {isDayUnlocked && !isCompleted && (
                              <Button 
                                className="btn-primary w-full"
                                onClick={() => handleStartTask(task.id, task.toolRoute)}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Task
                              </Button>
                            )}
                            
                            {isCompleted && (
                              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-700">Task Completed</span>
                              </div>
                            )}
                            
                            {!isDayUnlocked && (
                              <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <Lock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">Unlocks on the scheduled day</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-between"
        >
          {dayId > 1 && (
            <Button
              variant="outline"
              onClick={() => router.push(`/training/day/${weekId}/${dayId - 1}`)}
              className="bg-transparent"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Day {dayId - 1}
            </Button>
          )}
          {dayId < 7 && (
            <Button
              variant="outline"
              onClick={() => router.push(`/training/day/${weekId}/${dayId + 1}`)}
              className="ml-auto bg-transparent"
            >
              Day {dayId + 1}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default function DayTaskViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center"><div className="animate-pulse text-teal-600">Loading...</div></div>}>
      <DayTaskViewContent />
    </Suspense>
  )
}
