import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EmotionType } from './Enhanced3DNurseScene'

interface NurseModelProps {
  model: THREE.Object3D
  emotion: EmotionType
  isTalking: boolean
  headOrientation: { tilt: number; turn: number }
  viewportScale: number
}

// Emotion-based pose targets
const emotionTargets = {
  neutral: { tilt: 0, turn: 0, bob: 0.018 },
  happy: { tilt: -0.04, turn: 0.02, bob: 0.028 },
  sad: { tilt: 0.05, turn: 0, bob: 0.012 },
  thinking: { tilt: 0.02, turn: 0.04, bob: 0.015 },
  talking: { tilt: -0.02, turn: 0, bob: 0.03 },
  listening: { tilt: -0.03, turn: -0.03, bob: 0.02 },
  hi: { tilt: -0.05, turn: 0.03, bob: 0.03 },
  yes: { tilt: -0.01, turn: 0, bob: 0.02 },
  no: { tilt: 0.03, turn: -0.02, bob: 0.018 },
  rest: { tilt: 0, turn: 0, bob: 0.01 }
}

export function NurseModel({ model, emotion, isTalking, headOrientation, viewportScale }: NurseModelProps) {
  const modelRef = useRef<THREE.Object3D>(null)
  const expressionTargetsRef = useRef(emotionTargets.neutral)

  // Update expression targets when emotion changes
  useEffect(() => {
    expressionTargetsRef.current = emotionTargets[emotion]
  }, [emotion])

  // Update model reference when model changes
  useEffect(() => {
    if (modelRef.current && model) {
      // Copy the model's transform to our ref
      modelRef.current.copy(model)
    }
  }, [model])

  // Animation loop for head movement and breathing
  useFrame((state) => {
    if (!modelRef.current) return

    const targets = expressionTargetsRef.current
    const elapsed = state.clock.elapsedTime

    // Combine expression targets with pointer tracking
    const desiredTurn = targets.turn + headOrientation.turn
    const desiredTilt = targets.tilt + headOrientation.tilt

    // Base rotation: -90 degrees to face forward, plus dynamic turn
    const baseRotationY = -Math.PI / 2
    const targetY = baseRotationY + desiredTurn

    // Smooth interpolation to target rotation
    modelRef.current.rotation.y = THREE.MathUtils.lerp(
      modelRef.current.rotation.y,
      targetY,
      0.08
    )
    
    modelRef.current.rotation.x = THREE.MathUtils.lerp(
      modelRef.current.rotation.x,
      desiredTilt,
      0.08
    )

    // Breathing/idle animation (bob effect)
    const bobOffset = Math.sin(elapsed * 2.2) * targets.bob
    modelRef.current.position.y = 0.9 + bobOffset
  })

  return (
    <primitive
      ref={modelRef}
      object={model}
      scale={[1.8 * viewportScale, 1.8 * viewportScale, 1.8 * viewportScale]}
      position={[0, 0.9, 0]}
    />
  )
}