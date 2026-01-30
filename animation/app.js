// Scene + expression state
let scene, camera, renderer, model, mixer, clock, controls, emotionLight, gltfLoader;
let availableAnimations = [];
let currentEmotion = 'neutral';
let isTalking = false;
let blinkTimeout;
let talkingTimeout;
let greetTimeout;
let statusDisplay;
let sceneContainer;
let baseModelY = -0.4;
let modelBounds;
let modelSkeletonRoot;
let selectedVoice = null;
let externalModel;
let externalModelMixer;
const pointerTargets = { tilt: 0, turn: 0 };
const pointerInfluence = { tilt: 0, turn: 0 };
const expressionTargets = { tilt: 0, turn: 0, bob: 0.02 };
const eyeIndicators = [];
const enableSyntheticEyes = false;
const speechEngine = (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null;
const clipAliasCache = new Map();
const externalAnimations = new Map();
const externalAnimationSources = new Map();
const pendingExternalPlays = new Map();
let cleanupTimer = null; // Store timer ID to cancel it on new plays

// TALKING LOOP STATE
const modelCache = new Map();
let isTalkingLoopActive = false;
let currentTalkAnimIndex = 0;
const talkingAnimations = ['Talking 1', 'Talking 2'];

const emotionClips = {
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
};

const oneShotClips = new Set(['Hi', 'Yes', 'No']);

const emotionStates = {
    neutral: { label: 'Calm focus', color: 0x6be4ff, tilt: 0, turn: 0, bob: 0.018, eyeColor: 0x9bf7ff },
    happy: { label: 'Bright & caring', color: 0xb3ffcb, tilt: -0.04, turn: 0.02, bob: 0.028, eyeColor: 0xffffff },
    sad: { label: 'Soft empathy', color: 0x88a5ff, tilt: 0.05, turn: 0, bob: 0.012, eyeColor: 0x92a8ff },
    thinking: { label: 'Analyzing signal', color: 0xf9cc58, tilt: 0.02, turn: 0.04, bob: 0.015, eyeColor: 0xffe6a7 },
    talking: { label: 'Speaking guidance', color: 0x5be4ff, tilt: -0.02, turn: 0, bob: 0.03, eyeColor: 0xaaf8ff },
    listening: { label: 'Listening closely', color: 0x35d4ff, tilt: -0.03, turn: -0.03, bob: 0.02, eyeColor: 0x7dd3fc },
    hi: { label: 'Warm hello', color: 0xb7f5ff, tilt: -0.05, turn: 0.03, bob: 0.03, eyeColor: 0xffffff },
    yes: { label: 'Affirming nod', color: 0x9fe8ff, tilt: -0.01, turn: 0, bob: 0.02, eyeColor: 0xb9f3ff },
    no: { label: 'Gentle decline', color: 0xffd0d0, tilt: 0.03, turn: -0.02, bob: 0.018, eyeColor: 0xffe3e3 },
    rest: { label: 'Steady reset', color: 0x9fd7ff, tilt: 0, turn: 0, bob: 0.01, eyeColor: 0xbfe8ff }
};

function playExternalModelAnimation(key, fallbackEmotion = 'neutral', options = {}) {
    console.log(`Loading ${key}.glb file - MUST show full body with original animation`);

    // CANCEL PENDING CLEANUP
    if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        cleanupTimer = null;
    }

    // HOLD REFERENCE TO OLD MODEL (Don't remove yet)
    // We will remove it ONLY when the new one is ready to show.
    let oldExternalModel = externalModel;

    // Stop mixer but don't nullify it yet? Actually, we neeed a new mixer for the new model.
    // If we stop it, the old model might freeze. Let's keep it playing until swap?
    // But we reuse `externalModelMixer` variable...
    // Let's create a temporary variable for the new mixer in the loader?
    // Current architecture uses single global `externalModelMixer`.
    // If we stop it now, the old model freezes. That's better than disappearing.
    if (externalModelMixer) {
        externalModelMixer.stopAllAction();
        externalModelMixer = null;
    }

    // De-reference global externalModel so new logic handles it, 
    // but we keep oldExternalModel for removal later.
    externalModel = null;

    // Hide main model -- DEFERRED TO LOAD CALLBACK to prevent blink
    // if (model) model.visible = false;

    // DON'T STORE CAMERA POSITION - KEEP IT EXACTLY WHERE IT IS
    // No camera position storage or changes

    // Load the GLB file directly to get the REAL animation
    const loader = new THREE.GLTFLoader();

    // CHECK CACHE FIRST
    if (modelCache.has(key)) {
        console.log(`Loading ${key} from CACHE`);
        const cachedGltf = modelCache.get(key);
        const clonedScene = THREE.SkeletonUtils.clone(cachedGltf.scene);
        onLoadSuccess(clonedScene, cachedGltf.animations);
        return;
    }

    loader.load(
        `${key}.glb`,
        function (gltf) {
            console.log(`✅ Loaded ${key}.glb successfully`);

            // CACHE IT
            modelCache.set(key, { scene: gltf.scene, animations: gltf.animations });

            onLoadSuccess(gltf.scene, gltf.animations);
        },
        function (progress) {
            console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
        },
        function (error) {
            console.error(`Failed to load ${key}.glb:`, error);
            cleanup(key);
        }
    );

    function onLoadSuccess(loadedScene, loadedAnimations) {
        console.log('Animations found:', loadedAnimations.length);

        externalModel = loadedScene;

        // REMOVE OLD MODEL NOW (Seamless Swap)
        if (oldExternalModel) {
            scene.remove(oldExternalModel);
            oldExternalModel = null; // GC
        }

        // Make sure all meshes are visible
        externalModel.traverse((child) => {
            if (child.isMesh) {
                child.visible = true;
                child.frustumCulled = false;

                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1.0;
                        });
                    } else {
                        child.material.transparent = false;
                        child.material.opacity = 1.0;
                    }
                }
            }
        });

        // ADJUSTED SCALE AND POSITION - ATTEMPT 3
        const ADJUSTED_SCALE = 180.0;

        // Apply scale
        externalModel.scale.set(ADJUSTED_SCALE, ADJUSTED_SCALE, ADJUSTED_SCALE);

        // POSITON ADJUSTMENT
        externalModel.position.set(0, 0.9, 0);

        // ROTATE TO FACE FORWARD (Attempt 4)
        externalModel.rotation.set(0, -Math.PI / 2, 0);

        scene.add(externalModel);

        // PREVENT DUPLICATION: Force hide main model again just in case
        if (model) {
            model.visible = false;
        }

        externalModel.updateMatrixWorld(true);

        if (loadedAnimations && loadedAnimations.length > 0) {
            externalModelMixer = new THREE.AnimationMixer(externalModel);

            // Handle completion callback
            if (options.onComplete) {
                externalModelMixer.addEventListener('finished', options.onComplete);
            }

            loadedAnimations.forEach((clip, index) => {
                // REMOVE ROOT MOTION (Position is globally removed)
                // REMOVE ROOT ROTATION specifically (Hips/Root) to prevent turning left
                // while keeping other animations active.
                clip.tracks = clip.tracks.filter(track => {
                    const isPosition = track.name.endsWith('.position');
                    const isRotation = track.name.endsWith('.quaternion');
                    const isRootNode = /^(Hips|Root|mixamorigHips|Character)/i.test(track.name);

                    if (isPosition) return false; // Remove all root position movement
                    if (isRotation && isRootNode) return false; // Remove root rotation only

                    return true;
                });

                const action = externalModelMixer.clipAction(clip);
                action.reset();
                action.clampWhenFinished = true;
                action.setLoop(THREE.LoopOnce, 0);

                // FLUENT ANIMATION SETTINGS
                action.timeScale = 1.0; // Normal speed for fluency
                action.fadeIn(0.3); // Smooth fade in
                action.play();
            });

            // Clean up after animation duration
            // NO FADE OUT. Just swap instantly to prevent "drift to T-pose".
            // User wants it to "not stop" (meaning not break flow).
            // ONLY CLEANUP IF NOT IN A LOOP LOOP (checked via onComplete/options)
            // If onComplete is set, we let the mixer finish event handle logic?
            // Actually, mixer 'finished' event is reliable for LoopOnce.
            // Let's use that for loop logic.
            // But we still need fallback if no onComplete?

            if (!options.onComplete) {
                const animationDuration = loadedAnimations[0].duration * 1000;
                // Add a tiny buffer to ensuring clamping happened
                cleanupTimer = setTimeout(() => {
                    cleanup(key);
                }, animationDuration + 100);
            }

        } else {
            console.log('No animations in GLB file');
            setTimeout(() => {
                cleanup(key);
            }, 3000);
        }

        setEmotion(key, { skipAnimation: true });
    }
    // Callback arguments removed (they were misplaced outside loader.load)

    function cleanup(key) {
        console.log(`Cleaning up ${key}.glb - keeping camera exactly where it is`);

        if (externalModel) {
            scene.remove(externalModel);
            externalModel = null;
        }

        if (externalModelMixer) {
            externalModelMixer.stopAllAction();
            externalModelMixer = null;
        }

        // CLEAR TIMER REF
        cleanupTimer = null;

        // ABSOLUTELY NO CAMERA CHANGES
        // Don't touch camera.position, controls.target, or controls.update()
        // Keep camera exactly where user left it

        // Show main model smoothly
        if (model) {
            model.visible = true;
        }

        // Return to fallback emotion
        setEmotion(fallbackEmotion);
    }
}

