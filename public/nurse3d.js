// Nuusa AI Implementation
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
let pendingExternalPlays = new Map();
let cleanupTimer = null;
let activeExternalModelKey = null;
let inactivityTimer = null;
let isExternalAnimationPlaying = false;
let lastRequestedKey = null;
const INACTIVITY_LIMIT = 60000; // 1 minute

function findBestFemaleVoice() {
    if (!speechEngine) return null;
    const voices = speechEngine.getVoices();
    // Priority: Natural English female voices
    const targets = ['Google US English Female', 'Microsoft Aria', 'Microsoft Zira', 'Google UK English Female', 'Samantha', 'Victoria'];

    for (const name of targets) {
        const found = voices.find(v => v.name.includes(name));
        if (found) return found;
    }

    // Fallback: any female voice
    return voices.find(v => v.name.toLowerCase().includes('female') && v.lang.startsWith('en')) || voices[0];
}

// Ensure voices are loaded
if (speechEngine) {
    if (speechEngine.onvoiceschanged !== undefined) {
        speechEngine.onvoiceschanged = () => { selectedVoice = findBestFemaleVoice(); };
    }
    // Initial attempt 
    setTimeout(() => { selectedVoice = findBestFemaleVoice(); }, 100);
}

// SYNTHETIC FACE STATE
const syntheticFace = {
    eyes: [],
    mouth: null,
    headBone: null,
    group: null
};

function clearAllExternalModels() {
    if (!scene) return;
    const toRemove = [];
    scene.children.forEach(child => {
        if (child.userData && child.userData.isNuusaExternal) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(obj => {
        scene.remove(obj);
        obj.traverse(node => {
            if (node.isMesh) {
                if (node.geometry) node.geometry.dispose();
                if (node.material) {
                    if (Array.isArray(node.material)) node.material.forEach(m => m.dispose());
                    else node.material.dispose();
                }
            }
        });
    });
    console.log(`[Nuusa] Ghost models purged: ${toRemove.length}`);
}

function createSyntheticFace(root) {
    // 1. Locate Head Bone
    let head = null;
    root.traverse(n => {
        if (!head && (n.name.toLowerCase().includes('head') || n.name.includes('Neck01'))) {
            head = n;
        }
    });

    if (!head) {
        console.warn('[Nuusa] Head bone not found, face might be loose');
        head = root;
    }

    syntheticFace.headBone = head;

    // 2. Clear old
    if (syntheticFace.group) scene.remove(syntheticFace.group);

    const group = new THREE.Group();
    syntheticFace.group = group;
    head.add(group); // Stick to the head!

    // Position relative to head center (Approx for robot)
    group.position.set(0, 0.08, 0.08);
    group.rotation.set(0, 0, 0);

    // EYES: Glowing blue disks
    const eyeGeom = new THREE.CircleGeometry(0.015, 32);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.9 });

    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.03, 0, 0.03);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.03, 0, 0.03);
    group.add(eyeR);

    syntheticFace.eyes = [eyeL, eyeR];

    // MOUTH: Redesigned as a "Talk Dot" aperture
    const mouthGeom = new THREE.CircleGeometry(0.02, 32);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.8 });
    const mouth = new THREE.Mesh(mouthGeom, mouthMat);
    mouth.position.set(0, -0.04, 0.035); // Slightly more forward
    group.add(mouth);
    syntheticFace.mouth = mouth;

    console.log('[Nuusa] Synthetic face activated & parented to:', head.name);
}

function updateSyntheticFace(delta) {
    if (!syntheticFace.group) return;

    const time = clock.elapsedTime;

    // EYE Pulsing (Subtle)
    syntheticFace.eyes.forEach(eye => {
        const pulse = 0.9 + Math.sin(time * 2) * 0.1;
        eye.scale.set(pulse, pulse, 1);
    });

    // MOUTH Speaking animation
    if (isTalking || isTalkingLoopActive) {
        // High frequency "vocal" jitter
        const jitter = Math.sin(time * 40) * 0.5 + 0.5;
        const talkScale = 0.5 + (jitter * 1.5);

        syntheticFace.mouth.scale.set(talkScale, talkScale, 1);
        syntheticFace.mouth.material.opacity = 0.9 + Math.sin(time * 10) * 0.1;
    } else {
        // Quiet state: Tiny dot
        syntheticFace.mouth.scale.x = THREE.MathUtils.lerp(syntheticFace.mouth.scale.x, 0.15, 0.1);
        syntheticFace.mouth.scale.y = THREE.MathUtils.lerp(syntheticFace.mouth.scale.y, 0.05, 0.1);
        syntheticFace.mouth.material.opacity = 0.4;
    }
}

