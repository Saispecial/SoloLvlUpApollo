import { useState, useCallback, useRef, useEffect } from 'react'

interface PointerTrackingResult {
  pointerPosition: { x: number; y: number }
  headOrientation: { tilt: number; turn: number }
  resetPointer: () => void
  updatePointer: (x: number, y: number) => void
}

export function usePointerTracking(): PointerTrackingResult {
  const [pointerPosition, setPointerPosition] = useState({ x: 0.5, y: 0.5 })
  const [headOrientation, setHeadOrientation] = useState({ tilt: 0, turn: 0 })
  
  const targetOrientationRef = useRef({ tilt: 0, turn: 0 })
  const animationFrameRef = useRef<number>()

  // Smooth interpolation to target orientation
  useEffect(() => {
    const updateOrientation = () => {
      setHeadOrientation(current => {
        const target = targetOrientationRef.current
        const lerpFactor = 0.06 // Smooth interpolation factor
        
        const newTilt = current.tilt + (target.tilt - current.tilt) * lerpFactor
        const newTurn = current.turn + (target.turn - current.turn) * lerpFactor
        
        // Clamp values to reasonable ranges
        const clampedTilt = Math.max(-0.25, Math.min(0.25, newTilt))
        const clampedTurn = Math.max(-0.35, Math.min(0.35, newTurn))
        
        return {
          tilt: clampedTilt,
          turn: clampedTurn
        }
      })
      
      animationFrameRef.current = requestAnimationFrame(updateOrientation)
    }
    
    animationFrameRef.current = requestAnimationFrame(updateOrientation)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Update pointer position and calculate head orientation
  const updatePointer = useCallback((x: number, y: number) => {
    // Normalize coordinates to 0-1 range
    const normalizedX = Math.max(0, Math.min(1, x))
    const normalizedY = Math.max(0, Math.min(1, y))
    
    setPointerPosition({ x: normalizedX, y: normalizedY })
    
    // Calculate head orientation based on pointer position
    // Convert from 0-1 range to -0.5 to 0.5 range, then scale
    const centerX = normalizedX - 0.5
    const centerY = 0.5 - normalizedY // Invert Y for natural head movement
    
    // Scale the movement with some limits
    const targetTurn = centerX * 0.6 // Max 0.3 radians turn
    const targetTilt = centerY * 0.4 // Max 0.2 radians tilt
    
    targetOrientationRef.current = {
      tilt: Math.max(-0.25, Math.min(0.25, targetTilt)),
      turn: Math.max(-0.3, Math.min(0.3, targetTurn))
    }
  }, [])

  // Reset pointer to center and head to neutral
  const resetPointer = useCallback(() => {
    setPointerPosition({ x: 0.5, y: 0.5 })
    targetOrientationRef.current = { tilt: 0, turn: 0 }
  }, [])

  return {
    pointerPosition,
    headOrientation,
    resetPointer,
    updatePointer
  }
}