// Auto-fit camera function from the GLB viewer
function fitCameraToGLBModel(model) {
    if (!model || !camera || !controls) return;

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    console.log(`GLB Model size:`, size);
    console.log(`GLB Model center:`, center);

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance);

    // Position camera to see the full model
    const direction = new THREE.Vector3(1, 0.5, 1).normalize(); // Angled view

    controls.target.copy(center);
    camera.position.copy(center).add(direction.multiplyScalar(distance * 1.5));
    camera.lookAt(center);

    controls.update();

    console.log(`Camera positioned at distance: ${distance * 1.5}`);
    console.log(`Camera position:`, camera.position);
}


function startTalkingLoop() {
    isTalkingLoopActive = true;
    currentTalkAnimIndex = 0;
    playNextTalkAnim();
}

function playNextTalkAnim() {
    if (!isTalkingLoopActive) return;

    const animName = talkingAnimations[currentTalkAnimIndex % talkingAnimations.length];
    currentTalkAnimIndex++;

    playExternalModelAnimation(animName, 'talking', {
        onComplete: () => {
            if (isTalkingLoopActive) {
                playNextTalkAnim();
            } else {
                // Loop ended, cleanup will happen naturally or we force setEmotion
                setEmotion('neutral');
            }
        }
    });
}

