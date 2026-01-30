import React, { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ExternalNurseModelProps {
    scene: THREE.Group
    animations: THREE.AnimationClip[]
    onComplete?: () => void
    viewportScale?: number
    opacity?: number
}

export function ExternalNurseModel({
    scene,
    animations,
    onComplete,
    viewportScale = 1,
    opacity = 1
}: ExternalNurseModelProps) {
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)

    // Initialize mixer and play animation
    useEffect(() => {
        if (!scene || !animations || animations.length === 0) return

        // Setup mixer
        const mixer = new THREE.AnimationMixer(scene)
        mixerRef.current = mixer

        // Configure animation
        const clip = animations[0] // Assuming one main animation per file

        // Filter tracks like in app.js reference to avoid root motion issues
        clip.tracks = clip.tracks.filter(track => {
            const isPosition = track.name.endsWith('.position');
            const isRotation = track.name.endsWith('.quaternion');
            const isRootNode = /^(Hips|Root|mixamorigHips|Character)/i.test(track.name);

            if (isPosition) return false;
            if (isRotation && isRootNode) return false;

            return true;
        });

        const action = mixer.clipAction(clip)
        action.reset()
        action.clampWhenFinished = true
        action.setLoop(THREE.LoopOnce, 1)

        // Fluent settings from app.js
        action.timeScale = 1.0
        action.fadeIn(0.3)
        action.play()

        // --- SAFETY RUNNER / TIMER ---
        // Ensures animation never "stucks" if event misses
        let isCompleted = false
        const safetyDuration = (clip.duration * 1000) + 100 // clip duration (ms) + 100ms buffer

        const triggerComplete = () => {
            if (isCompleted) return
            isCompleted = true
            console.log('Animation completed via trigger')
            if (onComplete) onComplete()
        }

        // 1. Listen for standard finish event
        const handleFinished = (e: any) => {
            triggerComplete()
        }
        mixer.addEventListener('finished', handleFinished)

        // 2. Fallback Timer ("Runner")
        const safetyTimer = setTimeout(() => {
            if (!isCompleted) {
                console.log(`Safety timer triggered completion for external animation (${safetyDuration}ms)`)
                triggerComplete()
            }
        }, safetyDuration)

        return () => {
            clearTimeout(safetyTimer)
            mixer.removeEventListener('finished', handleFinished)
            mixer.stopAllAction()
        }
    }, [scene, animations, onComplete])

    // Animation Loop
    useFrame((_, delta) => {
        if (mixerRef.current) {
            mixerRef.current.update(delta)
        }
    })

    // Apply materials and opacity
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.visible = true
                child.frustumCulled = false
                const mesh = child as THREE.Mesh
                if (mesh.material) {
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                    materials.forEach(mat => {
                        mat.transparent = true // Always set true to support opacity prop
                        mat.opacity = opacity
                    })
                }
            }
        })
    }, [scene, opacity])

    // Apply transforms matching app.js
    const BASE_SCALE = 180.0

    return (
        <primitive
            object={scene}
            scale={[BASE_SCALE * viewportScale, BASE_SCALE * viewportScale, BASE_SCALE * viewportScale]}
            position={[0, 0.9, 0]}
            rotation={[0, -Math.PI / 2, 0]}
        />
    )
}
