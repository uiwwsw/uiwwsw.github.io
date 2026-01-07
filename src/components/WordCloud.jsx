import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, ArcballControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import wordsData from '../data/velog-words.json';
// Import font file explicitly from the installed package
import notoFontUrl from '@fontsource/noto-sans-kr/files/noto-sans-kr-korean-900-normal.woff';

const Word = ({ id, text, url, position, mouseRef, activeWordRef }) => {
    // Unused, but kept for reference structure if needed in future
    return null;
};

const WordWrapper = ({ id, text, url, position, mouseRef, activeWordRef }) => {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [isTooFar, setIsTooFar] = useState(false);

    // Initial opacity ref for manual control to avoid prop drilling performance hit? 
    // Text component exposes material via ref? Yes.
    const textRef = useRef();
    const pointerDownPos = useRef(null);

    const vec = new THREE.Vector3();
    const originalPos = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        const camera = state.camera;

        // Idle Motion
        const movementRadius = 0.3;
        const idleX = Math.sin(time * 0.5 + originalPos.x * 0.1) * movementRadius;
        const idleZ = Math.cos(time * 0.3 + originalPos.z * 0.1) * movementRadius;
        const idleY = Math.sin(time * 0.2 + originalPos.x * 0.5) * 0.5;

        const currentBaseX = originalPos.x + idleX;
        const currentBaseZ = originalPos.z + idleZ;
        const currentBaseY = originalPos.y + idleY;

        // Distance Check (Group Position vs Camera)
        const currentPos = groupRef.current.position;
        const distanceToCamera = camera.position.distanceTo(currentPos);

        // Depth Opacity Logic
        // Radius is ~80.
        // Nice fade range: 20 (close) to 120 (far)
        let depthOpacity = 1.0;
        const fadeStart = 40;
        const fadeEnd = 120;

        if (distanceToCamera > fadeEnd) {
            depthOpacity = 0.05; // Keep faint trace
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

        // Interaction is blocked if too far
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

        // Apply Opacity to TEXT
        if (textRef.current) {
            let targetOpacity = 0.3 * depthOpacity; // Base visibility lowered for "cloud" effect
            if (hovered) targetOpacity = 1.0;

            textRef.current.fillOpacity = THREE.MathUtils.lerp(
                textRef.current.fillOpacity,
                targetOpacity,
                delta * 5
            );
            // Also scale
            const targetScale = hovered ? 1.2 : 1.0;
            groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 5));
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
                onPointerDown={(e) => {
                    // Record start position for click detection
                    pointerDownPos.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerUp={(e) => {
                    if (!pointerDownPos.current) return;

                    const dx = e.clientX - pointerDownPos.current.x;
                    const dy = e.clientY - pointerDownPos.current.y;
                    const dragDistance = Math.sqrt(dx * dx + dy * dy);

                    // Only treat as click if moved less than 5 pixels (prevent drag-click)
                    // AND if not too far (depth check)
                    // AND if url exists
                    if (dragDistance < 5 && !isTooFar && url) {
                        window.open(url, '_blank');
                    }

                    pointerDownPos.current = null;
                }}
                fillOpacity={0} // Controlled by lerp
            >
                {text}
            </Text>
        </Billboard>
    );
};

// Component to handle raycasting for magnet effect WITHOUT physical mesh
const RaycastHandler = ({ mouseRef, sphereRadius }) => {
    const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(0, 0, 0), sphereRadius), [sphereRadius]);

    useFrame((state) => {
        // state.raycaster is automatically updated by R3F with mouse position
        // We intersect the mathematical sphere
        const intersection = state.raycaster.ray.intersectSphere(sphere, new THREE.Vector3());

        if (intersection) {
            mouseRef.current.copy(intersection);
        }
    });

    return null;
};

const WordCloud = () => {
    const mouseRef = useRef(new THREE.Vector3(0, 0, 0));
    const activeWordRef = useRef(null);
    const controlsRef = useRef();

    const words = useMemo(() => {
        // Full Spherical Volume
        return wordsData.slice(0, 800).map(w => {
            const thetaRandom = Math.random() * Math.PI * 2;
            const phiRandom = Math.acos(2 * Math.random() - 1);

            // Random radius 0 to 80 for FULL VOLUME
            // Cube Root ensures UNIFORM distribution (visual evenness),
            // preventing the "clumped center" look of linear random.
            const radius = Math.cbrt(Math.random()) * 80;

            const x = radius * Math.sin(phiRandom) * Math.cos(thetaRandom);
            const y = radius * Math.sin(phiRandom) * Math.sin(thetaRandom);
            const z = radius * Math.cos(phiRandom);

            return {
                ...w,
                position: [x, y, z]
            };
        });
    }, []);

    // Dynamic sphere sizing based on word count
    // Base values calibrated for 800 words
    const BASE_WORD_COUNT = 800;
    const BASE_SPHERE_RADIUS = 80;
    const BASE_MAX_DISTANCE = 150;

    // Scale sphere size with cube root of word count ratio to maintain visual density
    const scaleFactor = Math.cbrt(words.length / BASE_WORD_COUNT);
    const sphereRadius = BASE_SPHERE_RADIUS * scaleFactor;
    const maxDistance = BASE_MAX_DISTANCE * scaleFactor;

    // Raycast sphere should be slightly larger than word distribution sphere
    const raycastRadius = sphereRadius * 1.0625; // 85/80 ratio from original

    const handlePointerMove = (e) => {
        mouseRef.current.copy(e.point);
    };

    return (
        <group>
            {/* ArcballControls: True infinite rotation (tumbling) without gimbal lock or polar limits */}
            <ArcballControls
                makeDefault
                ref={controlsRef}
                enablePan={false}
                enableZoom={true}
                minDistance={5}
                maxDistance={maxDistance}
                radiusFactor={1}
                dampingFactor={0.1}
            />

            {/* Logical helper to update mouseRef without blocking events */}
            <RaycastHandler mouseRef={mouseRef} sphereRadius={raycastRadius} />

            {words.map((w, i) => (
                <WordWrapper
                    key={i}
                    id={i}
                    text={w.text}
                    url={w.link}
                    position={w.position}
                    mouseRef={mouseRef}
                    activeWordRef={activeWordRef}
                />
            ))}
        </group>
    );
};

export default WordCloud;