function stopTalkingLoop() {
    isTalkingLoopActive = false;
    // Don't force cleanup immediately, let the current animation finish or it resets gracefully
    // But we might want to return to neutral eventually.
}

function findSkeletonRoot(root) {
    let firstSkinnedMesh = null;
    let firstBone = null;
    root.traverse((obj) => {
        if (!firstSkinnedMesh && obj && obj.isSkinnedMesh && obj.skeleton) {
            firstSkinnedMesh = obj;
        }
        if (!firstBone && obj && obj.isBone) {
            firstBone = obj;
        }
    });

    if (firstSkinnedMesh) return firstSkinnedMesh;
    if (firstBone) return firstBone;
    return null;
}

function tryRetargetExternalAnimations() {
    if (!model || !modelSkeletonRoot) return;
    if (typeof THREE === 'undefined' || !THREE.SkeletonUtils || !THREE.SkeletonUtils.retargetClip) {
        return;
    }

    for (const [key, source] of externalAnimationSources.entries()) {
        const existing = externalAnimations.get(key);
        if (existing && existing.userData && existing.userData.__retargeted) continue;
        retargetAndStoreExternalClip(key, source);
    }

    flushPendingExternalPlays();
}

function retargetAndStoreExternalClip(key, source) {
    if (!source || !source.clip || !source.root) return;
    if (!model || !modelSkeletonRoot) return;
    if (typeof THREE === 'undefined' || !THREE.SkeletonUtils || !THREE.SkeletonUtils.retargetClip) return;

    try {
        const retargeted = THREE.SkeletonUtils.retargetClip(modelSkeletonRoot, source.root, source.clip, { preservePosition: false });
        retargeted.userData = { ...(retargeted.userData || {}), __retargeted: true };
        externalAnimations.set(key, retargeted);
        console.log(`Retargeted external animation "${key}" onto GLB skeleton`);
    } catch (e) {
        console.warn(`Retargeting failed for "${key}". Falling back to raw FBX clip.`, e);
        externalAnimations.set(key, source.clip);
    }

    flushPendingExternalPlays();
}

function requestExternalAnimation(key, fallbackEmotion = 'neutral', options = {}) {
    console.log(`Request external animation: ${key}`);
    console.log('Available external animations:', Array.from(externalAnimations.keys()));
    console.log('Available external sources:', Array.from(externalAnimationSources.keys()));
    pendingExternalPlays.set(key, { fallbackEmotion, options });
    flushPendingExternalPlays();
}

