"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Award, Sparkles, X, Download } from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import confetti from "canvas-confetti"

interface ProgramCompletionCelebrationProps {
  programId: string
  programName: string
  onClose: () => void
}

export function ProgramCompletionCelebration({ 
  programId, 
  programName, 
  onClose 
}: ProgramCompletionCelebrationProps) {
  const { nurse, getProgramModules } = useAppStore()
  const [showCelebration, setShowCelebration] = useState(true)
  
  const programModules = getProgramModules(programId)
  const completedModules = programModules.filter(m => m.completed)
  const totalEIPoints = completedModules.reduce((sum, m) => sum + (m.eiPoints || m.xp || 0), 0)
  
  // Calculate competency improvements
  const competencyGains = completedModules.reduce((acc, module) => {
    const boosts = module.competencyBoosts || module.statBoosts || {}
    Object.entries(boosts).forEach(([competency, boost]) => {
      if (boost && boost > 0) {
        acc[competency] = (acc[competency] || 0) + boost
      }
    })
    return acc
  }, {} as Record<string, number>)
  
  // Fire confetti on mount
  useEffect(() => {
    const fireConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
    
    fireConfetti()
    const interval = setInterval(fireConfetti, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const handleClose = () => {
    setShowCelebration(false)
    setTimeout(onClose, 300)
  }
  
  const handleDownloadCertificate = () => {
    // Create a simple certificate data
    const certificate = {
      nurseName: nurse.name,
      programName,
      completionDate: new Date().toLocaleDateString(),
      modulesCompleted: completedModules.length,
      totalEIPoints,
      competencyGains,
      certificateId: `${programId}-${Date.now()}`,
    }
    
    const jsonString = JSON.stringify(certificate, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `EI_Program_Certificate_${programName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Card className="max-w-md w-full bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4">
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="absolute top-8 right-8">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
                <div className="absolute bottom-8 left-8">
                  <Award className="w-10 h-10 text-yellow-600" />
                </div>
                <div className="absolute bottom-4 right-4">
                  <Trophy className="w-12 h-12 text-orange-600" />
                </div>
              </div>
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
              
              <CardContent className="p-8 text-center relative">
                {/* Trophy icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6"
                >
                  <Trophy className="w-10 h-10 text-white" />
                </motion.div>
                
                {/* Congratulations text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    🎉 Congratulations!
                  </h2>
                  <p className="text-lg text-gray-700 mb-4">
                    You've completed the
                  </p>
                  <h3 className="text-xl font-semibold text-orange-700 mb-6">
                    {programName}
                  </h3>
                </motion.div>
                
                {/* Achievement stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4 mb-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {completedModules.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        Modules Completed
                      </div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {totalEIPoints}
                      </div>
                      <div className="text-sm text-gray-600">
                        EI Points Earned
                      </div>
                    </div>
                  </div>
                  
                  {/* Competency improvements */}
                  {Object.keys(competencyGains).length > 0 && (
                    <div className="bg-white/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Competency Improvements
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(competencyGains).map(([competency, gain]) => (
                          <Badge 
                            key={competency} 
                            variant="outline" 
                            className="text-xs bg-blue-50 text-blue-700"
                          >
                            {competency} +{gain}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
                
                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={handleDownloadCertificate}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Certificate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="w-full"
                  >
                    Continue Learning
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to check for program completion
export function useProgramCompletionCheck() {
  const { nurse, getProgramModules } = useAppStore()
  const [completedProgram, setCompletedProgram] = useState<{
    programId: string
    programName: string
  } | null>(null)
  
  useEffect(() => {
    if (!nurse.activeProgramId) return
    
    const programModules = getProgramModules()
    const completedModules = programModules.filter(m => m.completed)
    const totalModules = programModules.length
    
    // Check if program just completed (100% completion)
    if (totalModules > 0 && completedModules.length === totalModules) {
      const programNames: Record<string, string> = {
        'intensive-6week': '6-Week Intensive EI Development',
        'focused-4week': '4-Week Focused EI Training',
        'maintenance-2week': '2-Week EI Maintenance',
        'balanced-5week': '5-Week Balanced EI Program',
        'advanced-4week': '4-Week Advanced EI Mastery'
      }
      
      const programName = programNames[nurse.activeProgramId] || 'EI Development Program'
      
      // Check if we haven't already shown celebration for this program
      const celebrationKey = `celebration-${nurse.activeProgramId}`
      const hasShownCelebration = localStorage.getItem(celebrationKey)
      
      if (!hasShownCelebration) {
        setCompletedProgram({
          programId: nurse.activeProgramId,
          programName
        })
        localStorage.setItem(celebrationKey, 'true')
      }
    }
  }, [nurse.activeProgramId, getProgramModules])
  
  const clearCelebration = () => {
    setCompletedProgram(null)
  }
  
  return { completedProgram, clearCelebration }
}
