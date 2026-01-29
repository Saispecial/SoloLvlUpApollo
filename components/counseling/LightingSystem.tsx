import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EmotionType } from './Enhanced3DNurseScene'

interface LightingSystemProps {
  emotion: EmotionType
  isTalking: boolean
}

// Enhanced emotion-based lighting configuration
const emotionStates = {
  neutral: { 
    color: 0x6be4ff, 
    intensity: 1.5, 
    ambientIntensity: 1.0,
    fillColor: 0xbad7ff,
    fillIntensity: 0.8
  },
  happy: { 
    color: 0xb3ffcb, 
    intensity: 1.8, 
    ambientIntensity: 1.2,
    fillColor: 0xe6ffed,
    fillIntensity: 1.0
  },
  sad: { 
    color: 0x88a5ff, 
    intensity: 1.2, 
    ambientIntensity: 0.8,
    fillColor: 0xa8c0ff,
    fillIntensity: 0.6
  },
  thinking: { 
    color: 0xf9cc58, 
    intensity: 1.6, 
    ambientIntensity: 1.1,
    fillColor: 0xffd98a,
    fillIntensity: 0.9
  },
  talking: { 
    color: 0x5be4ff, 
    intensity: 2.0, 
    ambientIntensity: 1.3,
    fillColor: 0x8ef0ff,
    fillIntensity: 1.1
  },
  listening: { 
    color: 0x35d4ff, 
    intensity: 1.4, 
    ambientIntensity: 1.0,
    fillColor: 0x7dd3fc,
    fillIntensity: 0.8
  },
  hi: { 
    color: 0xb7f5ff, 
    intensity: 1.9, 
    ambientIntensity: 1.3,
    fillColor: 0xdcfaff,
    fillIntensity: 1.2
  },
  yes: { 
    color: 0x9fe8ff, 
    intensity: 1.5, 
    ambientIntensity: 1.1,
    fillColor: 0xc4f1ff,
    fillIntensity: 0.9
  },
  no: { 
    color: 0xffd0d0, 
    intensity: 1.3, 
    ambientIntensity: 0.9,
    fillColor: 0xffe3e3,
    fillIntensity: 0.7
  },
  rest: { 
    color: 0x9fd7ff, 
    intensity: 1.1, 
    ambientIntensity: 0.8,
    fillColor: 0xc4e5ff,
    fillIntensity: 0.6
  }
}

export function LightingSystem({ emotion, isTalking }: LightingSystemProps) {
  const ambientLightRef = useRef<THREE.AmbientLight>(null)
  const mainLightRef = useRef<THREE.DirectionalLight>(null)
  const fillLightRef = useRef<THREE.DirectionalLight>(null)
  const rimLightRef = useRef<THREE.DirectionalLight>(null)
  const emotionLightRef = useRef<THREE.PointLight>(null)
  
  // State for smooth transitions
  const [currentState, setCurrentState] = useState(emotionStates[emotion])
  const [targetState, setTargetState] = useState(emotionStates[emotion])

  // Update target state when emotion changes
  useEffect(() => {
    setTargetState(emotionStates[emotion])
  }, [emotion])

  // Smooth transition between lighting states
  useFrame((state, delta) => {
    // Lerp current state towards target state
    const lerpFactor = delta * 2 // Adjust speed of transitions
    
    setCurrentState(prev => ({
      color: THREE.MathUtils.lerpColors(
        new THREE.Color(prev.color),
        new THREE.Color(targetState.color),
        lerpFactor
      ).getHex(),
      intensity: THREE.MathUtils.lerp(prev.intensity, targetState.intensity, lerpFactor),
      ambientIntensity: THREE.MathUtils.lerp(prev.ambientIntensity, targetState.ambientIntensity, lerpFactor),
      fillColor: THREE.MathUtils.lerpColors(
        new THREE.Color(prev.fillColor),
        new THREE.Color(targetState.fillColor),
        lerpFactor
      ).getHex(),
      fillIntensity: THREE.MathUtils.lerp(prev.fillIntensity, targetState.fillIntensity, lerpFactor)
    }))

    // Apply current state to lights
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = currentState.ambientIntensity
    }

    if (fillLightRef.current) {
      fillLightRef.current.color.setHex(currentState.fillColor)
      fillLightRef.current.intensity = currentState.fillIntensity
    }

    if (emotionLightRef.current) {
      emotionLightRef.current.color.setHex(currentState.color)
      
      if (isTalking) {
        // Enhanced talking effects with multiple pulse patterns
        const time = state.clock.elapsedTime
        const primaryPulse = Math.sin(time * 8) * 0.5 + 0.5 // Fast pulse
        const secondaryPulse = Math.sin(time * 3) * 0.3 + 0.7 // Slower pulse
        const combinedPulse = (primaryPulse + secondaryPulse) / 2
        
        emotionLightRef.current.intensity = currentState.intensity + combinedPulse * 1.5
        
        // Ensure talking color override
        emotionLightRef.current.color.setHex(0x5be4ff)
      } else {
        // Subtle breathing effect when not talking
        const breathe = Math.sin(time * 2.2) * 0.1 + 0.9
        emotionLightRef.current.intensity = currentState.intensity * breathe
      }
    }

    // Dynamic rim light based on emotion intensity
    if (rimLightRef.current) {
      const rimIntensity = 0.6 + (currentState.intensity - 1.0) * 0.2
      rimLightRef.current.intensity = Math.max(0.3, Math.min(1.0, rimIntensity))
    }
  })

  return (
    <>
      {/* Enhanced ambient light with emotion-based intensity */}
      <ambientLight
        ref={ambientLightRef}
        color={0xffffff}
        intensity={currentState.ambientIntensity}
      />

      {/* Main directional light (key light) - slightly warmer */}
      <directionalLight
        ref={mainLightRef}
        color={0xfff8e1}
        intensity={1.5}
        position={[2, 3, 2]}
        castShadow={false}
      />

      {/* Emotion-responsive fill light */}
      <directionalLight
        ref={fillLightRef}
        color={currentState.fillColor}
        intensity={currentState.fillIntensity}
        position={[-2, 2, 1]}
      />

      {/* Dynamic rim light for depth and drama */}
      <directionalLight
        ref={rimLightRef}
        color={0xffffff}
        intensity={0.6}
        position={[0, 2, -2]}
      />

      {/* Primary emotion-based point light with enhanced effects */}
      <pointLight
        ref={emotionLightRef}
        color={currentState.color}
        intensity={currentState.intensity}
        position={[0, 1.6, 1.5]}
        distance={12}
        decay={2}
      />

      {/* Additional accent lights for specific emotions */}
      {emotion === 'happy' && (
        <pointLight
          color={0xffeb3b}
          intensity={0.5}
          position={[1, 2, 0.5]}
          distance={8}
          decay={2}
        />
      )}

      {emotion === 'thinking' && (
        <spotLight
          color={0xffc107}
          intensity={0.8}
          position={[0, 3, 1]}
          angle={Math.PI / 6}
          penumbra={0.5}
          distance={10}
          decay={2}
        />
      )}

      {emotion === 'sad' && (
        <pointLight
          color={0x3f51b5}
          intensity={0.3}
          position={[-1, 1, 2]}
          distance={6}
          decay={2}
        />
      )}
    </>
  )
}