function flushPendingExternalPlays() {
    if (!mixer && modelSkeletonRoot) return;
    for (const [key, payload] of pendingExternalPlays.entries()) {
        const clip = externalAnimations.get(key);
        if (!clip) continue;
        pendingExternalPlays.delete(key);
        playExternalAnimation(key, payload.fallbackEmotion, payload.options);
    }
}

function countBindableTracks(clip, targetRoot) {
    if (!clip || !clip.tracks || !targetRoot) return 0;
    let count = 0;
    for (const track of clip.tracks) {
        const trackName = track.name || '';
        const nodeName = trackName.split('.')[0];
        if (!nodeName) continue;
        if (targetRoot.getObjectByName(nodeName)) count += 1;
    }
    return count;
}

const responseLibrary = [
    {
        match: /(pain|ache|hurt|cramp|sore|injury)/i,
        text: "I hear that you're in discomfort. Let's log the exact location and intensity so we can track trends and suggest relief tactics.",
        emotion: 'sad'
    },
    {
        match: /(medicin|pill|drug|dosage|dose)/i,
        text: "I can double-check interactions and remind you of dosage windows. Which medication are you curious about right now?",
        emotion: 'thinking'
    },
    {
        match: /(stress|anxiety|worried|scared|fear)/i,
        text: "It's okay to feel uneasy. Let's slow breathing together and note any triggers so we can calm the nervous system.",
        emotion: 'listening'
    },
    {
        match: /(better|thank|thanks|great|awesome)/i,
        text: "That makes me glad. I'll stay attentive so the next moment you need support, I'm already tuned in.",
        emotion: 'happy'
    },
    {
        match: null,
        text: "I'm here for symptom journaling, vitals, and emotional check-ins. Tell me what's top of mind and we'll navigate it together.",
        emotion: 'neutral'
    }
];

// Initialize Three.js scene and chat
function init() {
    sceneContainer = document.getElementById('scene-container');
    statusDisplay = document.getElementById('ai-status');
    if (!sceneContainer) {
        console.error('Scene container missing');
        return;
    }

    const { clientWidth, clientHeight } = sceneContainer;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060d); // Back to original dark background

    camera = new THREE.PerspectiveCamera(50, clientWidth / clientHeight, 0.1, 100);
    camera.position.set(0, 1.4, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(clientWidth, clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    sceneContainer.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.target.set(0, 1.25, 0);
    controls.minDistance = 1.2;
    controls.maxDistance = 6;

    clock = new THREE.Clock();

    setupLights();
    loadModel();

    window.addEventListener('resize', onWindowResize);
    sceneContainer.addEventListener('pointermove', handlePointerMove);
    sceneContainer.addEventListener('pointerleave', resetPointerTarget);
    window.addEventListener('blur', cancelSpeech);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelSpeech();
    });

    initChat();
    initVoiceEngine();
    initExternalAnimationLoader();
    initTestingControls();
    triggerGreetingWave();
}

function initVoiceEngine() {
    if (!speechEngine) return;

    const preferredVoiceKeywords = ['aria', 'zira', 'female', 'salli', 'jenny', 'emma'];

    const selectVoice = () => {
        const voices = speechEngine.getVoices();
        if (!voices.length) return;

        selectedVoice = voices.find((voice) => {
            const name = voice.name.toLowerCase();
            return preferredVoiceKeywords.some((keyword) => name.includes(keyword)) && voice.lang.startsWith('en');
        }) || voices.find((voice) => voice.lang.startsWith('en')) || voices[0];
    };

    selectVoice();
    if (!selectedVoice) {
        speechEngine.addEventListener('voiceschanged', () => {
            if (!selectedVoice) selectVoice();
        }, { once: true });
    }
}

function setupLights() {
    // Increase ambient light for GLB materials
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);

    // Main directional light (key light)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(2, 3, 2);
    mainLight.castShadow = false;
    scene.add(mainLight);

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xbad7ff, 0.8);
    fillLight.position.set(-2, 2, 1);
    scene.add(fillLight);

    // Rim light for depth
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    // Emotion light (keep existing)
    emotionLight = new THREE.PointLight(0x6be4ff, 1.5, 12);
    emotionLight.position.set(0, 1.6, 1.5);
    scene.add(emotionLight);
}

function fitCameraToModel(object) {
    if (!object || !camera || !controls) return;

    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance);

    const direction = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();

    controls.target.copy(center);
    camera.position.copy(center).add(direction.multiplyScalar(distance + 0.8));
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    controls.update();
}

