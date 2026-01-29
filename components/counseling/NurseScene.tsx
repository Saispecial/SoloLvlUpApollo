"use client"

import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

interface NurseSceneProps {
  emotion?: string
  isTalking?: boolean
}

export default function NurseScene({ emotion = "neutral", isTalking = false }: NurseSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const externalModelRef = useRef<THREE.Object3D | null>(null)
  const externalMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const emotionLightRef = useRef<THREE.PointLight | null>(null)
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null)
  const modelCacheRef = useRef<Map<string, { scene: THREE.Object3D; animations: THREE.AnimationClip[] }>>(new Map())

  const [isReady, setIsReady] = useState(false)
  const [currentTalkIndex, setCurrentTalkIndex] = useState(0)
  const isTalkingLoopActiveRef = useRef(false)

  const talkingAnimations = ['Talking 1', 'Talking 2']

  const emotionStates: Record<string, { color: number; intensity: number }> = {
    neutral: { color: 0x6be4ff, intensity: 1.5 },
    happy: { color: 0xb3ffcb, intensity: 1.8 },
    sad: { color: 0x88a5ff, intensity: 1.2 },
    thinking: { color: 0xf9cc58, intensity: 1.6 },
    talking: { color: 0x5be4ff, intensity: 2.0 },
    listening: { color: 0x35d4ff, intensity: 1.7 },
    hi: { color: 0xb7f5ff, intensity: 1.8 },
    yes: { color: 0x9fe8ff, intensity: 1.5 },
    no: { color: 0xffd0d0, intensity: 1.5 },
    rest: { color: 0x9fd7ff, intensity: 1.3 }
  }

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const { clientWidth, clientHeight } = container

    // Scene
    const scene = new THREE.Scene()
    // scene.background = new THREE.Color(0x04060d) // Removed to allow transparency
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(50, clientWidth / clientHeight, 0.1, 100)
    camera.position.set(0, 1.4, 3)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(clientWidth, clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.target.set(0, 1.25, 0)
    controls.minDistance = 1.2
    controls.maxDistance = 6
    controlsRef.current = controls

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambient)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5)
    mainLight.position.set(2, 3, 2)
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0xbad7ff, 0.8)
    fillLight.position.set(-2, 2, 1)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6)
    rimLight.position.set(0, 2, -2)
    scene.add(rimLight)

    const emotionLight = new THREE.PointLight(0x6be4ff, 1.5, 12)
    emotionLight.position.set(0, 1.6, 1.5)
    scene.add(emotionLight)
    emotionLightRef.current = emotionLight

    // Load main model
    const loader = new GLTFLoader()
    loader.load(
      '/nurse+robot+3d+model.glb',
      (gltf) => {
        const model = gltf.scene
        modelRef.current = model

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = false
            mesh.receiveShadow = false
            mesh.frustumCulled = false
          }
        })

        model.scale.set(1.8, 1.8, 1.8)
        model.position.y = 0.9
        model.rotation.y = -Math.PI / 2
        scene.add(model)

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model)
          mixerRef.current = mixer

          // Play idle animation if available
          const idleClip = gltf.animations[0]
          if (idleClip) {
            const action = mixer.clipAction(idleClip)
            action.play()
          }
        }

        setIsReady(true)
      },
      undefined,
      (error) => {
        console.error('Error loading nurse model:', error)
      }
    )

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      const delta = clockRef.current.getDelta()

      if (mixerRef.current) mixerRef.current.update(delta)
      if (externalMixerRef.current) externalMixerRef.current.update(delta)
      if (controlsRef.current) controlsRef.current.update()

      // Gentle bobbing animation
      if (modelRef.current && !externalModelRef.current) {
        const elapsed = clockRef.current.elapsedTime
        const bobOffset = Math.sin(elapsed * 2.2) * 0.02
        modelRef.current.position.y = 0.9 + bobOffset
      }

      // Talking light pulse
      if (isTalking && emotionLightRef.current) {
        const pulse = Math.sin(clockRef.current.elapsedTime * 8) * 0.5 + 0.5
        emotionLightRef.current.intensity = 1.5 + pulse * 2.5
        emotionLightRef.current.color.setHex(0x5be4ff)
      }

      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      const { clientWidth, clientHeight } = container
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current)
      }
    }
  }, [])

  // Play external animation
  const playExternalAnimation = (key: string, fallbackEmotion = 'neutral') => {
    if (!sceneRef.current) return

    console.log(`Loading ${key}.glb animation`)

    // Cancel pending cleanup
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }

    const oldExternalModel = externalModelRef.current

    if (externalMixerRef.current) {
      externalMixerRef.current.stopAllAction()
      externalMixerRef.current = null
    }

    externalModelRef.current = null

    const loader = new GLTFLoader()

    // Check cache first
    if (modelCacheRef.current.has(key)) {
      console.log(`Loading ${key} from cache`)
      const cached = modelCacheRef.current.get(key)!
      onLoadSuccess(cached.scene.clone(), cached.animations)
      return
    }

    loader.load(
      `/${key}.glb`,
      (gltf) => {
        console.log(`✅ Loaded ${key}.glb successfully`)
        modelCacheRef.current.set(key, { scene: gltf.scene, animations: gltf.animations })
        onLoadSuccess(gltf.scene, gltf.animations)
      },
      undefined,
      (error) => {
        console.error(`Failed to load ${key}.glb:`, error)
        cleanup(key)
      }
    )

    function onLoadSuccess(loadedScene: THREE.Object3D, loadedAnimations: THREE.AnimationClip[]) {
      externalModelRef.current = loadedScene

      // Remove old model
      if (oldExternalModel && sceneRef.current) {
        sceneRef.current.remove(oldExternalModel)
      }

      // Make meshes visible
      loadedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.visible = true
          mesh.frustumCulled = false
        }
      })

      // Scale and position
      const ADJUSTED_SCALE = 180.0
      loadedScene.scale.set(ADJUSTED_SCALE, ADJUSTED_SCALE, ADJUSTED_SCALE)
      loadedScene.position.set(0, 0.9, 0)
      loadedScene.rotation.set(0, -Math.PI / 2, 0)

      sceneRef.current!.add(loadedScene)

      // Hide main model
      if (modelRef.current) {
        modelRef.current.visible = false
      }

      if (loadedAnimations && loadedAnimations.length > 0) {
        const mixer = new THREE.AnimationMixer(loadedScene)
        externalMixerRef.current = mixer

        loadedAnimations.forEach((clip) => {
          // Remove root motion
          clip.tracks = clip.tracks.filter(track => {
            const isPosition = track.name.endsWith('.position')
            const isRotation = track.name.endsWith('.quaternion')
            const isRootNode = /^(Hips|Root|mixamorigHips|Character)/i.test(track.name)

            if (isPosition) return false
            if (isRotation && isRootNode) return false

            return true
          })

          const action = mixer.clipAction(clip)
          action.reset()
          action.clampWhenFinished = true
          action.setLoop(THREE.LoopOnce, 1)
          action.timeScale = 1.0
          action.fadeIn(0.3)
          action.play()
        })

        // Cleanup after animation
        const animationDuration = loadedAnimations[0].duration * 1000
        cleanupTimerRef.current = setTimeout(() => {
          cleanup(key)
        }, animationDuration + 100)
      } else {
        setTimeout(() => cleanup(key), 3000)
      }
    }

    function cleanup(key: string) {
      console.log(`Cleaning up ${key}.glb`)

      if (externalModelRef.current && sceneRef.current) {
        sceneRef.current.remove(externalModelRef.current)
        externalModelRef.current = null
      }

      if (externalMixerRef.current) {
        externalMixerRef.current.stopAllAction()
        externalMixerRef.current = null
      }

      cleanupTimerRef.current = null

      // Show main model
      if (modelRef.current) {
        modelRef.current.visible = true
      }

      // Update emotion light
      updateEmotionLight(fallbackEmotion)
    }
  }

  // Talking loop
  const playNextTalkAnim = () => {
    if (!isTalkingLoopActiveRef.current) return

    const animName = talkingAnimations[currentTalkIndex % talkingAnimations.length]
    setCurrentTalkIndex((prev) => prev + 1)

    playExternalAnimation(animName, 'talking')

    // Schedule next animation
    setTimeout(() => {
      if (isTalkingLoopActiveRef.current) {
        playNextTalkAnim()
      }
    }, 3000) // Adjust timing based on animation duration
  }

  const startTalkingLoop = () => {
    isTalkingLoopActiveRef.current = true
    setCurrentTalkIndex(0)
    playNextTalkAnim()
  }

  const stopTalkingLoop = () => {
    isTalkingLoopActiveRef.current = false
  }

  // Update emotion light
  const updateEmotionLight = (emotionKey: string) => {
    const state = emotionStates[emotionKey] || emotionStates.neutral
    if (emotionLightRef.current) {
      emotionLightRef.current.color.setHex(state.color)
      emotionLightRef.current.intensity = state.intensity
    }
  }

  // Handle emotion changes
  useEffect(() => {
    updateEmotionLight(emotion)

    // Trigger specific animations based on emotion
    if (emotion === 'hi') {
      playExternalAnimation('hi', 'neutral')
    } else if (emotion === 'yes') {
      playExternalAnimation('Head Nod Yes', 'neutral')
    } else if (emotion === 'no') {
      playExternalAnimation('No', 'neutral')
    } else if (emotion === 'rest') {
      playExternalAnimation('rest', 'neutral')
    }
  }, [emotion])

  // Handle talking state
  useEffect(() => {
    if (isTalking) {
      startTalkingLoop()
    } else {
      stopTalkingLoop()
    }
  }, [isTalking])

  return (
    <div ref={containerRef} className="absolute inset-0" />
  )
}