// HELPER: SET MODEL OPACITY
function setModelOpacity(obj, alpha) {
    if (!obj) return;
    obj.traverse((child) => {
        if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
                m.transparent = alpha < 1.0;
                m.opacity = alpha;
            });
        }
    });
}

// HELPER: FADE MODEL
function fadeModel(obj, targetAlpha, duration = 250, onComplete = null) {
    if (!obj) { if (onComplete) onComplete(); return; }
    let startTime = null;
    let startVal = obj.userData.currentOpacity !== undefined ? obj.userData.currentOpacity : 1.0;
    const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1.0);
        const currentAlpha = startVal + (targetAlpha - startVal) * progress;
        setModelOpacity(obj, currentAlpha);
        obj.userData.currentOpacity = currentAlpha;
        if (progress < 1.0) requestAnimationFrame(step);
        else if (onComplete) onComplete();
    };
    requestAnimationFrame(step);
}

// HELPER: CLEANUP EXTERNAL MODELS
function cleanupExternalModel(fallbackEmotion = 'neutral') {
    isExternalAnimationPlaying = false;
    hideAnimationStatus();

    if (externalModel) {
        const toRem = externalModel;
        fadeModel(toRem, 0, 250, () => {
            if (scene) scene.remove(toRem);
            if (externalModel === toRem) {
                externalModel = null;
                activeExternalModelKey = null;
            }
        });
    }

    if (externalModelMixer) {
        externalModelMixer.stopAllAction();
        externalModelMixer = null;
    }

    cleanupTimer = null;

    if (model) {
        model.visible = true;
        fadeModel(model, 1.0, 250);
    }

    setEmotion(fallbackEmotion);
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (!isTalking && !isTalkingLoopActive) {
            console.log('[Nuusa] Inactivity reached, playing rest animation');
            playExternalModelAnimation('rest', 'neutral');
        }
        resetInactivityTimer(); // Reschedule
    }, INACTIVITY_LIMIT);
}

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
    rest: { label: 'Steady reset', color: 0x9fd7ff, tilt: 0, turn: 0, bob: 0.01, eyeColor: 0xbfe8ff },
    // Mappings for external animations to reuse existing states
    'talking 1': { label: 'Speaking guidance', color: 0x5be4ff, tilt: -0.02, turn: 0, bob: 0.03, eyeColor: 0xaaf8ff },
    'talking 2': { label: 'Speaking guidance', color: 0x5be4ff, tilt: -0.02, turn: 0, bob: 0.03, eyeColor: 0xaaf8ff },
    'no.glb': { label: 'Gentle decline', color: 0xffd0d0, tilt: 0.03, turn: -0.02, bob: 0.018, eyeColor: 0xffe3e3 }
};

const responseLibrary = [
    {
        match: /\b(die|suicide|kill myself|harm myself|end it all|want to die)\b/i,
        text: "No, please don't say that. Your life is incredibly valuable. I'm here to support you, and there are people who want to help. Let's talk about what's making you feel this way.",
        emotion: 'no'
    },
    {
        match: /\b(hi|hello|hey|greetings|greet|Nuusa)\b/i,
        text: "Hello! I'm Nuusa, your digital counselor. I'm here to listen and support you. How are you feeling today?",
        emotion: 'hi'
    },
    {
        match: /(who are you|your name|what is your name)/i,
        text: "I am Nuusa. I've been designed to provide emotional support and guidance during our sessions together.",
        emotion: 'happy'
    },
    {
        match: /(pain|ache|hurt|cramp|sore|injury)/i,
        text: "I hear that you're in discomfort. I'm here to help you manage how you're feeling and track your well-being.",
        emotion: 'sad'
    },
    {
        match: /(stress|anxiety|worried|scared|fear|sad)/i,
        text: "It's completely natural to feel that way. Take a slow, deep breath with me. I'm right here with you.",
        emotion: 'listening'
    },
    {
        match: /(better|thank|thanks|great|awesome|good)/i,
        text: "That makes me very happy to hear! Maintaining that positive momentum is so important. I'll stay right here if you need more support.",
        emotion: 'happy'
    },
    {
        match: null,
        text: "I'm listening. Tell me more about what's on your mind, and we'll navigate it together.",
        emotion: 'neutral'
    }
];