function loadModel() {
    const finalizeLoadedModel = (loadedScene, animations = [], label = 'model') => {
        model = loadedScene;

        // Preserve original GLB materials and textures
        model.traverse((child) => {
            if (child.isMesh) {
                // Keep original materials from GLB file
                if (child.material) {
                    // Just ensure the material is visible
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.transparent) mat.opacity = Math.max(mat.opacity, 0.8);
                        });
                    } else {
                        if (child.material.transparent) child.material.opacity = Math.max(child.material.opacity, 0.8);
                    }
                }

                child.castShadow = false;
                child.receiveShadow = false;
                child.frustumCulled = false;
            }
        });

        scene.add(model);

        model.scale.set(1.8, 1.8, 1.8);
        // MATCH EXTERNAL MODEL POSITION (Requested "starting" position)
        model.position.y = 0.9;
        model.updateMatrixWorld(true);
        modelBounds = new THREE.Box3().setFromObject(model);

        // Debug: log bounding box size and center
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        modelBounds.getSize(size);
        modelBounds.getCenter(center);
        console.log(`=== MAIN NURSE ROBOT MODEL INFO ===`);
        console.log(`${label} bounds — center:`, center, 'size:', size);
        console.log(`Model position:`, model.position);
        console.log(`Model rotation:`, model.rotation);
        console.log(`Model scale:`, model.scale);
        console.log(`Model world position:`, model.getWorldPosition(new THREE.Vector3()));
        console.log(`Model world scale:`, model.getWorldScale(new THREE.Vector3()));
        console.log(`=== END MAIN MODEL INFO ===`);

        // Debug: Check if model has meshes and materials
        let meshCount = 0;
        model.traverse((child) => {
            if (child.isMesh) {
                meshCount++;
                console.log(`Mesh ${meshCount}:`, child.name, 'Material:', child.material?.type, 'Color:', child.material?.color);
            }
        });
        console.log(`Total meshes found: ${meshCount}`);

        modelSkeletonRoot = findSkeletonRoot(model);
        if (!modelSkeletonRoot) {
            console.warn(`No skeleton root (SkinnedMesh) found in ${label}. External GLB retargeting may not work.`);
        }

        availableAnimations = animations || [];
        console.log('Loaded animations:', availableAnimations.map((clip) => clip.name));
        mixer = new THREE.AnimationMixer(model);
        if (availableAnimations.length > 0) {
            playAnimation(emotionClips.neutral);
        }

        tryRetargetExternalAnimations();
        flushPendingExternalPlays();

        if (enableSyntheticEyes) {
            createEyeIndicators();
            startBlinkLoop();
        }
        fitCameraToModel(model);
        setEmotion('neutral');

        const loadingOverlay = document.getElementById('loading');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    };

    const showModelLoadError = (error) => {
        console.error('Error loading model:', error);
        const loadingOverlay = document.getElementById('loading');
        if (loadingOverlay) {
            loadingOverlay.textContent = 'Unable to load hologram. Check console.';
        }
    };

    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
        showModelLoadError(new Error('GLTFLoader unavailable'));
        return;
    }

    const loader = new THREE.GLTFLoader();
    loader.load(
        'nurse+robot+3d+model.glb',
        (gltf) => finalizeLoadedModel(gltf.scene, gltf.animations || [], 'GLB'),
        undefined,
        showModelLoadError
    );
}

function clearEyeIndicators() {
    if (!eyeIndicators.length) return;
    while (eyeIndicators.length) {
        const { mesh } = eyeIndicators.pop();
        if (mesh.parent) mesh.parent.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }
}

function computeEyeHomes(bounds) {
    if (!bounds) return [];
    const size = bounds.getSize(new THREE.Vector3());
    const max = bounds.max;
    const min = bounds.min;
    const width = size.x;
    const height = size.y;
    const depth = size.z;

    const eyeY = min.y + height * 0.62;
    const eyeZ = max.z - depth * 0.28;
    const offsetX = Math.max(width * 0.16, 0.045);

    return [
        new THREE.Vector3(offsetX, eyeY, eyeZ),
        new THREE.Vector3(-offsetX, eyeY, eyeZ)
    ];
}

function createEyeIndicators() {
    if (!model || !enableSyntheticEyes) return;
    clearEyeIndicators();
    const homes = computeEyeHomes(modelBounds);
    const eyeGeometry = new THREE.SphereGeometry(0.028, 24, 24);

    homes.forEach((home) => {
        const material = new THREE.MeshBasicMaterial({ color: emotionStates[currentEmotion].eyeColor });
        const eye = new THREE.Mesh(eyeGeometry, material);
        eye.position.copy(home);
        model.add(eye);
        eyeIndicators.push({ mesh: eye, home: home.clone() });
    });
}

