/**
 * 3D Performance Configuration
 * Centralized settings for optimal 3D model rendering and animation performance
 */

export const PERFORMANCE_CONFIG = {
  // Animation Settings - INCREASED GAPS FOR SMOOTHER PLAYBACK
  animation: {
    maxDeltaTime: 0.1, // Cap delta to prevent large jumps (100ms max)
    fadeInDuration: 0.4, // Smooth fade-in time (400ms) - INCREASED
    fadeOutDuration: 0.5, // Smooth fade-out time (500ms) - INCREASED
    cleanupBufferTime: 500, // Extra time before cleanup (500ms) - INCREASED
    transitionDelay: 150, // Delay between animations for clean state (150ms) - INCREASED
    talkingLoopDelay: 400, // Delay between talking animations (400ms) - INCREASED
    timeScale: 0.95, // Slightly slower for smoother appearance - ADJUSTED
    idleGapDuration: 300, // Gap before returning to idle (300ms) - NEW
  },

  // Renderer Settings - MORE RESOURCES ALLOCATED
  renderer: {
    maxPixelRatio: 2, // Limit pixel ratio for performance
    enableAntialiasing: (dpr: number) => dpr <= 2, // Enable AA on more devices - CHANGED
    powerPreference: 'high-performance' as const,
    enableShadows: false, // Disable shadows for better performance
    enableStencil: false, // Disable stencil buffer
    preserveDrawingBuffer: false,
    physicallyCorrectLights: false,
    precision: 'highp' as const, // High precision for smoother rendering - NEW
    logarithmicDepthBuffer: false, // Disabled for performance
  },

  // Mesh Optimization
  mesh: {
    enableFrustumCulling: true, // Enable frustum culling
    castShadow: false, // Disable shadow casting
    receiveShadow: false, // Disable shadow receiving
  },

  // Performance Monitoring
  monitoring: {
    fpsThreshold: 30, // Minimum FPS for "good" performance
    sampleSize: 60, // Number of frames to average (1 second at 60fps)
    updateInterval: 30, // Update metrics every N frames
  },

  // Model Loading
  loading: {
    enableCaching: true, // Cache loaded models
    cacheSize: 10, // Maximum cached models
    cacheDuration: 5 * 60 * 1000, // Cache duration (5 minutes)
  },

  // Camera Settings
  camera: {
    fov: 50,
    near: 0.1,
    far: 100,
    position: [0, 1.4, 3] as [number, number, number],
  },

  // Controls Settings
  controls: {
    enableDamping: true,
    dampingFactor: 0.08,
    enablePan: false,
    target: [0, 1.25, 0] as [number, number, number],
    minDistance: 1.2,
    maxDistance: 6,
  },

  // Model Scale Settings
  scale: {
    mainModel: 1.8,
    externalModel: 180.0,
    viewportScaleMobile: 0.7,
    viewportScaleTablet: 0.9,
    viewportScaleDesktop: 1.0,
  },

  // Animation Track Filtering
  trackFiltering: {
    // Keywords to filter out from position tracks
    positionBlacklist: ['leg', 'knee', 'foot', 'toe', 'hips', 'root'],
    
    // Keywords to filter out from rotation tracks
    rotationBlacklist: ['spine', 'clavicle', 'armpit', 'scapula', 'shoulder_base'],
    
    // Root node patterns to filter
    rootNodePatterns: /^(Hips|Root|mixamorigHips|Character)/i,
  },

  // Lighting Settings
  lighting: {
    ambient: {
      color: 0xffffff,
      intensity: 1.0,
    },
    main: {
      color: 0xffffff,
      intensity: 1.5,
      position: [2, 3, 2] as [number, number, number],
    },
    fill: {
      color: 0xbad7ff,
      intensity: 0.8,
      position: [-2, 2, 1] as [number, number, number],
    },
    rim: {
      color: 0xffffff,
      intensity: 0.6,
      position: [0, 2, -2] as [number, number, number],
    },
    emotion: {
      intensity: 1.5,
      distance: 12,
      position: [0, 1.6, 1.5] as [number, number, number],
    },
  },

  // Emotion States
  emotions: {
    neutral: { color: 0x6be4ff, intensity: 1.5 },
    happy: { color: 0xb3ffcb, intensity: 1.8 },
    sad: { color: 0x88a5ff, intensity: 1.2 },
    thinking: { color: 0xf9cc58, intensity: 1.6 },
    talking: { color: 0x5be4ff, intensity: 2.0 },
    listening: { color: 0x35d4ff, intensity: 1.7 },
    hi: { color: 0xb7f5ff, intensity: 1.8 },
    yes: { color: 0x9fe8ff, intensity: 1.5 },
    no: { color: 0xffd0d0, intensity: 1.5 },
    rest: { color: 0x9fd7ff, intensity: 1.3 },
  },

  // Animation File Mapping
  animationFiles: {
    hi: 'hi.glb',
    yes: 'Head Nod Yes.glb',
    no: 'No.glb',
    'talking 1': 'Talking 1.glb',
    'talking 2': 'Talking 2.glb',
    rest: 'rest.glb',
  },

  // Viewport Breakpoints
  breakpoints: {
    mobile: 768,
    tablet: 1024,
  },
}

/**
 * Get viewport scale based on window width
 */
export function getViewportScale(width: number): number {
  if (width < PERFORMANCE_CONFIG.breakpoints.mobile) {
    return PERFORMANCE_CONFIG.scale.viewportScaleMobile
  } else if (width < PERFORMANCE_CONFIG.breakpoints.tablet) {
    return PERFORMANCE_CONFIG.scale.viewportScaleTablet
  }
  return PERFORMANCE_CONFIG.scale.viewportScaleDesktop
}

/**
 * Check if animation should be filtered based on track name
 */
export function shouldFilterTrack(trackName: string): boolean {
  const name = trackName.toLowerCase()
  
  // Filter position tracks
  if (trackName.endsWith('.position')) {
    return true
  }
  
  // Filter blacklisted position keywords
  if (PERFORMANCE_CONFIG.trackFiltering.positionBlacklist.some(kw => name.includes(kw))) {
    return true
  }
  
  // Filter blacklisted rotation keywords
  if (PERFORMANCE_CONFIG.trackFiltering.rotationBlacklist.some(kw => name.includes(kw))) {
    return true
  }
  
  // Filter root node rotations
  if (
    trackName.endsWith('.quaternion') &&
    PERFORMANCE_CONFIG.trackFiltering.rootNodePatterns.test(trackName)
  ) {
    return true
  }
  
  return false
}

/**
 * Get optimal renderer settings based on device capabilities
 */
export function getRendererSettings() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
  
  return {
    antialias: PERFORMANCE_CONFIG.renderer.enableAntialiasing(dpr),
    alpha: true,
    preserveDrawingBuffer: PERFORMANCE_CONFIG.renderer.preserveDrawingBuffer,
    powerPreference: PERFORMANCE_CONFIG.renderer.powerPreference,
    stencil: PERFORMANCE_CONFIG.renderer.enableStencil,
    depth: true,
  }
}

/**
 * Cap delta time to prevent animation jumps
 */
export function capDeltaTime(delta: number): number {
  return Math.min(delta, PERFORMANCE_CONFIG.animation.maxDeltaTime)
}

/**
 * Get emotion light settings
 */
export function getEmotionLightSettings(emotion: string) {
  return PERFORMANCE_CONFIG.emotions[emotion as keyof typeof PERFORMANCE_CONFIG.emotions] || 
         PERFORMANCE_CONFIG.emotions.neutral
}

export default PERFORMANCE_CONFIG
