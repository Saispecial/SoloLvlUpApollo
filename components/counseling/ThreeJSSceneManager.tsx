"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { EmotionType } from './Enhanced3DNurseScene'
import { useThreeJSModel } from '@/hooks/useThreeJSModel'
import { useAnimationController } from '@/hooks/useAnimationController'
import { useExternalAnimations } from '@/hooks/useExternalAnimations'
import { usePointerTracking } from '@/hooks/usePointerTracking'
import { LightingSystem } from './LightingSystem'
import { NurseModel } from './NurseModel'
import { VisualFeedbackSystem } from './VisualFeedbackSystem'

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
  onError
}: ThreeJSSceneManagerProps) {
  const { scene, camera, gl } = useThree()
  const controlsRef = useRef<any>()
  
  // Model loading state
  const {
    model,
    animations,
    mixer,
    isLoading,
    error,
    loadModel
  } = useThreeJSModel('/nurse+robot+3d+model.glb')

  // Animation control
  const {
    playAnimation,
    setEmotion: setAnimationEmotion,
    startTalkingLoop,
    stopTalkingLoop,
    playExternalAnimation,
    loadExternalAnimation,
    isExternalAnimationLoaded
  } = useAnimationController(mixer, animations)

  // External animations loading
  const {
    loadAllExternalAnimations,
    loadExternalAnimationByKey,
    isLoading: isLoadingExternalAnimations,
    loadedAnimations,
    failedAnimations,
    progress: externalAnimationsProgress
  } = useExternalAnimations({
    loadExternalAnimation,
    isExternalAnimationLoaded
  })

  // Pointer tracking for head movement
  const {
    pointerPosition,
    headOrientation,
    resetPointer
  } = usePointerTracking()

  // Handle loading progress
  useEffect(() => {
    if (isLoading) {
      onLoadingProgress(0, 'Loading 3D model...')
    } else if (isLoadingExternalAnimations) {
      onLoadingProgress(50 + (externalAnimationsProgress * 0.5), 'Loading external animations...')
    } else if (model && !error) {
      onLoadingProgress(100, 'Model loaded successfully')
      onModelLoad()
    }
  }, [isLoading, isLoadingExternalAnimations, externalAnimationsProgress, model, error, onLoadingProgress, onModelLoad])

  // Handle errors
  useEffect(() => {
    if (error) {
      onError(error)
    }
  }, [error, onError])

  // Handle emotion changes
  useEffect(() => {
    if (model && mixer) {
      // Check if this is a one-shot external animation
      const oneShotAnimations = ['hi', 'yes', 'no']
      if (oneShotAnimations.includes(emotion) && isExternalAnimationLoaded(emotion)) {
        playExternalAnimation(emotion, 'neutral')
      } else {
        setAnimationEmotion(emotion)
      }
    }
  }, [emotion, model, mixer, setAnimationEmotion, playExternalAnimation, isExternalAnimationLoaded])

  // Handle talking state changes
  useEffect(() => {
    if (!model || !mixer) return

    if (isTalking) {
      startTalkingLoop()
    } else {
      stopTalkingLoop()
    }
  }, [isTalking, model, mixer, startTalkingLoop, stopTalkingLoop])

  // Set up scene background
  useEffect(() => {
    scene.background = new THREE.Color(0x04060d)
  }, [scene])

  // Handle pointer events
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    
    // Update pointer tracking (this will be implemented in the hook)
    // For now, we'll just log the position
    console.log('Pointer position:', { x, y })
  }, [gl])

  const handlePointerLeave = useCallback(() => {
    resetPointer()
  }, [resetPointer])

  // Animation loop
  useFrame((state, delta) => {
    // Update animation mixer
    if (mixer) {
      mixer.update(delta)
    }

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update()
    }
  })

  return (
    <>
      {/* Camera and Controls */}
      <PerspectiveCamera
        makeDefault
        position={[0, 1.4, 3]}
        fov={50}
        near={0.1}
        far={100}
      />
      
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        target={[0, 1.25, 0]}
        minDistance={1.2}
        maxDistance={6}
      />

      {/* Lighting System */}
      <LightingSystem emotion={emotion} isTalking={isTalking} />

      {/* 3D Model */}
      {model && (
        <>
          <NurseModel
            model={model}
            emotion={emotion}
            isTalking={isTalking}
            headOrientation={headOrientation}
            viewportScale={viewportScale}
          />
          
          {/* Visual Feedback System (synthetic eyes, etc.) */}
          <VisualFeedbackSystem
            emotion={emotion}
            isTalking={isTalking}
            model={model}
            enableSyntheticEyes={false} // Can be made configurable
          />
        </>
      )}

      {/* Pointer event handlers */}
      <mesh
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        visible={false}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  )
}