function startBlinkLoop() {
    if (!enableSyntheticEyes || !eyeIndicators.length) return;
    clearTimeout(blinkTimeout);

    blinkTimeout = setTimeout(() => {
        eyeIndicators.forEach(({ mesh }) => mesh.scale.set(1, 0.15, 1));
        setTimeout(() => {
            eyeIndicators.forEach(({ mesh }) => mesh.scale.set(1, 1, 1));
            startBlinkLoop();
        }, 130);
    }, 2200 + Math.random() * 2000);
}

function handlePointerMove(event) {
    if (!sceneContainer) return;
    const rect = sceneContainer.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    pointerTargets.turn = THREE.MathUtils.clamp((x - 0.5) * 0.6, -0.3, 0.3);
    pointerTargets.tilt = THREE.MathUtils.clamp((0.5 - y) * 0.4, -0.25, 0.25);
}

function resetPointerTarget() {
    pointerTargets.turn = 0;
    pointerTargets.tilt = 0;
}

function updateHeadPose(delta) {
    if (!model) return;

    pointerInfluence.turn += (pointerTargets.turn - pointerInfluence.turn) * 0.06;
    pointerInfluence.tilt += (pointerTargets.tilt - pointerInfluence.tilt) * 0.06;
    pointerInfluence.turn = THREE.MathUtils.clamp(pointerInfluence.turn, -0.35, 0.35);
    pointerInfluence.tilt = THREE.MathUtils.clamp(pointerInfluence.tilt, -0.25, 0.25);

    const desiredTurn = expressionTargets.turn + pointerInfluence.turn;
    const desiredTilt = expressionTargets.tilt + pointerInfluence.tilt;

    // BASE ROTATION: -90 degrees (-Math.PI/2) to face forward
    // Add dynamic turn to this base
    const baseRotationY = -Math.PI / 2;
    const targetY = baseRotationY + desiredTurn;

    // Lerp to the new target including base rotation
    model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetY, 0.08);
    model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, desiredTilt, 0.08);

    const elapsed = clock.elapsedTime || 0;
    const bobOffset = Math.sin(elapsed * 2.2) * expressionTargets.bob;
    // Updated base Y to 0.9
    // model.position.y = THREE.MathUtils.lerp(model.position.y, 0.9 + bobOffset, 0.07);
    model.position.y = 0.9 + bobOffset; // Direct set to avoid drift/lag


    if (enableSyntheticEyes) {
        eyeIndicators.forEach(({ mesh, home }) => {
            const target = new THREE.Vector3(
                home.x + pointerInfluence.turn * 0.08,
                home.y + pointerInfluence.tilt * 0.08,
                home.z
            );
            mesh.position.lerp(target, 0.2);
        });
    }
}

function playAnimation(animationName) {
    if (!mixer || availableAnimations.length === 0 || !animationName) return;

    const clip = resolveClipAlias(animationName);
    if (!clip) {
        console.warn(`Animation clip "${animationName}" not found in GLB.`);
        return;
    }

    mixer.stopAllAction();
    const action = mixer.clipAction(clip);
    const isOneShot = oneShotClips.has(animationName);
    action.reset();
    action.clampWhenFinished = isOneShot;
    action.setLoop(isOneShot ? THREE.LoopOnce : THREE.LoopRepeat, isOneShot ? 0 : Infinity);
    action.fadeIn(0.2).play();
}

function resolveClipAlias(targetName) {
    if (!targetName || availableAnimations.length === 0) return null;
    if (clipAliasCache.has(targetName)) {
        return clipAliasCache.get(targetName);
    }

    const normalized = targetName.toLowerCase();

    let clip = THREE.AnimationClip.findByName(availableAnimations, targetName);
    if (!clip) {
        clip = availableAnimations.find(({ name }) => name.toLowerCase() === normalized)
            || availableAnimations.find(({ name }) => name.toLowerCase().includes(normalized));
    }

    clipAliasCache.set(targetName, clip || null);
    return clip || null;
}

