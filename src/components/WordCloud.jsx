import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, ArcballControls, Billboard, Stars } from '@react-three/drei';
import * as THREE from 'three';
import sentencesData from '../data/velog-words.json';
import notoFontUrl from '@fontsource/noto-sans-kr/files/noto-sans-kr-korean-900-normal.woff';

function getFirstChar(text) {
    return text;
}

// Context sentences display (Black text for White background)
const ContextSentence = ({ text, isSelected, position }) => {
    const textRef = useRef();
    const targetOpacity = useRef(0);

    // Fade in effect
    useEffect(() => {
        targetOpacity.current = 1;
        return () => { targetOpacity.current = 0; };
    }, []);

    useFrame((state, delta) => {
        if (textRef.current) {
            textRef.current.fillOpacity = THREE.MathUtils.lerp(
                textRef.current.fillOpacity || 0,
                targetOpacity.current,
                delta * 3
            );
        }
    });

    return (
        <Text
            ref={textRef}
            position={position}
            fontSize={isSelected ? 0.8 : 0.5}
            font={notoFontUrl}
            color="#000000" // Black text since background will be white
            anchorX="center"
            anchorY="middle"
            maxWidth={15} // Reduced to 15 to force wrapping even on narrow screens
            textAlign="center"
            lineHeight={1.4}
            fillOpacity={0}
        >
            {text}
        </Text>
    );
};

const SentenceWrapper = ({ id, displayText, fullSentence, url, articleId, sentenceIndex, position, mouseRef, activeWordRef, onSelect, isHidden }) => {
    // ... (keep existing refs and state)
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [isTooFar, setIsTooFar] = useState(false);
    const textRef = useRef();

    const vec = new THREE.Vector3();
    const originalPos = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame((state, delta) => {
        // ... (keep existing useFrame logic exactly as is)
        // If hidden (during warp), quickly fade out and stop processing
        if (isHidden) {
            if (groupRef.current) groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, 0, delta * 10));
            return;
        } else {
            if (groupRef.current && groupRef.current.scale.x < 1) {
                groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, 1, delta * 5));
            }
        }

        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        const camera = state.camera;

        const movementRadius = 0.3;
        const idleX = Math.sin(time * 0.5 + originalPos.x * 0.1) * movementRadius;
        const idleZ = Math.cos(time * 0.3 + originalPos.z * 0.1) * movementRadius;
        const idleY = Math.sin(time * 0.2 + originalPos.x * 0.5) * 0.5;

        const currentBaseX = originalPos.x + idleX;
        const currentBaseZ = originalPos.z + idleZ;
        const currentBaseY = originalPos.y + idleY;

        const currentPos = groupRef.current.position;
        const distanceToCamera = camera.position.distanceTo(currentPos);

        let depthOpacity = 1.0;
        const fadeStart = 40;
        const fadeEnd = 120;

        if (distanceToCamera > fadeEnd) {
            depthOpacity = 0.05;
        } else if (distanceToCamera > fadeStart) {
            depthOpacity = 1.0 - ((distanceToCamera - fadeStart) / (fadeEnd - fadeStart));
            depthOpacity = Math.max(0.05, depthOpacity);
        }

        const tooFar = depthOpacity < 0.15;
        if (tooFar !== isTooFar) setIsTooFar(tooFar);

        // Magnet Logic
        const mousePos = mouseRef.current;
        const dx = mousePos.x - currentBaseX;
        const dy = mousePos.y - currentBaseY;
        const dz = mousePos.z - currentBaseZ;
        const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const isMagnetic = !tooFar && distToMouse < 4.0;
        const isLockedByMe = activeWordRef.current === id;
        const isFree = activeWordRef.current === null;

        let shouldMagnet = false;
        if (isMagnetic) {
            if (isLockedByMe) {
                shouldMagnet = true;
            } else if (isFree) {
                activeWordRef.current = id;
                shouldMagnet = true;
            }
        } else {
            if (isLockedByMe) {
                activeWordRef.current = null;
            }
        }

        // Apply Position
        if (shouldMagnet) {
            const force = Math.max(0, 1.0 - (distToMouse / 4.0));
            const pullStrength = force * force;
            vec.copy(mousePos);
            groupRef.current.position.lerp(vec, delta * 15 * pullStrength);
        } else {
            vec.set(currentBaseX, currentBaseY, currentBaseZ);
            groupRef.current.position.lerp(vec, delta * 2);
        }

        // Apply Opacity
        if (textRef.current) {
            let targetOpacity = 0.3 * depthOpacity;
            if (hovered) targetOpacity = 1.0;

            textRef.current.fillOpacity = THREE.MathUtils.lerp(
                textRef.current.fillOpacity,
                targetOpacity,
                delta * 5
            );
        }
    });

    return (
        <Billboard
            ref={groupRef}
            position={position}
            follow={true}
        >
            <Text
                ref={textRef}
                fontSize={0.6}
                font={notoFontUrl}
                color={hovered ? "#ffffff" : "#dddddd"}
                anchorX="center"
                anchorY="middle"
                onPointerOver={() => {
                    if (!isTooFar) {
                        setHovered(true);
                        document.body.style.cursor = 'pointer';
                    }
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isTooFar) {
                        onSelect({
                            id,
                            fullSentence,
                            link: url,
                            articleId,
                            sentenceIndex
                        });
                    }
                }}
                fillOpacity={0}
            >
                {displayText}
            </Text>
        </Billboard>
    );
};

