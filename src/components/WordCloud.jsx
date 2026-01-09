import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import sentencesData from '../data/velog-words.json';
import notoFontUrl from '@fontsource/noto-sans-kr/files/noto-sans-kr-korean-900-normal.woff';

const SentenceWrapper = ({ id, displayText, fullSentence, url, articleId, sentenceIndex, position, mouseRef, activeWordRef, onSelect, isHidden }) => {
    const groupRef = useRef();

    // Internal state for content to support randomization on respawn
    const [content, setContent] = useState({
        displayText,
        fullSentence,
        url,
        articleId,
        sentenceIndex
    });

    const [hovered, setHovered] = useState(false);
    const [isTooFar, setIsTooFar] = useState(false);
    const textRef = useRef();

    const vec = new THREE.Vector3();
    const originalPos = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame((state, delta) => {
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

        // Idle Animation
        const movementRadius = 0.3;
        const idleX = Math.sin(time * 0.5 + originalPos.x * 0.1) * movementRadius;
        const idleY = Math.sin(time * 0.2 + originalPos.x * 0.5) * 0.5;

        // Apply idle to current position
        groupRef.current.position.x += idleX * delta;
        groupRef.current.position.y += idleY * delta;

        // --- RESPAWN / INFINITE WORLD LOGIC (Camera-Relative) ---
        // 1. Get position relative to camera
        const relPos = new THREE.Vector3().subVectors(groupRef.current.position, camera.position);

        // 2. Transform to Camera Local Space (Forward is -Z)
        relPos.applyQuaternion(camera.quaternion.clone().invert());

        const tunnelL = 1200;
        const radius = 300; // X/Y boundary
        let changed = false;

        // Wrap Z (Depth - Infinite Tunnel)
        // Camera looks down -Z. Behind is +Z.
        if (relPos.z > 100) {
            relPos.z -= tunnelL;
            // Randomize X/Y to prevent hollow cylinder artifacts when turning
            const r = Math.sqrt(Math.random()) * 200;
            const theta = Math.random() * Math.PI * 2;
            relPos.x = r * Math.cos(theta);
            relPos.y = r * Math.sin(theta);
            changed = true;
        } else if (relPos.z < -tunnelL + 100) {
            relPos.z += tunnelL;
            const r = Math.sqrt(Math.random()) * 200;
            const theta = Math.random() * Math.PI * 2;
            relPos.x = r * Math.cos(theta);
            relPos.y = r * Math.sin(theta);
            changed = true;
        }

        // Wrap X/Y (Side Walls - keep user inside the "cloud")
        // This ensures that even if you fly sideways, you don't exit the word cloud.
        if (relPos.x > radius) { relPos.x -= radius * 2; changed = true; }
        if (relPos.x < -radius) { relPos.x += radius * 2; changed = true; }
        if (relPos.y > radius) { relPos.y -= radius * 2; changed = true; }
        if (relPos.y < -radius) { relPos.y += radius * 2; changed = true; }

        if (changed) {
            // 3. Transform back to World Space
            relPos.applyQuaternion(camera.quaternion);
            groupRef.current.position.copy(camera.position).add(relPos);

            // 4. Randomize Content (Only when respawning out of view)
            const randomItem = sentencesData[Math.floor(Math.random() * sentencesData.length)];
            const newDisplayText = randomItem.fullSentence.length > 30
                ? randomItem.fullSentence.substring(0, 30) + '...'
                : randomItem.fullSentence;

            setContent({
                displayText: newDisplayText,
                fullSentence: randomItem.fullSentence,
                url: randomItem.link,
                articleId: randomItem.articleId,
                sentenceIndex: randomItem.sentenceIndex // Assuming data has this
            });
        }
        // ----------------------------------------



        const currentPos = groupRef.current.position;
        const distanceToCamera = camera.position.distanceTo(currentPos);

        let depthOpacity = 1.0;
        const fadeStart = 40;
        const fadeEnd = 800; // Shorter fade for dense tunnel

        if (distanceToCamera < fadeStart) {
            depthOpacity = distanceToCamera / fadeStart;
        } else if (distanceToCamera > fadeEnd) {
            const fogEnd = 1200;
            if (distanceToCamera > fogEnd) depthOpacity = 0;
            else depthOpacity = 1.0 - ((distanceToCamera - fadeEnd) / (fogEnd - fadeEnd));
        }

        const tooFar = depthOpacity < 0.1;
        if (tooFar !== isTooFar) setIsTooFar(tooFar);

        // Magnet Logic (Only if visible)
        if (!tooFar) {
            const mousePos = mouseRef.current;
            const distToMouse = currentPos.distanceTo(mousePos);

            const isMagnetic = distToMouse < 4.0;
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

            if (shouldMagnet) {
                const vec = new THREE.Vector3().copy(mousePos);
                groupRef.current.position.lerp(vec, delta * 5);
            }
        }

        if (textRef.current) {
            let targetOpacity = 0.5 * depthOpacity;
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
                            id, // Maintain the same Wrapper ID
                            fullSentence: content.fullSentence,
                            link: content.url,
                            articleId: content.articleId,
                            sentenceIndex: content.sentenceIndex
                        });
                    }
                }}
                fillOpacity={0}
                outlineWidth="5%"
                outlineColor="#020202"
                maxWidth={200} // Prevent line wrapping
            >
                {content.displayText}
            </Text>
        </Billboard>
    );
};

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
    const { camera, viewport } = useThree();
    const mouseRef = useRef(new THREE.Vector3(0, 0, 0));
    const activeWordRef = useRef(null);
    const touchDistRef = useRef(null);

    // Custom Rotation Controls
    const rotVel = useRef({ x: 0, y: 0 });
    const lastMouse = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);

    const [cameraStartPos] = useState(() => camera.position.clone());
    const [cameraStartTarget] = useState(() => new THREE.Vector3(0, 0, 0));

    const savedCameraState = useRef({
        position: new THREE.Vector3(),
        target: new THREE.Vector3()
    });

    const [isReturning, setIsReturning] = useState(false);
    const bgBrightness = useRef(0);
    const isMountedRef = useRef(false);
    const prevSelectionRef = useRef(null);
    const speedRef = useRef(0);
    const lastWheelTime = useRef(0);
    const hasInteracted = useRef(false);

    // Track mount status & Fix Camera View
    useEffect(() => {
        // Force straight view: Center X/Y, Offset Z
        camera.position.set(0, 0, 400);
        camera.rotation.set(0, 0, 0);
        camera.lookAt(0, 0, 0);



        const timer = setTimeout(() => {
            isMountedRef.current = true;
        }, 1000);
        return () => clearTimeout(timer);
    }, [camera]);

    useEffect(() => {
        if (!prevSelectionRef.current && selectedSentence) {
            hasInteracted.current = true;
            savedCameraState.current.position.copy(camera.position);
            savedCameraState.current.position.copy(camera.position);
        }
        if (prevSelectionRef.current && !selectedSentence && isMountedRef.current) {
            setIsReturning(true);
        }
        prevSelectionRef.current = selectedSentence;
    }, [selectedSentence, camera]);

    // Initial Tunnel Layout (Responsive & Linear Distributed)
    const sentences = useMemo(() => {
        const isMobile = viewport.width < 15;
        const tunnelRadius = isMobile ? 120 : 180;
        const tunnelLength = 1200; // Fixed Length
        const sliceData = sentencesData.slice(0, 490);
        const count = sliceData.length;

        return sliceData.map((s, index) => {
            const displayText = s.fullSentence.length > 30
                ? s.fullSentence.substring(0, 30) + '...'
                : s.fullSentence;

            // Random position in cylinder (XY)
            const r = Math.sqrt(Math.random()) * tunnelRadius;
            const theta = Math.random() * Math.PI * 2;
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);

            // Linear Z Distribution for Uniform Density (No Gaps)
            const z = -(index / count) * tunnelLength;

            return {
                ...s,
                displayText,
                position: [x, y, z],
                index
            };
        });
    }, [viewport.width]);

    useEffect(() => {
        const handleWheel = (e) => {
            if (selectedSentence) return;
            hasInteracted.current = true;
            const delta = e.deltaY;
            const accel = delta * 0.05;
            speedRef.current += accel;
            capSpeed();
            lastWheelTime.current = Date.now();
        };

        const handleTouchStart = (e) => {
            hasInteracted.current = true;
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchDistRef.current = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const handleTouchMove = (e) => {
            if (selectedSentence) return;
            if (e.touches.length === 2 && touchDistRef.current !== null) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const delta = dist - touchDistRef.current;
                speedRef.current += delta * 1.5;
                touchDistRef.current = dist;
                capSpeed();
                lastWheelTime.current = Date.now();
            }
        };

        const handleTouchEnd = () => {
            touchDistRef.current = null;
        };

        const capSpeed = () => {
            const MAX_SPEED = 200;
            if (speedRef.current > MAX_SPEED) speedRef.current = MAX_SPEED;
            if (speedRef.current < -MAX_SPEED) speedRef.current = -MAX_SPEED;
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [selectedSentence]);

    // Rotation Events
    useEffect(() => {
        const onPointerDown = (e) => {
            if (selectedSentence || isReturning) return;
            if (e.isPrimary === false) return;
            isDragging.current = true;
            lastMouse.current = { x: e.clientX, y: e.clientY };
            hasInteracted.current = true;
        };

        const onPointerMove = (e) => {
            if (!isDragging.current) return;
            if (selectedSentence) return;

            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;
            lastMouse.current = { x: e.clientX, y: e.clientY };

            const sensitivity = 0.002;
            rotVel.current.x += dx * sensitivity;
            rotVel.current.y += dy * sensitivity;
        };

        const onPointerUp = () => {
            isDragging.current = false;
        };

        window.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        return () => {
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [selectedSentence, isReturning]);

    useFrame((state, delta) => {
        const scene = state.scene;
        if (!scene.fog) scene.fog = new THREE.FogExp2(0x000000, 0.0025);
        if (!scene.background) scene.background = new THREE.Color(0, 0, 0);

        if (!selectedSentence) {
            if (!hasInteracted.current) {
                speedRef.current = 15;
            } else {
                speedRef.current *= 0.99;
                if (Math.abs(speedRef.current) < 0.1) speedRef.current = 0;
            }
        } else {
            speedRef.current = 0;
        }

        if (!selectedSentence && !isReturning) {
            // Move in Camera Direction (Fly Mode)

            // Apply Rotation Momentum
            camera.rotation.order = "YXZ";
            camera.rotation.y += rotVel.current.x;
            camera.rotation.x += rotVel.current.y;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

            // Dampen Rotation
            rotVel.current.x *= 0.95;
            rotVel.current.y *= 0.95;

            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            forward.normalize();

            const moveVec = forward.clone().multiplyScalar(speedRef.current * delta);
            camera.position.add(moveVec);
        }

        if (scene.fog) scene.fog.color.copy(scene.background);

        if (selectedSentence) {
            const targetWord = sentences[selectedSentence.id];
            const targetPos = targetWord ? new THREE.Vector3(...targetWord.position) : new THREE.Vector3(0, 0, 0);
            const zoomDestination = targetPos.clone().add(new THREE.Vector3(0, 0, 15));
            camera.position.lerp(zoomDestination, delta * 3);
            camera.lookAt(targetPos);
            bgBrightness.current = THREE.MathUtils.lerp(bgBrightness.current, 1, delta * 3);
            scene.background.setScalar(bgBrightness.current);
        } else {
            if (isReturning) {
                const destPos = savedCameraState.current.position.lengthSq() > 0
                    ? savedCameraState.current.position
                    : cameraStartPos;
                const destTarget = savedCameraState.current.target;
                camera.position.lerp(destPos, delta * 3);
                camera.lookAt(destTarget);
                bgBrightness.current = THREE.MathUtils.lerp(bgBrightness.current, 0, delta * 5);
                scene.background.setScalar(bgBrightness.current);
                const dist = camera.position.distanceTo(destPos);
                if (dist < 0.5 && bgBrightness.current < 0.05) {
                    setIsReturning(false);
                    scene.background.setScalar(0);
                    if (scene.fog) scene.fog.color.setScalar(0);
                    if (scene.fog) scene.fog.color.setScalar(0);
                }
            }
        }
    });

    const raycastRadius = 250;

    return (
        <group>
            <RaycastHandler mouseRef={mouseRef} sphereRadius={raycastRadius} />
            <RaycastHandler mouseRef={mouseRef} sphereRadius={raycastRadius} />
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
        </group>
    );
};

export default WordCloud;
