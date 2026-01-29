/**
 * Integration Tests for Enhanced3DNurseScene
 * 
 * These tests validate that the basic 3D model renders correctly
 * and all systems work together as expected.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Enhanced3DNurseScene from '../Enhanced3DNurseScene'

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, onCreated, ...props }: any) => {
    React.useEffect(() => {
      if (onCreated) {
        const mockGL = {
          setPixelRatio: vi.fn(),
          domElement: document.createElement('canvas')
        }
        onCreated({ gl: mockGL })
      }
    }, [onCreated])
    
    return <div data-testid="three-canvas" {...props}>{children}</div>
  },
  useFrame: vi.fn(),
  useThree: () => ({
    scene: { background: null },
    camera: {},
    gl: { domElement: document.createElement('canvas') }
  })
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  PerspectiveCamera: () => <div data-testid="perspective-camera" />
}))

// Mock hooks with successful loading
vi.mock('@/hooks/useWebGLDetection', () => ({
  useWebGLDetection: () => ({
    isWebGLSupported: true,
    webGLError: null,
    webGLVersion: 'WebGL 2.0'
  })
}))

vi.mock('@/hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    fps: 60,
    isPerformanceGood: true,
    frameTime: 16.67
  })
}))

vi.mock('@/hooks/useThreeJSModel', () => ({
  useThreeJSModel: () => ({
    model: { name: 'nurse-model', traverse: vi.fn() },
    animations: [
      { name: 'Idle', duration: 2 },
      { name: 'Wave', duration: 1.5 },
      { name: 'Talking', duration: 3 }
    ],
    mixer: { clipAction: vi.fn(), stopAllAction: vi.fn() },
    isLoading: false,
    error: null,
    loadModel: vi.fn(),
    progress: 100
  })
}))

vi.mock('@/hooks/useAnimationController', () => ({
  useAnimationController: () => ({
    playAnimation: vi.fn(),
    setEmotion: vi.fn(),
    startTalkingLoop: vi.fn(),
    stopTalkingLoop: vi.fn()
  })
}))

vi.mock('@/hooks/usePointerTracking', () => ({
  usePointerTracking: () => ({
    pointerPosition: { x: 0.5, y: 0.5 },
    headOrientation: { tilt: 0, turn: 0 },
    resetPointer: vi.fn()
  })
}))

// Mock child components
vi.mock('../ThreeJSSceneManager', () => ({
  ThreeJSSceneManager: ({ onModelLoad }: any) => {
    React.useEffect(() => {
      // Simulate successful model load
      setTimeout(() => {
        onModelLoad?.()
      }, 100)
    }, [onModelLoad])
    
    return (
      <div data-testid="scene-manager">
        <div data-testid="lighting-system" />
        <div data-testid="nurse-model" />
        <div data-testid="visual-feedback-system" />
      </div>
    )
  }
}))

describe('Enhanced3DNurseScene - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render basic 3D model correctly', async () => {
    const onModelLoad = vi.fn()
    const onError = vi.fn()

    render(
      <Enhanced3DNurseScene
        emotion="neutral"
        isTalking={false}
        onModelLoad={onModelLoad}
        onError={onError}
      />
    )

    // Should show 3D canvas
    expect(screen.getByTestId('three-canvas')).toBeInTheDocument()

    // Should show scene manager with all subsystems
    await waitFor(() => {
      expect(screen.getByTestId('scene-manager')).toBeInTheDocument()
      expect(screen.getByTestId('lighting-system')).toBeInTheDocument()
      expect(screen.getByTestId('nurse-model')).toBeInTheDocument()
      expect(screen.getByTestId('visual-feedback-system')).toBeInTheDocument()
    })

    // Should call onModelLoad when ready
    await waitFor(() => {
      expect(onModelLoad).toHaveBeenCalled()
    })

    // Should not call onError
    expect(onError).not.toHaveBeenCalled()

    // Should show visual feedback overlays
    expect(screen.getByText('System Ready')).toBeInTheDocument()
    expect(screen.getByText('Calm focus')).toBeInTheDocument()
  })

  it('should handle different emotion states correctly', async () => {
    const emotions = ['neutral', 'happy', 'sad', 'thinking'] as const

    for (const emotion of emotions) {
      const { unmount } = render(
        <Enhanced3DNurseScene
          emotion={emotion}
          isTalking={false}
        />
      )

      // Should render 3D scene for each emotion
      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument()
        expect(screen.getByTestId('scene-manager')).toBeInTheDocument()
      })

      // Should show emotion in UI
      expect(screen.getByText(emotion.toUpperCase())).toBeInTheDocument()

      unmount()
    }
  })

  it('should handle talking state correctly', async () => {
    const { rerender } = render(
      <Enhanced3DNurseScene
        emotion="neutral"
        isTalking={false}
      />
    )

    // Initially not talking
    await waitFor(() => {
      expect(screen.getByText('System Ready')).toBeInTheDocument()
    })

    // Switch to talking
    rerender(
      <Enhanced3DNurseScene
        emotion="neutral"
        isTalking={true}
      />
    )

    // Should show talking state
    await waitFor(() => {
      expect(screen.getByText('Synthesizing...')).toBeInTheDocument()
    })

    // Should show talking indicators
    const talkingIndicators = screen.getAllByRole('generic').filter(
      el => el.className.includes('animate-pulse')
    )
    expect(talkingIndicators.length).toBeGreaterThan(0)
  })

  it('should maintain performance monitoring', async () => {
    render(
      <Enhanced3DNurseScene
        emotion="neutral"
        isTalking={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('three-canvas')).toBeInTheDocument()
    })

    // In development mode, should show performance monitor
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText('FPS: 60')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()
    }
  })

  it('should handle viewport scaling correctly', async () => {
    // Mock different viewport sizes
    const viewportSizes = [
      { width: 320, height: 568 }, // Mobile
      { width: 1024, height: 768 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ]

    for (const viewport of viewportSizes) {
      Object.defineProperty(window, 'innerWidth', { value: viewport.width })
      Object.defineProperty(window, 'innerHeight', { value: viewport.height })

      const { unmount } = render(
        <Enhanced3DNurseScene
          emotion="neutral"
          isTalking={false}
        />
      )

      // Should render correctly at any viewport size
      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument()
        expect(screen.getByTestId('scene-manager')).toBeInTheDocument()
      })

      unmount()
    }
  })

  it('should integrate all systems without conflicts', async () => {
    const onModelLoad = vi.fn()
    const onError = vi.fn()

    render(
      <Enhanced3DNurseScene
        emotion="happy"
        isTalking={true}
        onModelLoad={onModelLoad}
        onError={onError}
      />
    )

    // All systems should work together
    await waitFor(() => {
      // 3D rendering
      expect(screen.getByTestId('three-canvas')).toBeInTheDocument()
      expect(screen.getByTestId('scene-manager')).toBeInTheDocument()
      
      // Lighting system
      expect(screen.getByTestId('lighting-system')).toBeInTheDocument()
      
      // Model rendering
      expect(screen.getByTestId('nurse-model')).toBeInTheDocument()
      
      // Visual feedback
      expect(screen.getByTestId('visual-feedback-system')).toBeInTheDocument()
      
      // UI overlays
      expect(screen.getByText('Synthesizing...')).toBeInTheDocument()
      expect(screen.getByText('Bright & caring')).toBeInTheDocument()
      expect(screen.getByText('HAPPY')).toBeInTheDocument()
    })

    // Should complete loading successfully
    await waitFor(() => {
      expect(onModelLoad).toHaveBeenCalled()
    })

    // Should not have any errors
    expect(onError).not.toHaveBeenCalled()
  })
})