// Initialize Three.js scene
function initNurse3D() {
    console.log('Initializing Nuusa AI...');

    sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error('Scene container missing');
        return;
    }

    const { clientWidth, clientHeight } = sceneContainer;

    scene = new THREE.Scene();
    scene.background = null; // Important: Allows CSS background to show through

    camera = new THREE.PerspectiveCamera(50, clientWidth / clientHeight, 0.1, 100);
    camera.position.set(0, 1.4, 3);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false
    });
    renderer.setSize(clientWidth, clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for perf
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

    initVoiceEngine();
    initTestingControls();
    triggerGreetingWave();

    // Inactivity tracking
    resetInactivityTimer();
    sceneContainer.addEventListener('pointerdown', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);

    // Start animation loop
    animate();
}

function setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(2, 3, 2);
    mainLight.castShadow = false;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xbad7ff, 0.8);
    fillLight.position.set(-2, 2, 1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    emotionLight = new THREE.PointLight(0x6be4ff, 1.5, 12);
    emotionLight.position.set(0, 1.6, 1.5);
    scene.add(emotionLight);
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(
        '/nurse+robot+3d+model.glb',
        (gltf) => {
            model = gltf.scene;

            model.traverse((child) => {
                if (child.isMesh) {
                    const lowName = child.name.toLowerCase();
                    // HIDE OLD EYES
                    if (lowName.includes('eye') || lowName.includes('iris') || lowName.includes('pupil') || lowName.includes('lens')) {
                        child.visible = false;
                        return;
                    }

                    if (child.material) {
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
            createSyntheticFace(model);
            model.scale.set(1.8, 1.8, 1.8);
            model.position.y = 1.1;
            model.updateMatrixWorld(true);
            modelBounds = new THREE.Box3().setFromObject(model);

            availableAnimations = gltf.animations || [];
            mixer = new THREE.AnimationMixer(model);

            if (availableAnimations.length > 0) {
                playAnimation(emotionClips.neutral);
            }

            fitCameraToModel(model);
            setEmotion('neutral');

            const loadingOverlay = document.getElementById('loading');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        },
        undefined,
        (error) => {
            console.error('Error loading model:', error);
            const loadingOverlay = document.getElementById('loading');
            if (loadingOverlay) {
                loadingOverlay.innerHTML = '<p>Unable to load 3D nurse. Check console for details.</p>';
            }
        }
    );
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
            || availableAnimations.find(({ name }) => name.toLowerCase().includes(normalized))
            || availableAnimations[0];
    }

    clipAliasCache.set(targetName, clip || null);
    return clip || null;
}

function setEmotion(emotion, options = {}) {
    // Normalize emotion key
    if (typeof emotion === 'string') emotion = emotion.toLowerCase();

    if (!emotionStates[emotion]) {
        // Fallback or mapping
        if (emotion.includes('talking')) emotion = 'talking';
        else emotion = 'neutral';
    }
    currentEmotion = emotion;

    const state = emotionStates[emotion];
    expressionTargets.tilt = state.tilt;
    expressionTargets.turn = state.turn;
    expressionTargets.bob = state.bob;

    if (emotionLight) {
        emotionLight.color.set(state.color);
        emotionLight.intensity = 1.5 + Math.abs(state.bob * 40);
    }

    if (!options.skipAnimation) {
        playAnimation(emotionClips[emotion]);
    }
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

    const baseRotationY = -Math.PI / 2;
    const targetY = baseRotationY + desiredTurn;

    model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetY, 0.08);
    model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, desiredTilt, 0.08);

    const elapsed = clock.elapsedTime || 0;
    const bobOffset = Math.sin(elapsed * 2.2) * expressionTargets.bob;
    model.position.y = 1.1 + bobOffset;
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

    if (mixer) mixer.update(delta);
    if (externalModelMixer) externalModelMixer.update(delta);
    if (controls) controls.update();

    updateHeadPose(delta);
    updateSyntheticFace(delta);

    if (isTalking && emotionLight) {
        const pulse = Math.sin(clock.elapsedTime * 8) * 0.5 + 0.5;
        emotionLight.intensity = 1.5 + pulse * 2.5;
        emotionLight.color.setHex(0x5be4ff);
    }

    renderer.render(scene, camera);
}

function initVoiceEngine() {
    if (!speechEngine) return;

    // Soothing female voices prioritized
    const preferredVoiceKeywords = ['google us english', 'samantha', 'victoria', 'premium', 'female', 'zira', 'amy', 'salli', 'jenny', 'emma'];

    const selectVoice = () => {
        const voices = speechEngine.getVoices();
        if (!voices.length) return;

        selectedVoice = voices.find((voice) => {
            const name = voice.name.toLowerCase();
            return preferredVoiceKeywords.some((keyword) => name.includes(keyword)) && voice.lang.startsWith('en');
        }) || voices.find((voice) => voice.lang.toLowerCase().includes('female')) || voices[0];

        console.log(`[Nuusa] Selected voice: ${selectedVoice ? selectedVoice.name : 'Default'}`);
    };

    selectVoice();
    if (speechEngine.onvoiceschanged !== undefined) {
        speechEngine.onvoiceschanged = () => {
            if (!selectedVoice) selectVoice();
        };
    }
}

function startTalkingLoop() {
    if (isTalkingLoopActive) return;
    isTalkingLoopActive = true;

    const playNext = () => {
        if (!isTalkingLoopActive) {
            cleanupExternalModel('neutral');
            return;
        }

        const animName = talkingAnimations[currentTalkAnimIndex];
        currentTalkAnimIndex = (currentTalkAnimIndex + 1) % talkingAnimations.length;

        console.log(`[Nuusa] Looping animation: ${animName}`);
        playExternalModelAnimation(animName, 'neutral', {
            onComplete: () => {
                if (isTalkingLoopActive) {
                    // Small delay between clips for natural feel
                    talkingTimeout = setTimeout(playNext, 100);
                } else {
                    cleanupExternalModel('neutral');
                }
            }
        });
    };

    playNext();
}

function stopTalkingLoop() {
    isTalkingLoopActive = false;
    if (talkingTimeout) clearTimeout(talkingTimeout);
}

function speakResponse(text, baselineEmotion = 'neutral') {
    clearTimeout(talkingTimeout);
    stopTalkingLoop();
    resetInactivityTimer();

    // Kill any existing audio
    if (window.currentBotAudio) {
        window.currentBotAudio.pause();
        window.currentBotAudio = null;
    }

    const lowText = text.trim().toLowerCase();
    let startAnimation = null;

    if (/^(hi|hello|hey|greetings|greet|Nuusa)\b/i.test(lowText)) {
        startAnimation = 'hi';
    } else if (/^no\b/i.test(lowText) || lowText.includes('no, please')) {
        startAnimation = 'no';
    }

    const onSpeakStart = () => {
        isTalking = true;
        setEmotion('talking', { skipAnimation: true });

        if (startAnimation) {
            playExternalModelAnimation(startAnimation, 'neutral', {
                onComplete: () => { if (isTalking) startTalkingLoop(); }
            });
        } else {
            startTalkingLoop();
        }
    };

    const onSpeakEnd = () => {
        isTalking = false;
        stopTalkingLoop();
        cleanupExternalModel(baselineEmotion);
        resetInactivityTimer();
    };

    // DYNAMIC SPEECH SYNTHESIS (TTS)
    if (!speechEngine) {
        onSpeakStart();
        const duration = Math.min(8000, Math.max(2000, text.length * 60));
        talkingTimeout = setTimeout(onSpeakEnd, duration);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.onstart = onSpeakStart;
    utterance.onend = onSpeakEnd;
    utterance.onerror = () => onSpeakEnd();

    speechEngine.cancel();
    speechEngine.speak(utterance);
}

function cancelSpeech() {
    if (speechEngine) speechEngine.cancel();
    if (window.currentBotAudio) {
        window.currentBotAudio.pause();
        window.currentBotAudio = null;
    }
    clearTimeout(talkingTimeout);
    isTalking = false;
}

function triggerGreetingWave() {
    if (isExternalAnimationPlaying || isTalking) return;

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
    setTimeout(() => {
        if (!isTalking && !isExternalAnimationPlaying) setEmotion('neutral');
    }, 2600);
}

function showAnimationStatus(animationName) {
    const statusEl = document.getElementById('animation-status');
    if (statusEl) {
        const textEl = statusEl.querySelector('span:last-child');
        if (textEl) {
            textEl.textContent = `Playing: ${animationName}`;
        }
        statusEl.style.opacity = '1';
        statusEl.style.transform = 'translateY(0)';
    }
}

function hideAnimationStatus() {
    const statusEl = document.getElementById('animation-status');
    if (statusEl) {
        statusEl.style.opacity = '0';
        statusEl.style.transform = 'translateY(-12px)';
    }
}

function playExternalModelAnimation(key, fallbackEmotion = 'neutral', options = {}) {
    if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }

    const thisRequestId = Math.random().toString(36).substring(7);
    lastRequestedKey = thisRequestId;
    isExternalAnimationPlaying = true;
    showAnimationStatus(key);

    const targetSet = key.startsWith('Talking') ? 'talking_set' : key;

    // 1. REUSE EXISTING MODEL IF POSSIBLE
    if (externalModel && activeExternalModelKey === targetSet) {
        if (!externalModelMixer || !externalModel.userData.clips) return;
        const clip = THREE.AnimationClip.findByName(externalModel.userData.clips, key) || externalModel.userData.clips[0];

        // FILTER TRACKS TO PREVENT DRIFT (REUSE CASE)
        clip.tracks = clip.tracks.filter(track => {
            const n = track.name.toLowerCase();
            if (track.name.endsWith('.position')) return false;
            const baseLock = ['leg', 'knee', 'foot', 'toe', 'hips', 'root'];
            if (baseLock.some(kw => n.includes(kw))) return false;
            const bodyLock = ['spine', 'clavicle', 'armpit', 'scapula', 'shoulder_base'];
            if (bodyLock.some(kw => n.includes(kw))) return false;
            if (track.name.endsWith('.quaternion') && /^(Hips|Root|mixamorigHips|Character)/i.test(track.name)) return false;
            return true;
        });

        const action = externalModelMixer.clipAction(clip);
        externalModelMixer.stopAllAction();
        action.reset().setLoop(THREE.LoopOnce, 0).fadeIn(0.1).play();

        if (!options.onComplete) {
            cleanupTimer = setTimeout(() => {
                if (lastRequestedKey === thisRequestId) cleanupExternalModel(fallbackEmotion);
            }, (clip.duration * 1000) + 100);
        }
        return;
    }

    // 2. LOAD NEW MODEL (SNAP-SWAP)
    function onLoadSuccess(loadedScene, loadedAnimations) {
        if (lastRequestedKey !== thisRequestId) return;

        // Prepare Off-Scene
        const newModel = loadedScene;
        newModel.userData.isNuusaExternal = true;
        newModel.userData.clips = loadedAnimations;
        newModel.scale.set(180, 180, 180);
        newModel.position.set(0, 1.1, 0);
        newModel.rotation.set(0, -Math.PI / 2, 0);

        newModel.traverse(c => {
            if (c.isMesh) {
                const n = c.name.toLowerCase();
                c.visible = !n.includes('eye') && !n.includes('floor') && !n.includes('plane') && !n.includes('ground');
                c.frustumCulled = false;
            }
        });

        // THE SNAP SWAP: Remove old, add new instantly
        clearAllExternalModels();
        scene.add(newModel);
        createSyntheticFace(newModel);
        if (model) model.visible = false;

        const mixer = new THREE.AnimationMixer(newModel);
        if (options.onComplete) mixer.addEventListener('finished', options.onComplete);

        const clip = (loadedAnimations && loadedAnimations.length > 0)
            ? (THREE.AnimationClip.findByName(loadedAnimations, key) || loadedAnimations[0])
            : null;

        if (clip) {
            // FILTER TRACKS TO PREVENT DRIFT/ROTATION
            clip.tracks = clip.tracks.filter(track => {
                const n = track.name.toLowerCase();
                // 1. Position locking (No flying/walking)
                if (track.name.endsWith('.position')) return false;
                // 2. Base skeleton locking (Legs/Feet/Root)
                const baseLock = ['leg', 'knee', 'foot', 'toe', 'hips', 'root'];
                if (baseLock.some(kw => n.includes(kw))) return false;
                // 3. Stabilization for armor/body
                const bodyLock = ['spine', 'clavicle', 'armpit', 'scapula', 'shoulder_base'];
                if (bodyLock.some(kw => n.includes(kw))) return false;
                // 4. Force Root/Hips to stay orientation-locked
                if (track.name.endsWith('.quaternion') && /^(Hips|Root|mixamorigHips|Character)/i.test(track.name)) return false;
                return true;
            });

            const action = mixer.clipAction(clip);
            action.reset().setLoop(THREE.LoopOnce, 0);
            action.clampWhenFinished = true;
            action.play();

            if (!options.onComplete) {
                cleanupTimer = setTimeout(() => {
                    if (lastRequestedKey === thisRequestId) cleanupExternalModel(fallbackEmotion);
                }, (clip.duration * 1000) + 100);
            }
        }

        externalModel = newModel;
        externalModelMixer = mixer;
        activeExternalModelKey = targetSet;
        setEmotion(key, { skipAnimation: true });
    }

    if (modelCache.has(key)) {
        const cached = modelCache.get(key);
        onLoadSuccess(THREE.SkeletonUtils.clone(cached.scene), cached.animations);
        return;
    }

    let fileName = `${key}.glb`;
    if (key === 'yes') fileName = 'Head Nod Yes.glb';
    if (key === 'Talking 1') fileName = 'Talking 1.glb';
    if (key === 'Talking 2') fileName = 'Talking 2.glb';

    (new THREE.GLTFLoader()).load(`/${encodeURIComponent(fileName)}`, (gltf) => {
        modelCache.set(key, { scene: gltf.scene, animations: gltf.animations });
        onLoadSuccess(gltf.scene, gltf.animations);
    }, undefined, () => { if (lastRequestedKey === thisRequestId) cleanupExternalModel(fallbackEmotion); });
}

function initTestingControls() {
    const hiBtn = document.getElementById('play-hi');
    const noBtn = document.getElementById('play-no');
    const talking1Btn = document.getElementById('play-talking1');
    const talking2Btn = document.getElementById('play-talking2');
    const restBtn = document.getElementById('play-rest');

    const attach = (btn, animationKey, useExternalModel = false) => {
        if (!btn) {
            console.error(`Button not found for ${animationKey}`);
            return;
        }
        btn.addEventListener('click', () => {
            console.log(`Button clicked: ${animationKey}`);
            if (useExternalModel) {
                // Use external GLB model for this animation
                playExternalModelAnimation(animationKey, 'neutral', { debug: true });
            } else {
                // Use built-in emotion system
                setEmotion(animationKey);
                setTimeout(() => setEmotion('neutral'), 2000);
            }
        });
    };

    // Map animations to their respective handling methods
    attach(hiBtn, 'hi', true);
    attach(noBtn, 'no', true);
    attach(talking1Btn, 'Talking 1', true);
    attach(talking2Btn, 'Talking 2', true);
    attach(restBtn, 'rest', true);

    console.log('[Nurse3D] Animation test buttons initialized');
}

// Global function to test animations from console
window.testAnimation = function (animationName) {
    console.log(`Testing animation: ${animationName}`);
    playExternalModelAnimation(animationName, 'neutral', { debug: true });
};

// Debug function to list available GLB files
window.listAnimations = function () {
    console.log('Available animation GLB files:');
    console.log('- hi.glb (Hi animation)');
    console.log('- No.glb (No/shake head animation)');
    console.log('- Talking 1.glb (First talking animation)');
    console.log('- Talking 2.glb (Second talking animation)');
    console.log('- rest.glb (Rest/idle animation)');
    console.log('- Head Nod Yes.glb (Yes/nod animation)');
    console.log('');
    console.log('Usage: testAnimation("hi") or testAnimation("Talking 1")');
};

// Global functions to initialize from React component
window.initNurse3D = initNurse3D;
window.speakResponse = speakResponse;
window.setEmotion = setEmotion;
window.playExternalModelAnimation = playExternalModelAnimation;
window.responseLibrary = responseLibrary;
