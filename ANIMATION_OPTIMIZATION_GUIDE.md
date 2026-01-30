# 3D Animation Optimization Guide

## Overview
This document outlines the optimizations made to improve the 3D nurse model animations, preventing overlapping, stuttering, and low frame rates.

## Key Issues Fixed

### 1. Animation Overlapping
**Problem**: Multiple animations playing simultaneously causing visual glitches
**Solution**:
- Added `mixer.stopAllAction()` before starting new animations
- Implemented proper cleanup timers with increased buffer times
- Added state management to prevent concurrent animation loads
- Ensured old models are removed before adding new ones

### 2. Frame Rate Drops
**Problem**: Low FPS and stuttering during animations
**Solutions**:
- Capped delta time to max 0.1 seconds to prevent large jumps
- Enabled frustum culling on meshes (`frustumCulled = true`)
- Disabled shadows (`castShadow = false`, `receiveShadow = false`)
- Limited pixel ratio to max 2x for high DPI displays
- Disabled stencil buffer in WebGL context
- Added animation clip optimization with `clip.optimize()`

### 3. Animation Stuttering
**Problem**: Jerky transitions between animations
**Solutions**:
- Added 50ms delay before starting new animations for clean state
- Increased transition buffer from 100ms to 300ms
- Implemented smooth fade-in (0.2s) for new animations
- Added consistent `timeScale = 1.0` to prevent speed variations
- Improved talking loop timing (100ms between animations)

### 4. Memory Leaks
**Problem**: Memory usage increasing over time
**Solutions**:
- Proper cleanup of geometries and materials on unmount
- Implemented model caching to reduce repeated loads
- Added timeout cleanup in GLBAnimationRunner
- Proper disposal of Three.js resources

## Performance Optimizations

### Canvas Settings
```typescript
gl={{
  antialias: window.devicePixelRatio <= 1, // Conditional AA
  alpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "high-performance",
  stencil: false, // Disabled for performance
  depth: true
}}
dpr={[1, 2]} // Limited pixel ratio
frameloop="always" // Continuous rendering
```

### Renderer Optimizations
```typescript
gl.shadowMap.enabled = false // Shadows disabled
gl.physicallyCorrectLights = false // Simplified lighting
gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
```

### Animation Mixer Updates
```typescript
// Cap delta to prevent jumps
const cappedDelta = Math.min(delta, 0.1)
mixer.update(cappedDelta)
```

### Track Filtering
Removed unnecessary animation tracks to prevent unwanted movement:
- Position tracks (prevents sliding)
- Root rotation (prevents spinning)
- Locked body parts (spine, legs, hips)

## Best Practices

### 1. Starting New Animations
```typescript
// Always stop previous animations first
mixer.stopAllAction()

// Add small delay for clean state
setTimeout(() => {
  const action = mixer.clipAction(clip)
  action.reset()
  action.setLoop(THREE.LoopOnce, 1)
  action.timeScale = 1.0
  action.fadeIn(0.2)
  action.play()
}, 50)
```

### 2. Cleanup Pattern
```typescript
// Set cleanup timer with buffer
const duration = clip.duration * 1000
cleanupTimer = setTimeout(() => {
  cleanup()
}, duration + 300) // 300ms buffer

// Always clear timers on unmount
return () => {
  if (cleanupTimer) clearTimeout(cleanupTimer)
  if (mixer) mixer.stopAllAction()
}
```

### 3. Model Visibility Management
```typescript
// Hide main model when showing external animation
if (modelRef.current) {
  modelRef.current.visible = false
}

// Show main model after cleanup
if (modelRef.current) {
  modelRef.current.visible = true
}
```

### 4. Mesh Optimization
```typescript
mesh.frustumCulled = true // Enable culling
mesh.castShadow = false // Disable shadows
mesh.receiveShadow = false
```

## Performance Monitoring

The app includes a performance monitor (dev mode only) that displays:
- Current FPS
- Performance status (Good/Poor)
- Frame time
- Memory usage (if available)

Threshold: 30 FPS minimum for "Good" performance

## File Changes Summary

### Modified Files:
1. `components/counseling/Enhanced3DNurseScene.tsx`
   - Optimized Canvas settings
   - Added performance-based rendering options

2. `components/counseling/ThreeJSSceneManager.tsx`
   - Capped delta time in animation loop
   - Improved state management

3. `components/counseling/GLBAnimationRunner.tsx`
   - Added proper cleanup and disposal
   - Implemented timeout management
   - Optimized track filtering
   - Added frustum culling

4. `components/counseling/NurseScene.tsx`
   - Optimized animation loop
   - Improved external animation loading
   - Better cleanup management
   - Added model caching

5. `hooks/useAnimationController.ts`
   - Fixed talking loop timing
   - Added delay for clean state transitions
   - Improved action stopping logic

## Testing Recommendations

1. **Test Animation Transitions**
   - Switch between emotions rapidly
   - Verify no overlapping occurs
   - Check for smooth transitions

2. **Test Talking Loop**
   - Enable voice and let it speak
   - Verify animations cycle smoothly
   - Check for no stuttering

3. **Performance Testing**
   - Monitor FPS during animations
   - Check memory usage over time
   - Test on different devices/browsers

4. **Stress Testing**
   - Rapid emotion changes
   - Long talking sessions
   - Multiple page visits

## Browser Compatibility

Optimizations tested on:
- Chrome/Edge (Chromium)
- Firefox
- Safari (WebKit)

Note: Performance may vary based on:
- GPU capabilities
- Device pixel ratio
- Available memory
- Browser WebGL implementation

## Future Improvements

1. **LOD (Level of Detail)**
   - Implement multiple model quality levels
   - Switch based on performance

2. **Texture Optimization**
   - Compress textures
   - Use appropriate texture sizes

3. **Animation Blending**
   - Implement smoother crossfades
   - Add transition animations

4. **Lazy Loading**
   - Load animations on-demand
   - Preload common animations

5. **Worker Threads**
   - Offload animation calculations
   - Use Web Workers for heavy processing

## Troubleshooting

### Low FPS
- Check if shadows are disabled
- Verify pixel ratio is capped
- Ensure frustum culling is enabled
- Check for memory leaks

### Animation Overlap
- Verify `stopAllAction()` is called
- Check cleanup timers are working
- Ensure proper state management

### Stuttering
- Verify delta time is capped
- Check timeScale is set to 1.0
- Ensure smooth fade-in is applied
- Verify buffer times are adequate

### Memory Issues
- Check for proper disposal
- Verify cleanup functions run
- Monitor model cache size
- Check for event listener leaks

## Contact

For issues or questions about the 3D animation system, refer to the component documentation or check the browser console for detailed logs.
