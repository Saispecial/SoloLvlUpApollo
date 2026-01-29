import { useEffect, useCallback, useRef } from 'react'
import { useAnimationController } from './useAnimationController'

interface ExternalAnimationConfig {
  key: string
  filename: string
  description: string
}

// External animation files from the nurce ui folder
const externalAnimationConfigs: ExternalAnimationConfig[] = [
  { key: 'hi', filename: 'hi.glb', description: 'Hi greeting animation' },
  { key: 'yes', filename: 'Head Nod Yes.glb', description: 'Yes nodding animation' },
  { key: 'no', filename: 'No.glb', description: 'No shaking animation' },
  { key: 'rest', filename: 'rest.glb', description: 'Rest/idle animation' },
  { key: 'talking1', filename: 'Talking 1.glb', description: 'Talking variation 1' },
  { key: 'talking2', filename: 'Talking 2.glb', description: 'Talking variation 2' }
]

interface UseExternalAnimationsProps {
  loadExternalAnimation: (key: string, url: string) => Promise<void>
  isExternalAnimationLoaded: (key: string) => boolean
  basePath?: string
}

interface UseExternalAnimationsResult {
  loadAllExternalAnimations: () => Promise<void>
  loadExternalAnimationByKey: (key: string) => Promise<void>
  isLoading: boolean
  loadedAnimations: Set<string>
  failedAnimations: Set<string>
  progress: number
}

export function useExternalAnimations({
  loadExternalAnimation,
  isExternalAnimationLoaded,
  basePath = '/nurce ui/'
}: UseExternalAnimationsProps): UseExternalAnimationsResult {
  const isLoadingRef = useRef(false)
  const loadedAnimationsRef = useRef<Set<string>>(new Set())
  const failedAnimationsRef = useRef<Set<string>>(new Set())
  const progressRef = useRef(0)

  // Load a specific external animation by key
  const loadExternalAnimationByKey = useCallback(async (key: string): Promise<void> => {
    const config = externalAnimationConfigs.find(c => c.key === key)
    if (!config) {
      throw new Error(`External animation config not found for key: ${key}`)
    }

    if (isExternalAnimationLoaded(key)) {
      console.log(`External animation "${key}" already loaded`)
      return
    }

    try {
      const url = `${basePath}${config.filename}`
      console.log(`Loading external animation "${key}" from ${url}`)
      
      await loadExternalAnimation(key, url)
      loadedAnimationsRef.current.add(key)
      console.log(`Successfully loaded external animation "${key}"`)
    } catch (error) {
      console.error(`Failed to load external animation "${key}":`, error)
      failedAnimationsRef.current.add(key)
      throw error
    }
  }, [loadExternalAnimation, isExternalAnimationLoaded, basePath])

  // Load all external animations
  const loadAllExternalAnimations = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current) {
      console.log('External animations already loading')
      return
    }

    isLoadingRef.current = true
    progressRef.current = 0
    loadedAnimationsRef.current.clear()
    failedAnimationsRef.current.clear()

    console.log('Starting to load all external animations...')

    const loadPromises = externalAnimationConfigs.map(async (config, index) => {
      try {
        await loadExternalAnimationByKey(config.key)
        progressRef.current = ((index + 1) / externalAnimationConfigs.length) * 100
      } catch (error) {
        // Individual failures are already logged, continue with others
        progressRef.current = ((index + 1) / externalAnimationConfigs.length) * 100
      }
    })

    try {
      await Promise.allSettled(loadPromises)
      console.log(`External animation loading complete. Loaded: ${loadedAnimationsRef.current.size}, Failed: ${failedAnimationsRef.current.size}`)
    } finally {
      isLoadingRef.current = false
      progressRef.current = 100
    }
  }, [loadExternalAnimationByKey])

  // Auto-load external animations on mount
  useEffect(() => {
    // Small delay to ensure the main model is loaded first
    const timer = setTimeout(() => {
      loadAllExternalAnimations().catch(error => {
        console.error('Failed to auto-load external animations:', error)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [loadAllExternalAnimations])

  return {
    loadAllExternalAnimations,
    loadExternalAnimationByKey,
    isLoading: isLoadingRef.current,
    loadedAnimations: loadedAnimationsRef.current,
    failedAnimations: failedAnimationsRef.current,
    progress: progressRef.current
  }
}