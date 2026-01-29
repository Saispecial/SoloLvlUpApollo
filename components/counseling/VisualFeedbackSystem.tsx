import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EmotionType } from './Enhanced3DNurseScene'

interface VisualFeedbackSystemProps {
  emotion: EmotionType
  isTalking: boolean
  model: THREE.Object3D | null
  enableSyntheticEyes?: boolean
}

// Emotion state labels and eye colors
const emotionStates = {
  neutral: { label: 'Calm focus', eyeColor: 0x9bf7ff },
  happy: { label: 'Bright & caring', eyeColor: 0xffffff },
  sad: { label: 'Soft empathy', eyeColor: 0x92a8ff },
  thinking: { label: 'Analyzing signal', eyeColor: 0xffe6a7 },
  talking: { label: 'Speaking guidance', eyeColor: 0xaaf8ff },
  listening: { label: 'Listening closely', eyeColor: 0x7dd3fc },
  hi: { label: 'Warm hello', eyeColor: 0xffffff },
  yes: { label: 'Affirming nod', eyeColor: 0xb9f3ff },
  no: { label: 'Gentle decline', eyeColor: 0xffe3e3 },
  rest: { label: 'Steady reset', eyeColor: 0xbfe8ff }
}

interface EyeIndicator {
  mesh: THREE.Mesh
  home: THREE.Vector3
  material: THREE.MeshBasicMaterial
}

export function VisualFeedbackSystem({ 
  emotion, 
  isTalking, 
  model, 
  enableSyntheticEyes = false 
}: VisualFeedbackSystemProps) {
  const eyeIndicatorsRef = useRef<EyeIndicator[]>([])
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>(emotion)
  const blinkTimeoutRef = useRef<NodeJS.Timeout>()

  // Update current emotion
  useEffect(() => {
    setCurrentEmotion(emotion)
  }, [emotion])

  // Create synthetic eye indicators
  useEffect(() => {
    if (!model || !enableSyntheticEyes) return

    // Clear existing eyes
    eyeIndicatorsRef.current.forEach(({ mesh }) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh)
      }
      mesh.geometry.dispose()
      mesh.material.dispose()
    })
    eyeIndicatorsRef.current = []

    // Calculate eye positions based on model bounds
    const boundingBox = new THREE.Box3().setFromObject(model)
    const size = boundingBox.getSize(new THREE.Vector3())
    const min = boundingBox.min
    const max = boundingBox.max

    const eyeY = min.y + size.y * 0.62
    const eyeZ = max.z - size.z * 0.28
    const offsetX = Math.max(size.x * 0.16, 0.045)

    const eyePositions = [
      new THREE.Vector3(offsetX, eyeY, eyeZ),
      new THREE.Vector3(-offsetX, eyeY, eyeZ)
    ]

    // Create eye meshes
    const eyeGeometry = new THREE.SphereGeometry(0.028, 24, 24)

    eyePositions.forEach((position) => {
      const material = new THREE.MeshBasicMaterial({ 
        color: emotionStates[currentEmotion].eyeColor 
      })
      const eyeMesh = new THREE.Mesh(eyeGeometry, material)
      eyeMesh.position.copy(position)
      
      model.add(eyeMesh)
      
      eyeIndicatorsRef.current.push({
        mesh: eyeMesh,
        home: position.clone(),
        material
      })
    })

    // Start blinking animation
    startBlinkLoop()

    return () => {
      // Cleanup
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current)
      }
      eyeIndicatorsRef.current.forEach(({ mesh }) => {
        if (mesh.parent) {
          mesh.parent.remove(mesh)
        }
        mesh.geometry.dispose()
        mesh.material.dispose()
      })
      eyeIndicatorsRef.current = []
    }
  }, [model, enableSyntheticEyes, currentEmotion])

  // Update eye colors when emotion changes
  useEffect(() => {
    if (!enableSyntheticEyes) return

    const targetColor = emotionStates[currentEmotion].eyeColor
    
    eyeIndicatorsRef.current.forEach(({ material }) => {
      // Smooth color transition
      const currentColor = material.color
      const targetColorObj = new THREE.Color(targetColor)
      currentColor.lerp(targetColorObj, 0.3)
    })
  }, [currentEmotion, enableSyntheticEyes])

  // Blinking animation
  const startBlinkLoop = () => {
    if (!enableSyntheticEyes || eyeIndicatorsRef.current.length === 0) return

    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current)
    }

    blinkTimeoutRef.current = setTimeout(() => {
      // Blink animation
      eyeIndicatorsRef.current.forEach(({ mesh }) => {
        mesh.scale.set(1, 0.15, 1)
      })

      setTimeout(() => {
        eyeIndicatorsRef.current.forEach(({ mesh }) => {
          mesh.scale.set(1, 1, 1)
        })
        startBlinkLoop() // Schedule next blink
      }, 130)
    }, 2200 + Math.random() * 2000) // Random blink interval
  }

  // Animation frame updates
  useFrame((state) => {
    if (!enableSyntheticEyes) return

    // Subtle eye movement based on time
    const time = state.clock.elapsedTime
    const eyeMovement = Math.sin(time * 0.5) * 0.002

    eyeIndicatorsRef.current.forEach(({ mesh, home }, index) => {
      const direction = index === 0 ? 1 : -1
      mesh.position.x = home.x + eyeMovement * direction
      mesh.position.y = home.y + Math.sin(time * 0.3 + index) * 0.001
    })
  })

  return null // This component doesn't render anything directly
}