function setEmotion(emotion, options = {}) {
    if (!emotionStates[emotion]) emotion = 'neutral';
    currentEmotion = emotion;

    const state = emotionStates[emotion];
    expressionTargets.tilt = state.tilt;
    expressionTargets.turn = state.turn;
    expressionTargets.bob = state.bob;

    if (emotionLight) {
        emotionLight.color.set(state.color);
        emotionLight.intensity = 1.5 + Math.abs(state.bob * 40);
    }

    if (statusDisplay) {
        statusDisplay.textContent = state.label;
    }

    if (enableSyntheticEyes) {
        eyeIndicators.forEach(({ mesh }) => {
            mesh.material.color.lerp(new THREE.Color(state.eyeColor), 0.3);
        });
    }

    if (!options.skipAnimation) {
        playAnimation(emotionClips[emotion]);
    }
}

function onWindowResize() {
    if (!sceneContainer || !renderer || !camera) return;
    const { clientWidth, clientHeight } = sceneContainer;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update both mixers
    if (mixer) mixer.update(delta);
    if (externalModelMixer) {
        externalModelMixer.update(delta);
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) {
            console.log('External mixer active, delta:', delta.toFixed(4));
        }
    }

    if (controls) controls.update();

    updateHeadPose(delta);
    updateHeadPose(delta);

    // BLUE ECO EFFECT when talking
    if (isTalking && emotionLight) {
        // Pulse intensity
        const pulse = Math.sin(clock.elapsedTime * 8) * 0.5 + 0.5; // 0 to 1
        emotionLight.intensity = 1.5 + pulse * 2.5; // Range 1.5 to 4.0

        // Ensure color is blue eco
        emotionLight.color.setHex(0x5be4ff);
    }

    renderer.render(scene, camera);
}

// Chat + speech layer
function initChat() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    if (!chatMessages || !userInput || !sendBtn) return;

    addMessage('AI Nurse', "Hey there, I'm your digital care companion. Tell me anything and I'll stay with you the entire way.", 'ai');

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        addMessage('You', message, 'user');
        userInput.value = '';

        const userPhraseEmotion = detectPhraseEmotion(message);
        if (userPhraseEmotion) {
            requestExternalAnimation(userPhraseEmotion, 'listening', { cancelSpeech: false });
        } else {
            setEmotion('listening');
        }
        cancelSpeech();

        const typingIndicator = showTypingIndicator(chatMessages);
        setEmotion('thinking');

        const delay = 1200 + Math.random() * 1500;
        setTimeout(() => {
            typingIndicator.remove();
            const response = chooseResponse(message);
            const phraseEmotion = detectPhraseEmotion(response.text);
            const baselineEmotion = response.emotion;

            if (phraseEmotion) {
                requestExternalAnimation(phraseEmotion, baselineEmotion, { cancelSpeech: false });
            } else {
                setEmotion(baselineEmotion);
            }

            addMessage('AI Nurse', response.text, 'ai');
            speakResponse(response.text, baselineEmotion, { preserveEmotion: Boolean(phraseEmotion) });
        }, delay);
    }
}

function showTypingIndicator(container) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing';
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    return typingDiv;
}

function addMessage(sender, text, type) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const wrapper = document.createElement('div');
    wrapper.className = `message ${type}-message`;
    wrapper.innerHTML = `
        <span class="block text-[10px] uppercase tracking-[0.3em] opacity-70 mb-1">${sender}</span>
        <p class="leading-relaxed">${text}</p>
    `;

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function chooseResponse(userInput) {
    const entry = responseLibrary.find((item) => item.match && item.match.test(userInput))
        || responseLibrary[responseLibrary.length - 1];
    return entry;
}

function detectPhraseEmotion(text = '') {
    const normalized = text.toLowerCase();
    if (/(^|\b)(hi|hello|hey)\b/.test(normalized) && emotionStates.hi) {
        return 'hi';
    }
    if (/(^|\b)(yes|yeah|yep|affirmative)\b/.test(normalized) && emotionStates.yes) {
        return 'yes';
    }
    if (/(^|\b)(no|nope|nah|negative)\b/.test(normalized) && emotionStates.no) {
        return 'no';
    }
    return null;
}

