import { useState, useEffect, useCallback, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

interface ModelLoadResult {
  model: THREE.Object3D | null
  animations: THREE.AnimationClip[]
  mixer: THREE.AnimationMixer | null
  isLoading: boolean
  error: Error | null
  loadModel: (url: string) => Promise<void>
  progress: number
}

// Model cache to prevent redundant downloads
const modelCache = new Map<string, {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
  timestamp: number
}>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useThreeJSModel(modelUrl?: string): ModelLoadResult {
  const [model, setModel] = useState<THREE.Object3D | null>(null)
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([])
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  
  const loaderRef = useRef<GLTFLoader | null>(null)
  const dracoLoaderRef = useRef<DRACOLoader | null>(null)

  // Initialize loaders
  useEffect(() => {
    try {
      // Initialize DRACO loader for compressed models (optional)
      dracoLoaderRef.current = new DRACOLoader()
      dracoLoaderRef.current.setDecoderPath('/draco/')
      
      // Initialize GLTF loader
      loaderRef.current = new GLTFLoader()
      
      // Set DRACO loader if available
      if (dracoLoaderRef.current) {
        loaderRef.current.setDRACOLoader(dracoLoaderRef.current)
      }
    } catch (error) {
      console.warn('Failed to initialize DRACO loader, continuing without compression support:', error)
      
      // Fallback to basic GLTF loader
      loaderRef.current = new GLTFLoader()
    }

    return () => {
      // Cleanup loaders
      if (dracoLoaderRef.current) {
        try {
          dracoLoaderRef.current.dispose()
        } catch (error) {
          console.warn('Error disposing DRACO loader:', error)
        }
      }
    }
  }, [])

  // Clean up model cache periodically
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now()
      for (const [key, cached] of modelCache.entries()) {
        if (now - cached.timestamp > CACHE_DURATION) {
          // Dispose of cached model resources
          cached.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry?.dispose()
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose())
              } else {
                child.material?.dispose()
              }
            }
          })
          modelCache.delete(key)
        }
      }
    }

    const interval = setInterval(cleanupCache, 60000) // Clean every minute
    return () => clearInterval(interval)
  }, [])

  const loadModel = useCallback(async (url: string) => {
    if (!loaderRef.current) {
      setError(new Error('GLTF Loader not initialized'))
      return
    }

    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      // Check cache first
      const cached = modelCache.get(url)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Loading model from cache:', url)
        
        // Clone the cached scene to avoid modifying the original
        const clonedScene = cached.scene.clone()
        
        setModel(clonedScene)
        setAnimations(cached.animations)
        
        // Create new mixer for the cloned model
        const newMixer = new THREE.AnimationMixer(clonedScene)
        setMixer(newMixer)
        
        setProgress(100)
        setIsLoading(false)
        return
      }

      // Load model from network
      console.log('Loading model from network:', url)
      
      const gltf = await new Promise<any>((resolve, reject) => {
        loaderRef.current!.load(
          url,
          (gltf) => resolve(gltf),
          (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percentComplete = (progressEvent.loaded / progressEvent.total) * 100
              setProgress(percentComplete)
            }
          },
          (error) => reject(error)
        )
      })

      // Process the loaded model
      const loadedScene = gltf.scene
      const loadedAnimations = gltf.animations || []

      // Optimize model materials and geometry
      loadedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Ensure materials are visible
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.transparent) {
                  mat.opacity = Math.max(mat.opacity, 0.8)
                }
              })
            } else {
              if (child.material.transparent) {
                child.material.opacity = Math.max(child.material.opacity, 0.8)
              }
            }
          }

          // Disable frustum culling for better reliability
          child.frustumCulled = false
          child.castShadow = false
          child.receiveShadow = false
        }
      })

      // Scale and position the model
      loadedScene.scale.set(1.8, 1.8, 1.8)
      loadedScene.position.set(0, 0.9, 0)
      loadedScene.updateMatrixWorld(true)

      // Cache the model
      modelCache.set(url, {
        scene: loadedScene.clone(), // Store a clone in cache
        animations: loadedAnimations,
        timestamp: Date.now()
      })

      // Create animation mixer
      const newMixer = new THREE.AnimationMixer(loadedScene)

      // Set state
      setModel(loadedScene)
      setAnimations(loadedAnimations)
      setMixer(newMixer)
      setProgress(100)
      setIsLoading(false)

      console.log('Model loaded successfully:', {
        animations: loadedAnimations.length,
        meshes: loadedScene.children.length
      })

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load model')
      console.error('Model loading error:', error)
      setError(error)
      setIsLoading(false)
    }
  }, [])

  // Auto-load model if URL is provided
  useEffect(() => {
    if (modelUrl) {
      loadModel(modelUrl)
    }
  }, [modelUrl, loadModel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mixer) {
        mixer.stopAllAction()
      }
      if (model) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose())
            } else {
              child.material?.dispose()
            }
          }
        })
      }
    }
  }, [mixer, model])

  return {
    model,
    animations,
    mixer,
    isLoading,
    error,
    loadModel,
    progress
  }
}