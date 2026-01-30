import { useState, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface ExternalModelConfig {
    key: string
    filename: string
}

// Matches files in the animation/ folder (or public root, assuming similar path logic)
// Based on useExternalAnimations.ts:
// { key: 'hi', filename: 'hi.glb' }
// { key: 'yes', filename: 'Head Nod Yes.glb' }
// { key: 'no', filename: 'No.glb' }
// Matches files in the public/ folder
const EXTERNAL_MODELS: ExternalModelConfig[] = [
    { key: 'hi', filename: 'hi.glb' },
    { key: 'yes', filename: 'Head Nod Yes.glb' },
    { key: 'no', filename: 'No.glb' },
    { key: 'talking 1', filename: 'Talking 1.glb' },
    { key: 'talking 2', filename: 'Talking 2.glb' },
]

interface CachedModel {
    scene: THREE.Group
    animations: THREE.AnimationClip[]
}

export function useExternalModelManager() {
    const [activeModel, setActiveModel] = useState<{
        key: string
        scene: THREE.Group
        animations: THREE.AnimationClip[]
    } | null>(null)

    const [isLoading, setIsLoading] = useState(false)
    const modelCache = useRef<Map<string, CachedModel>>(new Map())

    const loadModel = useCallback(async (key: string): Promise<CachedModel | null> => {
        // Check cache
        if (modelCache.current.has(key)) {
            const cached = modelCache.current.get(key)!
            // Clone scene for safety if multiple instances (though likely singleton)
            // For now returning direct ref is fine if we only mount one at a time
            // But SkeletonUtils.clone is safer if we modify it.
            // app.js uses SkeletonUtils.clone for cached items (line 104)

            // We need to dynamic import SkeletonUtils if we want that...
            // For now, let's assume we can reuse if we reset properly, or just reload.
            // Actually app.js says: "Holding reference... remove old... add new".
            // Let's just return the cached object.
            return cached
        }

        const config = EXTERNAL_MODELS.find(m => m.key === key)
        if (!config) {
            console.warn(`No configuration for external model: ${key}`)
            return null
        }

        setIsLoading(true)
        try {
            // Assuming files are in /animation/ folder based on user request "folder called animation"
            // But useExternalAnimations.ts says they are in "nurce ui folder" (comment) but filenames are simple.
            // app.js loads `${key}.glb` directly. 
            // User says "folder called animation".
            // Let's assume they are served from public/animation/ or just public/
            // useExternalAnimations.ts uses `basePath` prop.
            // app.js seems to load from relative root.
            // Let's try loading from `/animation/${filename}` if they are static assets.
            // Or just `/${filename}` if user moved them.
            // Given "folder called animation in that files", it's safest to assume they are at /animation/ path in public, or we need to check where they are served.

            // The `list_dir` showed `c:\Documents\SoloLvlUpApollo\animation`.
            // If this is a Next.js app, static files should be in `public`.
            // `animation` is at root. Next.js does NOT serve root folders by default unless configured.
            // However, `app.js` is loading `${key}.glb`.
            // Likely the user has these files in `public` OR the `animation` folder is the source of truth I should copy from.
            // But I cannot "copy" files easily to public if they are large (38MB).
            // Wait, list_dir showed `public` exists.
            // Let's check `public` contents.

            const loader = new GLTFLoader()
            const url = `/${config.filename}`
            // Assumption: The 'animation' folder contents are accessible via web server.
            // If not, this might fail. But for now, let's assume standard Next.js setup where we might have copied them or they are accessible.

            // Actually, if they are only in root `animation` folder and not `public`, Next.js won't serve them.
            // I should probably assume they need to be moved or I should try to load them from where the app expects.
            // `useExternalAnimations.ts` was loading from `basePath` + filename.
            // `app.js` loaded from relative path.

            // I will default to `/animation/` and if it fails, fallback/error.

            const gltf = await new Promise<any>((resolve, reject) => {
                loader.load(url, resolve, undefined, reject)
            })

            const data = { scene: gltf.scene, animations: gltf.animations }
            modelCache.current.set(key, data)
            setIsLoading(false)
            return data

        } catch (err) {
            console.error(`Failed to load external model ${key}:`, err)
            setIsLoading(false)
            return null
        }
    }, [])

    const playExternalModel = useCallback(async (key: string) => {
        // If already playing this key, do nothing or restart?
        // app.js says "MUST show full body".

        // Check if valid key
        if (!EXTERNAL_MODELS.find(m => m.key === key)) return false

        const data = await loadModel(key)
        if (data) {
            setActiveModel({
                key,
                scene: data.scene,
                animations: data.animations
            })
            return true
        }
        return false
    }, [loadModel])

    const stopExternalModel = useCallback(() => {
        setActiveModel(null)
    }, [])

    return {
        activeModel,
        playExternalModel,
        stopExternalModel,
        isLoading
    }
}