function speakResponse(text, baselineEmotion = 'neutral', options = {}) {
    clearTimeout(talkingTimeout);

    const fallbackDuration = Math.min(4000, Math.max(1500, text.length * 40));

    const onSpeakStart = () => {
        if (!options.preserveEmotion) {
            setEmotion('talking');
        }
        isTalking = true;

        // START VISUAL LOOP
        startTalkingLoop();
    };

    const onSpeakEnd = () => {
        isTalking = false;

        // STOP VISUAL LOOP
        stopTalkingLoop();

        talkingTimeout = setTimeout(() => setEmotion(baselineEmotion), 600);
    };

    if (!speechEngine) {
        onSpeakStart();
        talkingTimeout = setTimeout(onSpeakEnd, fallbackDuration);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.08;
    utterance.pitch = 1.15;
    utterance.volume = 0.98;
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    utterance.onstart = onSpeakStart;
    utterance.onend = onSpeakEnd;

    speechEngine.cancel();
    speechEngine.speak(utterance);
}

function cancelSpeech() {
    if (speechEngine) speechEngine.cancel();
    clearTimeout(talkingTimeout);
    isTalking = false;
}

function triggerGreetingWave() {
    const bubble = document.getElementById('greet-bubble');
    if (bubble) {
        bubble.classList.remove('hide');
        bubble.classList.add('show');
        clearTimeout(greetTimeout);
        greetTimeout = setTimeout(() => {
            bubble.classList.add('hide');
        }, 3500);
    }

    const greetingEmotion = emotionStates.hi ? 'hi' : 'happy';
    setEmotion(greetingEmotion);
    setTimeout(() => setEmotion('neutral'), 2600);
}

// Start experience
init();
animate();

function initTestingControls() {
    const hiBtn = document.getElementById('play-hi');
    const noBtn = document.getElementById('play-no');
    const restBtn = document.getElementById('play-rest');

    const attach = (btn, emotion) => {
        if (!btn) {
            console.error(`Button not found for ${emotion}`);
            return;
        }
        btn.addEventListener('click', () => {
            console.log(`Button clicked: ${emotion}`);
            requestExternalAnimation(emotion, 'neutral', { debug: true });
        });
    };

    attach(hiBtn, 'hi');
    attach(noBtn, 'no');
    attach(restBtn, 'rest');

    console.log('Test buttons initialized:', { hiBtn, noBtn, restBtn });
}

function initExternalAnimationLoader() {
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
        console.warn('GLTFLoader unavailable; external animations disabled');
        return;
    }

    gltfLoader = new THREE.GLTFLoader();
    loadExternalAnimation('hi', 'hi.glb');
    loadExternalAnimation('no', 'No.glb');
    loadExternalAnimation('yes', 'Head Nod Yes.glb');
    loadExternalAnimation('rest', 'rest.glb');
}

function loadExternalAnimation(key, path) {
    if (!gltfLoader) return;
    const safePath = encodeURI(path);
    gltfLoader.load(
        safePath,
        (gltf) => {
            if (gltf.animations && gltf.animations.length > 0) {
                const clip = gltf.animations[0];
                clip.optimize();
                externalAnimationSources.set(key, { root: gltf.scene, clip });

                if (!modelSkeletonRoot) {
                    externalAnimations.set(key, clip);
                    flushPendingExternalPlays();
                }

                if (model) {
                    const bindable = countBindableTracks(clip, model);
                    if (bindable === 0) {
                        console.warn(`GLB clip "${key}" has 0 bindable tracks on main model. Retargeting will be attempted.`);
                    }
                }

                retargetAndStoreExternalClip(key, { root: gltf.scene, clip });
                console.log(`Loaded external animation "${key}" from ${path}`);
            } else {
                console.warn(`No animations found in ${path}`);
            }
        },
        undefined,
        (error) => {
            console.error(`Failed to load external animation ${path}`, error);
        }
    );
}

function playExternalAnimation(key, fallbackEmotion = 'neutral', options = {}) {
    const clip = externalAnimations.get(key);

    // If no retargeted clip available, or no skeleton root, use model swapping
    if (!clip || !modelSkeletonRoot || !mixer) {
        console.log(`Using model swapping for "${key}" (no retargeted clip or skeleton)`);
        playExternalModelAnimation(key, fallbackEmotion, options);
        return;
    }

    console.log(`Play external animation: ${key} (retargeted)`);

    const shouldCancelSpeech = options.cancelSpeech !== false;
    if (shouldCancelSpeech) cancelSpeech();

    setEmotion(key, { skipAnimation: true });
    mixer.stopAllAction();

    const action = mixer.clipAction(clip);
    action.reset();
    action.clampWhenFinished = true;
    if (options.debug) {
        action.timeScale = 0.6;
        action.setLoop(THREE.LoopRepeat, 2);
    } else {
        action.setLoop(THREE.LoopOnce, 0);
    }
    action.fadeIn(0.12).play();

    const handleFinished = (event) => {
        if (event.action === action) {
            mixer.removeEventListener('finished', handleFinished);
            setEmotion(fallbackEmotion);
        }
    };
    mixer.addEventListener('finished', handleFinished);
}
