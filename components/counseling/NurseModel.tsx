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
  flyDirection?: 'left' | 'right' | 'center'
  opacity?: number
}

interface NurseModelProps {
  model: THREE.Object3D
  emotion: EmotionType
  isTalking: boolean
  headOrientation: { tilt: number; turn: number }
  viewportScale: number
  flyDirection?: 'left' | 'right' | 'center'
  opacity?: number
}

// ... emotionTargets constant remains same ...
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

export function NurseModel({
  model,
  emotion,
  isTalking,
  headOrientation,
  viewportScale,
  flyDirection = 'center',
  opacity = 1
}: NurseModelProps) {
  const modelRef = useRef<THREE.Object3D>(null)
  const expressionTargetsRef = useRef(emotionTargets.neutral)
  const targetBodyRotationY = useRef(-Math.PI / 2) // Default base rotation

  // Update material opacity
  useEffect(() => {
    if (model) {
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

          materials.forEach((mat) => {
            mat.transparent = true // Always set transparent to allow fade
            mat.opacity = opacity
          })
        }
      })
    }
  }, [model, opacity])

  // Update expression targets when emotion changes
  useEffect(() => {
    expressionTargetsRef.current = emotionTargets[emotion]
  }, [emotion])

  // Calculate target rotation based on fly direction
  useEffect(() => {
    // Base rotation is -90 degrees (-PI/2) to face camera
    const base = -Math.PI / 2
    switch (flyDirection) {
      case 'left':
        targetBodyRotationY.current = base + (Math.PI / 4) // Face Left (+45deg relative to base)
        break
      case 'right':
        targetBodyRotationY.current = base - (Math.PI / 4) // Face Right (-45deg relative to base)
        break
      case 'center':
      default:
        targetBodyRotationY.current = base
    }
  }, [flyDirection])

  // Redundant copy removed - primitive object={model} already handles the model reference
  // We only need to ensure the ref is assigned for rotation manipulation
  useEffect(() => {
    if (modelRef.current && model) {
      // Ensure initial rotation is set correctly if mounting fresh
      modelRef.current.rotation.order = 'XYZ'
    }
  }, [model])

  // Animation loop for head movement and breathing
  useFrame((state, delta) => {
    if (!modelRef.current) return

    const targets = expressionTargetsRef.current
    const elapsed = state.clock.elapsedTime

    // Combine expression targets with pointer tracking
    const desiredTurn = targets.turn + headOrientation.turn
    const desiredTilt = targets.tilt + headOrientation.tilt

    // Smoothly rotate body to target direction (flyDirection)
    // We blend the "Body Turn" with the "Head Turn" (which acts as a modifier)
    // Note: headOrientation.turn is usually small (-0.5 to 0.5).
    // We apply the body rotation primarily.

    modelRef.current.rotation.y = THREE.MathUtils.damp(
      modelRef.current.rotation.y,
      targetBodyRotationY.current + desiredTurn,
      4, // Smoothness speed
      delta
    )

    modelRef.current.rotation.x = THREE.MathUtils.damp(
      modelRef.current.rotation.x,
      desiredTilt, // Head tilt affects whole body pitch slightly
      4,
      delta
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