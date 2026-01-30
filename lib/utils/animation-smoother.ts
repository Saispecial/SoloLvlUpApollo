/**
 * Animation Smoother Utility
 * Provides smooth animation transitions with proper gaps and resource management
 */

import * as THREE from 'three'

export interface AnimationTransitionConfig {
  fadeInDuration?: number
  fadeOutDuration?: number
  gapDuration?: number
  timeScale?: number
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

const DEFAULT_CONFIG: Required<AnimationTransitionConfig> = {
  fadeInDuration: 0.4,
  fadeOutDuration: 0.5,
  gapDuration: 400,
  timeScale: 0.95,
  easing: 'easeInOut'
}

/**
 * Smoothly transition from one animation to another with proper gaps
 */
export class AnimationSmoother {
  private mixer: THREE.AnimationMixer
  private currentAction: THREE.AnimationAction | null = null
  private transitionTimeout: NodeJS.Timeout | null = null
  private isTransitioning = false

  constructor(mixer: THREE.AnimationMixer) {
    this.mixer = mixer
  }

  /**
   * Play an animation with smooth transition
   */
  async playAnimation(
    clip: THREE.AnimationClip,
    config: AnimationTransitionConfig = {}
  ): Promise<void> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }

    // Wait if currently transitioning
    if (this.isTransitioning) {
      await this.waitForTransition()
    }

    this.isTransitioning = true

    // Stop current animation smoothly
    if (this.currentAction) {
      await this.stopCurrentAnimation(finalConfig.fadeOutDuration)
    }

    // Add gap before starting new animation
    await this.wait(finalConfig.gapDuration)

    // Start new animation
    const newAction = this.mixer.clipAction(clip)
    newAction.reset()
    newAction.clampWhenFinished = true
    newAction.setLoop(THREE.LoopOnce, 1)
    newAction.timeScale = finalConfig.timeScale
    newAction.fadeIn(finalConfig.fadeInDuration)
    newAction.play()

    this.currentAction = newAction
    this.isTransitioning = false

    return new Promise((resolve) => {
      const handleFinished = (event: any) => {
        if (event.action === newAction) {
          this.mixer.removeEventListener('finished', handleFinished)
          resolve()
        }
      }
      this.mixer.addEventListener('finished', handleFinished)
    })
  }

  /**
   * Stop current animation smoothly
   */
  private async stopCurrentAnimation(fadeOutDuration: number): Promise<void> {
    if (!this.currentAction) return

    return new Promise((resolve) => {
      const action = this.currentAction!
      action.fadeOut(fadeOutDuration)
      
      setTimeout(() => {
        action.stop()
        resolve()
      }, fadeOutDuration * 1000)
    })
  }

  /**
   * Wait for specified duration
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.transitionTimeout = setTimeout(resolve, ms)
    })
  }

  /**
   * Wait for current transition to complete
   */
  private async waitForTransition(): Promise<void> {
    while (this.isTransitioning) {
      await this.wait(50)
    }
  }

  /**
   * Stop all animations immediately
   */
  stopAll(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout)
      this.transitionTimeout = null
    }
    this.mixer.stopAllAction()
    this.currentAction = null
    this.isTransitioning = false
  }

  /**
   * Get current action
   */
  getCurrentAction(): THREE.AnimationAction | null {
    return this.currentAction
  }

  /**
   * Check if transitioning
   */
  isCurrentlyTransitioning(): boolean {
    return this.isTransitioning
  }
}

/**
 * Create a smooth animation loop with gaps
 */
export class AnimationLooper {
  private smoother: AnimationSmoother
  private clips: THREE.AnimationClip[]
  private currentIndex = 0
  private isLooping = false
  private loopTimeout: NodeJS.Timeout | null = null
  private config: Required<AnimationTransitionConfig>

  constructor(
    mixer: THREE.AnimationMixer,
    clips: THREE.AnimationClip[],
    config: AnimationTransitionConfig = {}
  ) {
    this.smoother = new AnimationSmoother(mixer)
    this.clips = clips
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Start the animation loop
   */
  async start(): Promise<void> {
    if (this.isLooping) return
    
    this.isLooping = true
    this.currentIndex = 0
    await this.playNext()
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    this.isLooping = false
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout)
      this.loopTimeout = null
    }
    this.smoother.stopAll()
  }

  /**
   * Play next animation in the loop
   */
  private async playNext(): Promise<void> {
    if (!this.isLooping || this.clips.length === 0) return

    const clip = this.clips[this.currentIndex % this.clips.length]
    this.currentIndex++

    try {
      await this.smoother.playAnimation(clip, this.config)
      
      // Add gap before next animation
      if (this.isLooping) {
        this.loopTimeout = setTimeout(() => {
          this.playNext()
        }, this.config.gapDuration)
      }
    } catch (error) {
      console.error('Error playing animation in loop:', error)
      if (this.isLooping) {
        // Retry after a delay
        this.loopTimeout = setTimeout(() => {
          this.playNext()
        }, 1000)
      }
    }
  }

  /**
   * Check if looping
   */
  isCurrentlyLooping(): boolean {
    return this.isLooping
  }

  /**
   * Update configuration
   */
  updateConfig(config: AnimationTransitionConfig): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * Utility function to cap delta time for smooth updates
 */
export function capDeltaTime(delta: number, maxDelta: number = 0.1): number {
  return Math.min(delta, maxDelta)
}

/**
 * Utility function to create smooth easing
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Utility function to interpolate between values with easing
 */
export function smoothLerp(start: number, end: number, t: number): number {
  const easedT = easeInOutCubic(t)
  return start + (end - start) * easedT
}

export default AnimationSmoother
