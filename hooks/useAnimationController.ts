import { useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { EmotionType } from '@/components/counseling/Enhanced3DNurseScene'

interface AnimationControlResult {
  playAnimation: (name: string) => void
  setEmotion: (emotion: EmotionType) => void
  startTalkingLoop: () => void
  stopTalkingLoop: () => void
  playExternalAnimation: (key: string, fallback?: EmotionType) => void
  loadExternalAnimation: (key: string, url: string) => Promise<void>
  isExternalAnimationLoaded: (key: string) => boolean
}

interface ExternalAnimationCache {
  clip: THREE.AnimationClip
  timestamp: number
}

// Emotion to animation clip mapping
const emotionClips: Record<EmotionType, string> = {
  neutral: 'Idle',
  happy: 'Wave',
  sad: 'Sad',
  thinking: 'Thinking',
  talking: 'Talking',
  listening: 'Listening',
  hi: 'Hi',
  yes: 'Yes',
  no: 'No',
  rest: 'Idle'
}

// One-shot animations that should play once and return to base state
const oneShotClips = new Set(['Hi', 'Yes', 'No'])

// Talking animations for variation
const talkingAnimations = ['Talking 1', 'Talking 2']

// External animation cache
const externalAnimationCache = new Map<string, ExternalAnimationCache>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useAnimationController(
  mixer: THREE.AnimationMixer | null,
  animations: THREE.AnimationClip[]
): AnimationControlResult {
  const currentEmotionRef = useRef<EmotionType>('neutral')
  const isTalkingLoopActiveRef = useRef(false)
  const talkingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const clipCacheRef = useRef<Map<string, THREE.AnimationClip>>(new Map())
  const currentTalkAnimIndexRef = useRef(0)
  const activeActionRef = useRef<THREE.AnimationAction | null>(null)
  const externalAnimationsRef = useRef<Map<string, THREE.AnimationClip>>(new Map())

  // Build clip cache for faster lookups
  useEffect(() => {
    const cache = new Map<string, THREE.AnimationClip>()

    animations.forEach(clip => {
      // Direct name match
      cache.set(clip.name, clip)

      // Lowercase match for case-insensitive lookup
      cache.set(clip.name.toLowerCase(), clip)

      // Partial matches for common variations
      const normalized = clip.name.toLowerCase()
      if (normalized.includes('idle')) cache.set('idle', clip)
      if (normalized.includes('wave')) cache.set('wave', clip)
      if (normalized.includes('talk')) cache.set('talking', clip)
      if (normalized.includes('think')) cache.set('thinking', clip)
      if (normalized.includes('listen')) cache.set('listening', clip)
      if (normalized.includes('sad')) cache.set('sad', clip)
      if (normalized.includes('hi') || normalized.includes('hello')) cache.set('hi', clip)
      if (normalized.includes('yes') || normalized.includes('nod')) cache.set('yes', clip)
      if (normalized.includes('no')) cache.set('no', clip)
    })

    clipCacheRef.current = cache
  }, [animations])

  // Find animation clip by name with fallback logic
  const findClip = useCallback((targetName: string): THREE.AnimationClip | undefined => {
    if (!targetName || animations.length === 0) return undefined

    const cache = clipCacheRef.current

    // Try exact match first
    let clip = cache.get(targetName)
    if (clip) return clip

    // Try lowercase match
    clip = cache.get(targetName.toLowerCase())
    if (clip) return clip

    // Try finding by Three.js utility
    clip = THREE.AnimationClip.findByName(animations, targetName) || undefined
    if (clip) return clip

    // Try partial matching
    const normalized = targetName.toLowerCase()
    for (const [key, cachedClip] of cache.entries()) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return cachedClip
      }
    }

    return undefined
  }, [animations])

  // Play a specific animation - ENHANCED WITH SMOOTHER TRANSITIONS
  const playAnimation = useCallback((animationName: string) => {
    if (!mixer || !animationName) return

    const clip = findClip(animationName)
    if (!clip) {
      console.warn(`Animation clip "${animationName}" not found`)
      return
    }

    // Configure the new action
    const newAction = mixer.clipAction(clip)
    const oldAction = activeActionRef.current

    const isOneShot = oneShotClips.has(animationName)

    newAction.reset()
    newAction.clampWhenFinished = isOneShot
    newAction.setLoop(isOneShot ? THREE.LoopOnce : THREE.LoopRepeat, isOneShot ? 0 : Infinity)
    newAction.timeScale = 0.95 // Slightly slower for smoother appearance

    // Smooth transition with INCREASED fade times
    if (oldAction && oldAction !== newAction) {
      // Fade out old action first
      oldAction.fadeOut(0.5) // INCREASED fade-out duration
      
      // Then fade in new action
      setTimeout(() => {
        newAction.fadeIn(0.4) // INCREASED fade-in duration
        newAction.play()
      }, 150) // Gap between fade-out and fade-in
      
      // Stop old action after fade completes
      setTimeout(() => {
        if (activeActionRef.current !== oldAction) {
          oldAction.stop()
        }
      }, 650) // Total fade-out + gap time
    } else {
      newAction.fadeIn(0.4) // INCREASED fade-in duration
      newAction.play()
    }

    activeActionRef.current = newAction

    // Handle one-shot animation completion
    if (isOneShot) {
      const handleFinished = (event: any) => {
        if (event.action === newAction) {
          mixer.removeEventListener('finished', handleFinished)

          // Return to the current base emotion after one-shot completes
          if (activeActionRef.current === newAction) {
            // Add gap before returning to base emotion
            setTimeout(() => {
              const baseClip = findClip(emotionClips[currentEmotionRef.current])
              if (baseClip) {
                const baseAction = mixer.clipAction(baseClip)
                baseAction.reset()
                baseAction.setLoop(THREE.LoopRepeat, Infinity)
                baseAction.timeScale = 0.95
                baseAction.fadeIn(0.4)
                baseAction.play()

                newAction.fadeOut(0.5)
                activeActionRef.current = baseAction

                setTimeout(() => {
                  newAction.stop()
                }, 500)
              }
            }, 300) // INCREASED gap before returning to base
          }
        }
      }
      mixer.addEventListener('finished', handleFinished)
    }
  }, [mixer, findClip])

  // Set emotion state and play corresponding animation
  const setEmotion = useCallback((emotion: EmotionType) => {
    currentEmotionRef.current = emotion
    const clipName = emotionClips[emotion]
    if (clipName) {
      playAnimation(clipName)
    }
  }, [playAnimation])

  // Start talking loop (cycles between talking animations) - INCREASED GAPS FOR SMOOTHNESS
  const startTalkingLoop = useCallback(() => {
    if (!mixer || isTalkingLoopActiveRef.current) return

    isTalkingLoopActiveRef.current = true
    currentTalkAnimIndexRef.current = 0

    const playNextTalkingAnimation = () => {
      if (!isTalkingLoopActiveRef.current || !mixer) return

      // Get the next talking animation
      const animName = talkingAnimations[currentTalkAnimIndexRef.current % talkingAnimations.length]
      currentTalkAnimIndexRef.current++

      // Try to find the animation clip
      let clip = findClip(animName)

      // If not found, try external animations
      if (!clip) {
        clip = externalAnimationsRef.current.get(animName.toLowerCase()) || undefined
      }

      if (clip) {
        // CRITICAL FIX: Stop all actions IMMEDIATELY to prevent overlap
        mixer.stopAllAction()
        
        // INCREASED delay to ensure clean state before starting new animation
        setTimeout(() => {
          if (!isTalkingLoopActiveRef.current || !mixer) return
          
          const newAction = mixer.clipAction(clip!)
          newAction.reset()
          newAction.clampWhenFinished = true
          newAction.setLoop(THREE.LoopOnce, 1)
          newAction.timeScale = 0.95 // Slightly slower for smoother appearance
          newAction.fadeIn(0.4) // INCREASED fade-in for smoother start
          newAction.play()

          activeActionRef.current = newAction

          // Set up next animation when this one finishes
          const handleFinished = (event: any) => {
            if (event.action === newAction) {
              mixer.removeEventListener('finished', handleFinished)
              // INCREASED delay for smoother transitions - BIG GAP
              if (isTalkingLoopActiveRef.current) {
                setTimeout(() => {
                  playNextTalkingAnimation()
                }, 400) // INCREASED from 100ms to 400ms for bigger gap
              }
            }
          }
          mixer.addEventListener('finished', handleFinished)
        }, 150) // INCREASED from 50ms to 150ms for cleaner state
      } else {
        // Fallback to basic talking animation if variations fail
        playAnimation('Talking')
        // Retry loop after a delay
        setTimeout(() => {
          if (isTalkingLoopActiveRef.current) {
            playNextTalkingAnimation()
          }
        }, 1000)
      }
    }

    playNextTalkingAnimation()
    console.log('Started talking loop with variations')
  }, [mixer, findClip, playAnimation])

  // Stop talking loop and return to neutral
  const stopTalkingLoop = useCallback(() => {
    if (!isTalkingLoopActiveRef.current) return

    isTalkingLoopActiveRef.current = false

    // Clear any pending talking timeouts
    if (talkingTimeoutRef.current) {
      clearTimeout(talkingTimeoutRef.current)
      talkingTimeoutRef.current = null
    }

    // Immediately return to current emotion without delay
    setEmotion(currentEmotionRef.current)

    console.log('Stopped talking loop')
  }, [setEmotion])

  // Load external animation from GLB file
  const loadExternalAnimation = useCallback(async (key: string, url: string): Promise<void> => {
    try {
      // Check cache first
      const cached = externalAnimationCache.get(key)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        externalAnimationsRef.current.set(key, cached.clip)
        console.log(`Loaded external animation "${key}" from cache`)
        return
      }

      // Load from network
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const loader = new GLTFLoader()

      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve(gltf),
          undefined,
          (error) => reject(error)
        )
      })

      if (gltf.animations && gltf.animations.length > 0) {
        const clip = gltf.animations[0]

        // Optimize the clip
        clip.optimize()

        // Remove root motion to prevent unwanted movement
        clip.tracks = clip.tracks.filter((track: THREE.KeyframeTrack) => {
          const isPosition = track.name.endsWith('.position')
          const isRotation = track.name.endsWith('.quaternion')
          const isRootNode = /^(Hips|Root|mixamorigHips|Character)/i.test(track.name)

          if (isPosition && isRootNode) return false // Only remove root position movement
          if (isRotation && isRootNode) return false // Remove root rotation

          return true
        })

        // Store in cache and local reference
        externalAnimationCache.set(key, { clip, timestamp: Date.now() })
        externalAnimationsRef.current.set(key, clip)

        console.log(`Loaded external animation "${key}" from ${url}`)
      } else {
        throw new Error(`No animations found in ${url}`)
      }
    } catch (error) {
      console.error(`Failed to load external animation "${key}" from ${url}:`, error)
      throw error
    }
  }, [])

  // Check if external animation is loaded
  const isExternalAnimationLoaded = useCallback((key: string): boolean => {
    return externalAnimationsRef.current.has(key)
  }, [])

  // Play external animation (updated implementation)
  const playExternalAnimation = useCallback((key: string, fallback: EmotionType = 'neutral') => {
    console.log(`Playing external animation: ${key}`)

    // Try to find the external animation
    const externalClip = externalAnimationsRef.current.get(key)

    if (externalClip && mixer) {
      // Stop all current actions
      mixer.stopAllAction()

      // Create and configure the action
      const action = mixer.clipAction(externalClip)
      action.reset()
      action.clampWhenFinished = true
      action.setLoop(THREE.LoopOnce, 1)
      action.fadeIn(0.3)
      action.play()

      // Handle completion - return to fallback emotion
      const handleFinished = (event: any) => {
        if (event.action === action) {
          mixer.removeEventListener('finished', handleFinished)
          setEmotion(fallback)
        }
      }
      mixer.addEventListener('finished', handleFinished)

      console.log(`Playing external animation "${key}"`)
    } else {
      console.warn(`External animation "${key}" not loaded, falling back to ${fallback}`)
      setEmotion(fallback)
    }
  }, [mixer, setEmotion])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (talkingTimeoutRef.current) {
        clearTimeout(talkingTimeoutRef.current)
        talkingTimeoutRef.current = null
      }
    }
  }, [])

  return {
    playAnimation,
    setEmotion,
    startTalkingLoop,
    stopTalkingLoop,
    playExternalAnimation,
    loadExternalAnimation,
    isExternalAnimationLoaded
  }
}