// ... (RaycastHandler remains same)
const RaycastHandler = ({ mouseRef, sphereRadius }) => {
    const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(0, 0, 0), sphereRadius), [sphereRadius]);

    useFrame((state) => {
        const intersection = state.raycaster.ray.intersectSphere(sphere, new THREE.Vector3());
        if (intersection) {
            mouseRef.current.copy(intersection);
        }
    });

    return null;
};

const WordCloud = ({ onSelectSentence, selectedSentence, contextSentences }) => {
    // ... (keep existing WordCloud setup)
    const { camera } = useThree();
    const mouseRef = useRef(new THREE.Vector3(0, 0, 0));
    const activeWordRef = useRef(null);
    const controlsRef = useRef();

    // Camera animation state
    const [cameraStartPos] = useState(() => camera.position.clone());
    const [cameraStartTarget] = useState(() => new THREE.Vector3(0, 0, 0));

    // Store the camera state right before dimension travel
    const savedCameraState = useRef({
        position: new THREE.Vector3(),
        target: new THREE.Vector3()
    });

    // State to track if we are currently animating back to start
    const [isReturning, setIsReturning] = useState(false);

    // Track brightness for background (0=Black, 1=White)
    const bgBrightness = useRef(0);

    // Ref to prevent initial animation on mount
    const isMountedRef = useRef(false);
    const prevSelectionRef = useRef(null);

    // Track mount status
    useEffect(() => {
        // Slight delay to ensure controls settle
        const timer = setTimeout(() => {
            isMountedRef.current = true;
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Trigger return animation ONLY when transitioning from selected -> null
    useEffect(() => {
        // Entering dimension travel: Save current state
        if (!prevSelectionRef.current && selectedSentence) {
            savedCameraState.current.position.copy(camera.position);
            if (controlsRef.current) {
                savedCameraState.current.target.copy(controlsRef.current.target);
            }
        }

        if (prevSelectionRef.current && !selectedSentence && isMountedRef.current) {
            setIsReturning(true);
        }
        prevSelectionRef.current = selectedSentence;
    }, [selectedSentence, camera]);

    const sentences = useMemo(() => {
        return sentencesData.slice(0, 490).map((s, index) => {
            // Random word selection
            const words = s.fullSentence.split(' ').filter(w => w.length > 0);
            const displayText = words.length > 0
                ? words[Math.floor(Math.random() * words.length)]
                : s.firstWord; // Fallback

            const thetaRandom = Math.random() * Math.PI * 2;
            const phiRandom = Math.acos(2 * Math.random() - 1);

            const BASE_SENTENCE_COUNT = 800;
            const BASE_SPHERE_RADIUS = 80;
            const scaleFactor = Math.cbrt(sentencesData.length / BASE_SENTENCE_COUNT);
            const sphereRadius = BASE_SPHERE_RADIUS * scaleFactor;

            const radius = Math.cbrt(Math.random()) * sphereRadius;

            const x = radius * Math.sin(phiRandom) * Math.cos(thetaRandom);
            const y = radius * Math.sin(phiRandom) * Math.sin(thetaRandom);
            const z = radius * Math.cos(phiRandom);

            return {
                ...s,
                displayText, // Add random display text
                position: [x, y, z],
                index
            };
        });
    }, []);

    // ... (rest of WordCloud component, including useFrame) 
    // BUT we need to update the Map loop below to use displayText

    // ... (skip lines to map loop)


    const BASE_SENTENCE_COUNT = 800;
    const BASE_SPHERE_RADIUS = 80;
    const BASE_MAX_DISTANCE = 150;

    const scaleFactor = Math.cbrt(sentences.length / BASE_SENTENCE_COUNT);
    const sphereRadius = BASE_SPHERE_RADIUS * scaleFactor;
    const maxDistance = BASE_MAX_DISTANCE * scaleFactor;
    const raycastRadius = sphereRadius * 1.0625;

    // Helper to get position of selected word for Context Rendering
    const getContextGroupPosition = () => {
        if (!selectedSentence) return [0, 0, 0];
        const targetWord = sentences[selectedSentence.id];
        return targetWord ? targetWord.position : [0, 0, 0];
    };

    // Camera animation - WHITEOUT ZOOM
    useFrame((state, delta) => {
        const scene = state.scene;

        // Handle Background Color Transition (Black <-> White)
        if (!scene.background) {
            scene.background = new THREE.Color(0, 0, 0);
        }
        // Handle Fog (must match background for seamless effect)
        if (scene.fog) {
            scene.fog.color.copy(scene.background);
        }

        if (selectedSentence) {
            // Find target word position
            const targetWord = sentences[selectedSentence.id];
            const targetPos = targetWord ? new THREE.Vector3(...targetWord.position) : new THREE.Vector3(0, 0, 0);

            // Zoom right INTO the word (unlimited zoom feeling)
            // We go very close, slightly offset in Z so we don't clip inside
            const zoomDestination = targetPos.clone().add(new THREE.Vector3(0, 0, 15));

            // 1. Move Camera
            camera.position.lerp(zoomDestination, delta * 3);
            camera.lookAt(targetPos);

            // 2. Whiteout Effect
            // Lerp brightness up to 1 (White)
            bgBrightness.current = THREE.MathUtils.lerp(bgBrightness.current, 1, delta * 3);
            scene.background.setScalar(bgBrightness.current);

        } else {
            // Return to original view
            if (isReturning) {
                const destPos = savedCameraState.current.position.lengthSq() > 0
                    ? savedCameraState.current.position
                    : cameraStartPos;
                const destTarget = savedCameraState.current.target;

                camera.position.lerp(destPos, delta * 3);
                camera.lookAt(destTarget);

                // Fade back to black
                bgBrightness.current = THREE.MathUtils.lerp(bgBrightness.current, 0, delta * 5);
                scene.background.setScalar(bgBrightness.current);

                const dist = camera.position.distanceTo(destPos);

                // Stop animating when close enough
                if (dist < 0.5 && bgBrightness.current < 0.05) {
                    setIsReturning(false);
                    scene.background.setScalar(0); // Ensure pure black
                    if (scene.fog) scene.fog.color.setScalar(0);

                    // Sync controls to saved target
                    if (controlsRef.current) {
                        controlsRef.current.target.copy(destTarget);
                        controlsRef.current.update();
                    }
                }
            }
        }
    });

    return (
        <group>
            {/* Remove WarpStars */}

            <ArcballControls
                makeDefault
                ref={controlsRef}
                enablePan={false}
                enableZoom={true}
                enabled={!selectedSentence && !isReturning}
                minDistance={5}
                maxDistance={maxDistance}
                radiusFactor={1}
                dampingFactor={0.1}
            />

            <RaycastHandler mouseRef={mouseRef} sphereRadius={raycastRadius} />

            {/* Main word cloud */}
            {sentences.map((s, i) => (
                <SentenceWrapper
                    key={i}
                    id={i}
                    displayText={s.displayText}
                    fullSentence={s.fullSentence}
                    url={s.link}
                    articleId={s.articleId}
                    sentenceIndex={s.sentenceIndex}
                    position={s.position}
                    mouseRef={mouseRef}
                    activeWordRef={activeWordRef}
                    onSelect={onSelectSentence}
                    isHidden={!!selectedSentence}
                />
            ))}

            {/* Context sentences removed - moved to HTML overlay */}
        </group>
    );
};

export default WordCloud;
