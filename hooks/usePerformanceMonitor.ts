import { useState, useEffect, useRef, RefObject } from 'react'

interface PerformanceMetrics {
  fps: number
  isPerformanceGood: boolean
  frameTime: number
  memoryUsage?: number
}

export function usePerformanceMonitor(canvasRef?: RefObject<HTMLCanvasElement>): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    isPerformanceGood: true,
    frameTime: 16.67
  })

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const frameTimesRef = useRef<number[]>([])
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const measurePerformance = () => {
      const now = performance.now()
      const deltaTime = now - lastTimeRef.current
      
      frameCountRef.current++
      frameTimesRef.current.push(deltaTime)
      
      // Keep only the last 60 frame times (1 second at 60fps)
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift()
      }

      // Update metrics every 30 frames (roughly every 0.5 seconds)
      if (frameCountRef.current % 30 === 0) {
        const frameTimes = frameTimesRef.current
        const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length
        const fps = Math.round(1000 / avgFrameTime)
        
        // Get memory usage if available
        let memoryUsage: number | undefined
        if ('memory' in performance) {
          const memory = (performance as any).memory
          memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
        }

        const isPerformanceGood = fps >= 30 && avgFrameTime <= 33.33 // 30fps threshold
        
        setMetrics({
          fps: Math.max(0, Math.min(120, fps)), // Clamp between 0-120
          isPerformanceGood,
          frameTime: avgFrameTime,
          memoryUsage
        })
      }

      lastTimeRef.current = now
      animationFrameRef.current = requestAnimationFrame(measurePerformance)
    }

    // Start monitoring
    animationFrameRef.current = requestAnimationFrame(measurePerformance)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Reset monitoring when canvas changes
  useEffect(() => {
    frameCountRef.current = 0
    frameTimesRef.current = []
    lastTimeRef.current = performance.now()
  }, [canvasRef])

  return metrics
}