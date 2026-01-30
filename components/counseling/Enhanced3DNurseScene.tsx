"use client"

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertTriangle } from 'lucide-react'
import { ThreeJSSceneManager } from './ThreeJSSceneManager'
import { useWebGLDetection } from '@/hooks/useWebGLDetection'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { StatusDisplay, EmotionIndicator } from './VisualFeedbackSystem'
import NurseScene from './NurseScene' // Fallback component

export type EmotionType = 'neutral' | 'happy' | 'sad' | 'thinking' | 'talking' |
  'listening' | 'hi' | 'yes' | 'no' | 'rest'

interface Enhanced3DNurseSceneProps {
  emotion?: EmotionType
  isTalking?: boolean
  onModelLoad?: () => void
  onError?: (error: Error) => void
  fallbackComponent?: React.ComponentType<any>
}

interface LoadingState {
  isLoading: boolean
  progress: number
  stage: string
}

interface ErrorState {
  hasError: boolean
  error: Error | null
  canRetry: boolean
}

export default function Enhanced3DNurseScene({
  emotion = 'neutral',
  isTalking = false,
  onModelLoad,
  onError,
  fallbackComponent: FallbackComponent = NurseScene
}: Enhanced3DNurseSceneProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    stage: 'Initializing 3D environment...'
  })

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    canRetry: true
  })

  const [use3D, setUse3D] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // WebGL detection
  const { isWebGLSupported, webGLError } = useWebGLDetection()

  // Performance monitoring
  const { fps, isPerformanceGood } = usePerformanceMonitor(canvasRef as React.RefObject<HTMLCanvasElement>)

  // Responsive scaling based on viewport
  const [viewportScale, setViewportScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      // Scale down on smaller screens
      if (width < 768) {
        setViewportScale(0.7) // Mobile
      } else if (width < 1024) {
        setViewportScale(0.9) // Tablet
      } else {
        setViewportScale(1.0) // Desktop
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // Handle WebGL support check
  useEffect(() => {
    if (!isWebGLSupported) {
      const error = new Error(webGLError || 'WebGL not supported')
      setErrorState({
        hasError: true,
        error,
        canRetry: false
      })
      setUse3D(false)
      onError?.(error)
    }
  }, [isWebGLSupported, webGLError, onError])

  // Handle model loading progress
  const handleLoadingProgress = useCallback((progress: number, stage: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      stage
    }))
  }, [])

  // Handle successful model load
  const handleModelLoad = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
      stage: 'Ready'
    }))
    onModelLoad?.()
  }, [onModelLoad])

  // Handle model load error
  const handleModelError = useCallback((error: Error) => {
    console.error('3D Model loading error:', error)
    setErrorState({
      hasError: true,
      error,
      canRetry: true
    })
    setUse3D(false)
    onError?.(error)
  }, [onError])

  // Retry loading
  const handleRetry = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      canRetry: true
    })
    setLoadingState({
      isLoading: true,
      progress: 0,
      stage: 'Retrying...'
    })
    setUse3D(true)
  }, [])

  // Performance degradation handling
  useEffect(() => {
    if (!isPerformanceGood && fps < 20) {
      console.warn('Performance degradation detected, considering fallback')
      // Could implement quality reduction here instead of full fallback
    }
  }, [isPerformanceGood, fps])

  // If we should use fallback (WebGL not supported or error occurred)
  if (!use3D || errorState.hasError) {
    return (
      <div className="relative w-full h-full">
        {/* Error overlay for retryable errors */}
        {errorState.hasError && errorState.canRetry && (
          <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
            <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">3D Model Loading Failed</h3>
            <p className="text-sm text-white/70 mb-4 text-center max-w-md">
              {errorState.error?.message || 'Unable to load 3D model'}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => setUse3D(false)}
              className="mt-2 px-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              Use 2D Mode
            </button>
          </div>
        )}

        {/* Fallback to 2D component */}
        <FallbackComponent emotion={emotion} isTalking={isTalking} />

        {/* WebGL not supported message */}
        {!isWebGLSupported && (
          <div className="absolute bottom-4 left-4 bg-amber-500/20 border border-amber-500/50 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-200">
              3D features unavailable - using 2D mode
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      <AnimatePresence mode="wait">
        {loadingState.isLoading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Loading 3D Nurse</p>
                <p className="text-sm text-white/70 mb-3">{loadingState.stage}</p>
                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingState.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-white/50 mt-2">{Math.round(loadingState.progress)}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance monitor (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-30 bg-black/50 rounded-lg px-3 py-2 text-xs text-white">
          <div>FPS: {fps}</div>
          <div className={isPerformanceGood ? 'text-green-400' : 'text-red-400'}>
            {isPerformanceGood ? 'Good' : 'Poor'}
          </div>
        </div>
      )}

      {/* 3D Canvas - OPTIMIZED FOR PERFORMANCE WITH MORE RESOURCES */}
      <Canvas
        ref={canvasRef}
        camera={{
          position: [0, 1.4, 3],
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{
          antialias: window.devicePixelRatio <= 2, // Enable AA on more devices
          alpha: true,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance",
          stencil: false, // Disable stencil buffer for better performance
          depth: true,
          precision: 'highp', // High precision for smoother rendering
          logarithmicDepthBuffer: false
        }}
        dpr={[1, 2]} // Limit pixel ratio to max 2 for performance
        frameloop="always" // Ensure continuous rendering
        performance={{ min: 0.5 }} // Allow more resources for smooth animations
        className="w-full h-full"
        onCreated={({ gl, scene }) => {
          // Optimize renderer settings
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          gl.autoClear = true
          gl.setClearColor(0x000000, 0)
          scene.background = null
          
          // Enable performance optimizations
          gl.shadowMap.enabled = false // Disable shadows for better performance
          gl.physicallyCorrectLights = false
          
          // Allocate more resources for smoother animations
          gl.capabilities.maxTextures = 16
        }}
      >
        <Suspense fallback={null}>
          <ThreeJSSceneManager
            emotion={emotion}
            isTalking={isTalking}
            viewportScale={viewportScale}
            onLoadingProgress={handleLoadingProgress}
            onModelLoad={handleModelLoad}
            onError={handleModelError}
          />
        </Suspense>
      </Canvas>

      {/* Visual Feedback Overlays */}
      <StatusDisplay
        emotion={emotion}
        isTalking={isTalking}
        isLoading={loadingState.isLoading}
      />

      <EmotionIndicator
        emotion={emotion}
        isTalking={isTalking}
      />
    </div>
  )
}