// Status display component for UI overlay
export function StatusDisplay({ 
  emotion, 
  isTalking, 
  isLoading 
}: { 
  emotion: EmotionType
  isTalking: boolean
  isLoading: boolean 
}) {
  const getStatusText = () => {
    if (isLoading) return "Analyzing..."
    if (isTalking) return "Synthesizing..."
    return "System Ready"
  }

  const getStatusColor = () => {
    if (isLoading) return "bg-amber-400 animate-pulse"
    if (isTalking) return "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
    return "bg-green-400"
  }

  const getEmotionLabel = () => {
    return emotionStates[emotion].label
  }

  return (
    <div className="absolute bottom-6 left-6 md:left-12 flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50">
          {getStatusText()}
        </span>
        <span className="text-[8px] uppercase tracking-[0.2em] text-white/30">
          {getEmotionLabel()}
        </span>
      </div>
    </div>
  )
}

// Emotion indicator component for UI overlay
export function EmotionIndicator({ 
  emotion, 
  isTalking 
}: { 
  emotion: EmotionType
  isTalking: boolean 
}) {
  const getEmotionColor = () => {
    const colors = {
      neutral: 'text-cyan-400',
      happy: 'text-green-400',
      sad: 'text-blue-400',
      thinking: 'text-amber-400',
      talking: 'text-cyan-300',
      listening: 'text-purple-400',
      hi: 'text-cyan-300',
      yes: 'text-green-300',
      no: 'text-red-300',
      rest: 'text-blue-300'
    }
    return colors[emotion] || 'text-white'
  }

  const getEmotionIcon = () => {
    const icons = {
      neutral: '🤖',
      happy: '😊',
      sad: '😔',
      thinking: '🤔',
      talking: '💬',
      listening: '👂',
      hi: '👋',
      yes: '✅',
      no: '❌',
      rest: '😌'
    }
    return icons[emotion] || '🤖'
  }

  return (
    <div className="absolute top-6 right-6 md:right-12 flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 backdrop-blur-sm">
      <span className="text-lg">{getEmotionIcon()}</span>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getEmotionColor()}`}>
          {emotionStates[emotion].label}
        </span>
        <span className="text-xs text-white/50 uppercase tracking-wider">
          {emotion}
        </span>
      </div>
      {isTalking && (
        <div className="flex gap-1 ml-2">
          <div className="w-1 h-3 bg-cyan-400 rounded animate-pulse"></div>
          <div className="w-1 h-3 bg-cyan-400 rounded animate-pulse delay-75"></div>
          <div className="w-1 h-3 bg-cyan-400 rounded animate-pulse delay-150"></div>
        </div>
      )}
    </div>
  )
}