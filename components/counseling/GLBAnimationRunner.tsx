import React, { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

interface GLBAnimationRunnerProps {
    animationKey: string
    onComplete: () => void
    viewportScale?: number
}

// Map keys to filenames as per strict reference
const FILENAME_MAP: Record<string, string> = {
    'hi': 'hi.glb',
    'yes': 'Head Nod Yes.glb',
    'no': 'No.glb',
    'talking 1': 'Talking 1.glb',
    'talking 2': 'Talking 2.glb',
    'rest': 'rest.glb'
}

export function GLBAnimationRunner({
    animationKey,
    onComplete,
    viewportScale = 1
}: GLBAnimationRunnerProps) {
    const [scene, setScene] = useState<THREE.Group | null>(null)
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)
    const completedRef = useRef(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Clone helper to avoid shared state issues
    const cloneScene = (source: THREE.Group) => {
        return SkeletonUtils.clone(source)
    }

    useEffect(() => {
        let active = true
        completedRef.current = false
        
        const filename = FILENAME_MAP[animationKey.toLowerCase()]
        if (!filename) {
            console.warn(`No mapping for animation: ${animationKey}`)
            onComplete()
            return
        }

        const loader = new GLTFLoader()
        loader.load(`/${filename}`, (gltf) => {
            if (!active) return

            // Logic from nurse3d.js: Prepare Off-Scene
            const newModel = cloneScene(gltf.scene)

            // Cleanup materials/meshes - OPTIMIZED
            newModel.traverse((c) => {
                if ((c as THREE.Mesh).isMesh) {
                    const mesh = c as THREE.Mesh
                    const n = mesh.name.toLowerCase()
                    // Hide eyes/floor etc
                    mesh.visible = !n.includes('eye') && !n.includes('floor') && !n.includes('plane')
                    mesh.frustumCulled = true // Enable frustum culling for performance
                    mesh.castShadow = false
                    mesh.receiveShadow = false

                    if (mesh.material) {
                        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                        mats.forEach(m => {
                            m.transparent = false
                            m.opacity = 1.0
                            // Optimize material for performance
                            if ('needsUpdate' in m) {
                                m.needsUpdate = false
                            }
                        })
                    }
                }
            })

            // Setup Mixer
            const mixer = new THREE.AnimationMixer(newModel)
            mixerRef.current = mixer

            // Find Clip
            const clips = gltf.animations
            let clip = THREE.AnimationClip.findByName(clips, animationKey) || clips[0]

            if (clip) {
                // FILTER TRACKS (Critical from reference) - OPTIMIZED
                clip.tracks = clip.tracks.filter(track => {
                    const n = track.name.toLowerCase()
                    // Remove position tracks to prevent movement
                    if (track.name.endsWith('.position')) return false
                    
                    // Lock base/legs to prevent walking
                    const baseLock = ['leg', 'knee', 'foot', 'toe', 'hips', 'root']
                    if (baseLock.some(kw => n.includes(kw))) return false
                    
                    // Lock body parts that shouldn't move
                    const bodyLock = ['spine', 'clavicle', 'armpit', 'scapula', 'shoulder_base']
                    if (bodyLock.some(kw => n.includes(kw))) return false
                    
                    // Remove root rotation
                    if (track.name.endsWith('.quaternion') && /^(Hips|Root|mixamorigHips|Character)/i.test(track.name)) return false
                    
                    return true
                })

                // Optimize clip
                clip.optimize()

                const action = mixer.clipAction(clip)
                action.reset()
                action.setLoop(THREE.LoopOnce, 1)
                action.clampWhenFinished = true
                action.timeScale = 0.95 // Slightly slower for smoother playback
                action.fadeIn(0.4) // INCREASED fade-in for smoother start
                action.play()

                // Safety Timer with cleanup - INCREASED BUFFER
                const durationMs = (clip.duration * 1000) + 500 // INCREASED buffer from 200ms to 500ms
                timeoutRef.current = setTimeout(() => {
                    if (active && !completedRef.current) {
                        completedRef.current = true
                        onComplete()
                    }
                }, durationMs)
            } else {
                onComplete()
            }

            setScene(newModel)
        }, undefined, (error) => {
            console.error(`Failed to load ${filename}:`, error)
            if (active) {
                onComplete()
            }
        })

        return () => {
            active = false
            completedRef.current = true
            
            // Clean up timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            
            // Clean up mixer
            if (mixerRef.current) {
                mixerRef.current.stopAllAction()
                mixerRef.current = null
            }
            
            // Clean up scene
            if (scene) {
                scene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh
                        mesh.geometry?.dispose()
                        if (mesh.material) {
                            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                            materials.forEach(mat => mat.dispose())
                        }
                    }
                })
            }
        }
    }, [animationKey, onComplete]) // Re-run if key changes

    useFrame((_, delta) => {
        // Cap delta to prevent animation jumps and ensure smooth playback
        const cappedDelta = Math.min(delta, 0.1)
        if (mixerRef.current) {
            mixerRef.current.update(cappedDelta)
        }
    })

    if (!scene) return null

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
