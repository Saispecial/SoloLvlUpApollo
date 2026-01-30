"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { EmotionType } from './Enhanced3DNurseScene'
import { useThreeJSModel } from '@/hooks/useThreeJSModel'
import { useAnimationController } from '@/hooks/useAnimationController'
import { usePointerTracking } from '@/hooks/usePointerTracking'
import { LightingSystem } from './LightingSystem'
import { NurseModel } from './NurseModel'
import { GLBAnimationRunner } from './GLBAnimationRunner'
import { VisualFeedbackSystem } from './VisualFeedbackSystem'
// Note: We are bypassing useExternalModelManager in favor of direct local state for simpler exclusive switching

interface ThreeJSSceneManagerProps {
  emotion: EmotionType
  isTalking: boolean
  viewportScale: number
  onLoadingProgress: (progress: number, stage: string) => void
  onModelLoad: () => void
  onError: (error: Error) => void
}

export function ThreeJSSceneManager({
  emotion,
  isTalking,
  viewportScale,
  onLoadingProgress,
  onModelLoad,
  onError,
  flyDirection = 'center'
}: ThreeJSSceneManagerProps & { flyDirection?: 'left' | 'right' | 'center' }) {
  const { scene, camera, gl } = useThree()
  const controlsRef = useRef<any>(null)

  // Internal Logic:
  // If emotion is in [hi, yes, no], we switch to EXTERNAL MODE.
  // In EXTERNAL MODE, we render GLBAnimationRunner.
  // When runner completes, we switch back to INTERNAL MODE.

  const [externalAnimKey, setExternalAnimKey] = useState<string | null>(null)

  // Model loading state (Main Model)
  const {
    model,
    animations,
    mixer,
    isLoading,
    error,
    loadModel
  } = useThreeJSModel('/nurse+robot+3d+model.glb')

  // Animation control (internal)
  const {
    playAnimation,
    setEmotion: setAnimationEmotion,
    startTalkingLoop,
    stopTalkingLoop,
  } = useAnimationController(mixer, animations)

  // Pointer tracking
  const {
    pointerPosition,
    headOrientation,
    resetPointer
  } = usePointerTracking()

  // Handle loading progress
  useEffect(() => {
    if (isLoading) {
      onLoadingProgress(0, 'Loading 3D model...')
    } else if (model && !error) {
      onLoadingProgress(100, 'Model loaded successfully')
      onModelLoad()
    }
  }, [isLoading, model, error, onLoadingProgress, onModelLoad])

  // Handle errors
  useEffect(() => {
    if (error) onError(error)
  }, [error, onError])

  // WATCH EMOTION CHANGES -> TRIGGER EXTERNAL
  useEffect(() => {
    const oneShotExternal = ['hi', 'yes', 'no', 'talking 1', 'talking 2']
    if (oneShotExternal.includes(emotion)) {
      // Trigger External
      setExternalAnimKey(emotion)
    } else {
      // Normal internal emotion
      if (!externalAnimKey) {
        setAnimationEmotion(emotion)
      }
    }
  }, [emotion, setAnimationEmotion])

  // TALKING LOGIC
  useEffect(() => {
    if (!model || !mixer) return
    if (isTalking) {
      startTalkingLoop()
    } else {
      stopTalkingLoop()
    }
  }, [isTalking, model, mixer, startTalkingLoop, stopTalkingLoop])

  // Animation loop (Main Model mixer) - OPTIMIZED
  useFrame((state, delta) => {
    // Cap delta to prevent large jumps
    const cappedDelta = Math.min(delta, 0.1)
    
    // Only update main mixer if we are NOT playing external
    if (!externalAnimKey && mixer) {
      mixer.update(cappedDelta)
    }
    if (controlsRef.current) controlsRef.current.update()
  })

  // Set scene bg
  useEffect(() => { scene.background = null }, [scene])

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    // No-op for now
  }, [])
  const handlePointerLeave = useCallback(() => { resetPointer() }, [resetPointer])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.4, 3]} fov={50} near={0.1} far={100} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        target={[0, 1.25, 0]}
        minDistance={1.2}
        maxDistance={6}
      />
      <LightingSystem emotion={emotion} isTalking={isTalking} />

      {/* STRICT EXCLUSIVE RENDERING */}
      {externalAnimKey ? (
        // RENDER ONLY RUNNER
        <GLBAnimationRunner
          animationKey={externalAnimKey}
          viewportScale={viewportScale}
          onComplete={() => {
            setExternalAnimKey(null)
            setAnimationEmotion('neutral')
          }}
        />
      ) : (
        // RENDER MAIN MODEL
        model && (
          <>
            <NurseModel
              model={model}
              emotion={emotion}
              isTalking={isTalking}
              headOrientation={headOrientation}
              viewportScale={viewportScale}
              flyDirection={flyDirection}
              opacity={1}
            />
            <VisualFeedbackSystem
              emotion={emotion}
              isTalking={isTalking}
              model={model}
              enableSyntheticEyes={false}
            />
          </>
        )
      )}

      <mesh position={[0, 0, 0]} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} visible={false}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  )
}
