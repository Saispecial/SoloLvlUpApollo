import { useState, useEffect } from 'react'

interface WebGLDetectionResult {
  isWebGLSupported: boolean
  webGLError: string | null
  webGLVersion: string | null
}

export function useWebGLDetection(): WebGLDetectionResult {
  const [result, setResult] = useState<WebGLDetectionResult>({
    isWebGLSupported: false,
    webGLError: null,
    webGLVersion: null
  })

  useEffect(() => {
    const detectWebGL = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          return {
            isWebGLSupported: false,
            webGLError: 'Not in browser environment',
            webGLVersion: null
          }
        }

        // Create a canvas element
        const canvas = document.createElement('canvas')
        
        // Try to get WebGL2 context first
        let gl = canvas.getContext('webgl2')
        let version = 'WebGL 2.0'
        
        // Fall back to WebGL 1.0 if WebGL2 is not available
        if (!gl) {
          gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
          version = 'WebGL 1.0'
        }

        if (!gl) {
          return {
            isWebGLSupported: false,
            webGLError: 'WebGL is not supported by this browser',
            webGLVersion: null
          }
        }

        // Check for common WebGL extensions that Three.js might need
        const requiredExtensions = [
          'OES_texture_float',
          'OES_element_index_uint'
        ]

        const missingExtensions = requiredExtensions.filter(ext => !gl.getExtension(ext))
        
        if (missingExtensions.length > 0) {
          console.warn('Missing WebGL extensions:', missingExtensions)
          // Don't fail completely, just warn
        }

        // Test basic WebGL functionality
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
        
        if (!vertexShader || !fragmentShader) {
          return {
            isWebGLSupported: false,
            webGLError: 'Failed to create WebGL shaders',
            webGLVersion: null
          }
        }

        // Clean up test resources
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)

        return {
          isWebGLSupported: true,
          webGLError: null,
          webGLVersion: version
        }

      } catch (error) {
        return {
          isWebGLSupported: false,
          webGLError: error instanceof Error ? error.message : 'Unknown WebGL error',
          webGLVersion: null
        }
      }
    }

    setResult(detectWebGL())
  }, [])

  return result
}