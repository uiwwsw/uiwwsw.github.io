import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import sentencesData from '../data/velog-words.json';
import notoFontUrl from '@fontsource/noto-sans-kr/files/noto-sans-kr-korean-900-normal.woff';

// --- MODULE LEVEL STATE (SINGLETON) ---
// Prevents state reset on component remounts
let globalIsIntro = true;

let globalUserPos = new THREE.Vector3(0, 0, 400); // For restoring position on remount if needed
let globalUserQuat = new THREE.Quaternion();

// --- GLOBAL SENTENCES GENERATION (Static World Layout) ---
// Pre-calculate positions once to ensure the world never changes ("Reset")
// Use true random 3D positioning with collision avoidance
const fixedSentences = (() => {
    const positions = [];
    const MIN_DISTANCE = 20; // Minimum distance between words to prevent overlap

    // Helper: Check if position is too close to existing positions
    const isTooClose = (newPos) => {
        return positions.some(existingPos => {
            const dx = newPos[0] - existingPos[0];
            const dy = newPos[1] - existingPos[1];
            const dz = newPos[2] - existingPos[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return dist < MIN_DISTANCE;
        });
    };

    return sentencesData.map((s, i) => {
        // Generate Display Text
        let displayText;
        if (s.type === 'code') {
            const lang = (s.language || '').toLowerCase();
            if (lang === 'ts' || lang === 'tsx' || lang === 'typescript') displayText = 'TS';
            else if (lang === 'css') displayText = 'CSS';
            else if (lang === 'html') displayText = 'HTML';
            else if (lang === 'js' || lang === 'jsx' || lang === 'javascript') displayText = 'JS';
            else displayText = '</>';
        } else {
            let cleanedText = s.fullSentence.replace(/Assisted by AI/gi, '').trim();
            displayText = (cleanedText.length > 30
                ? cleanedText.substring(0, 30) + '...'
                : cleanedText).replace(/\n/g, ' ');
        }

        let x, y, z, attempts = 0;
        const MAX_ATTEMPTS = 30;

        // Spherical distribution parameters
        const MIN_RADIUS = 100;  // Inner boundary
        const MAX_RADIUS = 800;  // Outer boundary
        const CAMERA_Z = 400;    // Camera target position

        do {
            // TRUE SPHERICAL DISTRIBUTION (not cylinder!)
            // 1. Radius: use cube root for uniform VOLUME distribution
            const u = Math.random();
            const radius = MIN_RADIUS + Math.cbrt(u) * (MAX_RADIUS - MIN_RADIUS);

            // 2. Theta (azimuth angle): uniform [0, 2π]
            const theta = Math.random() * Math.PI * 2;

            // 3. Phi (polar angle): use acos for uniform SURFACE distribution
            const v = Math.random();
            const phi = Math.acos(2 * v - 1);

            // 4. Convert spherical to Cartesian coordinates
            x = radius * Math.sin(phi) * Math.cos(theta);
            y = radius * Math.sin(phi) * Math.sin(theta);
            z = CAMERA_Z + radius * Math.cos(phi);

            attempts++;
        } while (isTooClose([x, y, z]) && attempts < MAX_ATTEMPTS);

        // Store position (even if collision couldn't be avoided after MAX_ATTEMPTS)
        positions.push([x, y, z]);

        return {
            ...s,
            displayText,
            position: [x, y, z],
            index: i
        };
    });
})();


const SentenceWrapper = ({ id, displayText, fullSentence, url, articleId, sentenceIndex, position, mouseRef, activeWordRef, onSelect, onHoverChange, isDetailMode, isSelected, frozen }) => {
    const groupRef = useRef();
    const { camera } = useThree();
    const [hovered, setHovered] = useState(false);
    const [isTooFar, setIsTooFar] = useState(false);
    const textRef = useRef();

    // Virtual Anchor for Infinite Logic stability
    const anchorRef = useRef(new THREE.Vector3(0, 0, 400));
    const isAnchorInit = useRef(false);

    const vec = new THREE.Vector3();
    const originalPos = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame((state, delta) => {
        // Ensure visible and scaled up (remove old isHidden logic)
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

        // Skip infinite wrapping if frozen (detail view or returning)
        if (!frozen) {

            // Update Anchor if not frozen (browsing mode)
            anchorRef.current.copy(camera.position);

            // --- RESPAWN / INFINITE WORLD LOGIC (Camera-Relative) ---
            // 1. Get position relative to Anchor (Stable Center)
            const relPos = new THREE.Vector3().subVectors(groupRef.current.position, anchorRef.current);

            // 2. Transform to Camera Local Space (Forward is -Z)
            // Note: We use actual camera quaternion for orientation, which is fine
            relPos.applyQuaternion(camera.quaternion.clone().invert());

            const tunnelL = 1200;
            const radius = 300; // X/Y boundary
            let changed = false;

            // Wrap Z (Depth - Infinite Tunnel)
            // Camera looks down -Z. Behind is +Z.
            // Center the user: Range is [-tunnelL/2, tunnelL/2]
            const halfL = tunnelL / 2;

            if (relPos.z > halfL) {
                relPos.z -= tunnelL;
                changed = true;
            } else if (relPos.z < -halfL) {
                relPos.z += tunnelL;
                changed = true;
            }

            // Wrap X/Y (Side Walls - keep user inside the "cloud")
            // This ensures that even if you fly sideways, you don't exit the word cloud.
            // BUT: Do not randomize. Just wrap.
            if (relPos.x > radius) { relPos.x -= radius * 2; changed = true; }
            if (relPos.x < -radius) { relPos.x += radius * 2; changed = true; }
            if (relPos.y > radius) { relPos.y -= radius * 2; changed = true; }
            if (relPos.y < -radius) { relPos.y += radius * 2; changed = true; }

            if (changed) {
                // 3. Transform back to World Space
                relPos.applyQuaternion(camera.quaternion);
                groupRef.current.position.copy(camera.position).add(relPos);
            }
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
            if (distanceToCamera > fogEnd && !globalIsIntro) depthOpacity = 0;
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

            // In detail mode, dim everything except the selected one
            if (isDetailMode) {
                targetOpacity = isSelected ? 1.0 : 0.05; // Faint background
            }

            textRef.current.fillOpacity = THREE.MathUtils.lerp(
                textRef.current.fillOpacity,
                targetOpacity,
                delta * 5
            );

            // Culling: Hide if transparent (but keep visible if selected or detail mode demands it)
            if (groupRef.current) {
                // Insurance: Always show if frozen (returning) or detailed to prevent "empty world"
                // Only cull if strictly browsing and invisible
                // Also show during intro (Galaxy View)
                groupRef.current.visible = textRef.current.fillOpacity > 0.001 || isDetailMode || frozen || globalIsIntro;
            }
        }
    });

    return (
        <Billboard
            ref={groupRef}
            position={position}
            follow={true}
        >
            {/* Hit Area (Invisible, slightly larger) */}
            <mesh
                visible={false}
                onPointerOver={(e) => {
                    e.stopPropagation(); // Block global raycast if needed?

                    // DISTANCE CHECK: Only interactive if close enough
                    const dist = camera.position.distanceTo(groupRef.current.position);
                    const MAX_INTERACTION_DIST = 150;
                    if (dist > MAX_INTERACTION_DIST) return;

                    if (!isTooFar) {
                        setHovered(true);
                        document.body.style.cursor = 'pointer';
                        if (onHoverChange) onHoverChange(true);
                    }
                }}
                onPointerOut={(e) => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                    if (onHoverChange) onHoverChange(false);
                }}
                // Use simple onClick but with a larger area.
                // If the user wants "robustness against different up event", 
                // typically that means they dragged a bit or mouseUp happened on a different child?
                // With a single large mesh, it's robust.
                onClick={(e) => {
                    e.stopPropagation();

                    // DISTANCE CHECK
                    const dist = camera.position.distanceTo(groupRef.current.position);
                    const MAX_INTERACTION_DIST = 150;
                    if (dist > MAX_INTERACTION_DIST) return;

                    if (!isTooFar) {
                        onSelect({
                            id,
                            displayText,
                            fullSentence,
                            link: url,
                            articleId,
                            sentenceIndex
                        });
                    }
                }}
            >
                {/* 
                   Approximate text size:
                   FontSize 0.6. 
                   Korean chars are roughly square. 
                   Width ~= length * 0.6. 
                   Add padding (10% + extra for comfort). 
                */}
                <planeGeometry args={[displayText.length * 0.6 + 1, 1.5]} />
                <meshBasicMaterial transparent opacity={0.0} color="red" />
            </mesh>

            <Text
                ref={textRef}
                fontSize={0.6}
                font={notoFontUrl}
                color={hovered ? "#ffffff" : "#dddddd"}
                anchorX="center"
                anchorY="middle"
                // Events moved to HitBox for better area control
                fillOpacity={0}
                outlineWidth="5%"
                outlineColor="#020202"
                whiteSpace="nowrap"
                overflowWrap="normal"
            >
                {displayText}
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

    // Wrap selection to prevent clicking during intro
    const handleSelectSentenceWrapper = (data) => {
        if (globalIsIntro) return;
        onSelectSentence(data);
    };

    // Intro Animation State (Use Global to persist across remounts)

    // Stop all momentum helper

    // Stop all momentum helper
    const stopMomentum = () => {
        speedRef.current = 0;
        rotVel.current = { x: 0, y: 0 };
    };

    // const [isReturning, setIsReturning] = useState(false); Removed return animation
    const prevSelectionRef = useRef(null);
    const speedRef = useRef(0);
    const lastWheelTime = useRef(0);

    const hasInteracted = useRef(false);
    const isBraking = useRef(false);
    const isHolding = useRef(false); // Track if user is holding down (to stop)
    const lastDirectionRef = useRef(1); // Track last movement direction
    const savedMomentum = useRef({ speed: 0, rotX: 0, rotY: 0 }); // To save state on hold

    // Track mount status & Fix Camera View
    useEffect(() => {
        if (globalIsIntro) {
            // Force far away start for Intro (Galaxy View)
            camera.position.set(0, 0, 50000); // Start extremely far to look like a galaxy (dot)
            camera.rotation.set(0, 0, 0);
        } else {
            // Restore last known position if re-mounting
            if (globalUserPos.lengthSq() > 0) {
                camera.position.copy(globalUserPos);
                camera.quaternion.copy(globalUserQuat);
            }
        }

        return () => {
            // Save current state on unmount
            globalUserPos.copy(camera.position);
            globalUserQuat.copy(camera.quaternion);
        };
    }, [camera]);

    useEffect(() => {
        if (selectedSentence) {
            hasInteracted.current = true;
            stopMomentum(); // Stop moving when entering detail
        } else {
            // RETURNING FROM DETAIL VIEW
            // Force reset all interaction flags to prevent "frozen" state
            isHolding.current = false;
            isDragging.current = false;
            isBraking.current = false;
            // Note: hoverCount is managed by onHover events, but we might want to ensure momentum resumes

            // Check if we just returned?
            if (prevSelectionRef.current) {
                // Ensure we are stopped or resume gently?
                // User said "cancel whatever hold", implying they want it "free".
                // Stop momentum initially to prevent sudden jump, but flags are now clear so auto-cruise will pick up immediately.
                stopMomentum();

                // Optional: If we want to resume cruising immediately, we could set speedRef to MIN_SPEED
                // speedRef.current = 20; 
            }
        }
        prevSelectionRef.current = selectedSentence;
    }, [selectedSentence]);

    // Use global fixed sentences (Static World)
    const sentences = fixedSentences; // Run once to ensure stable world generation

    useEffect(() => {
        const handleWheel = (e) => {
            if (selectedSentence) return;

            // STOP ALL NATIVE ZOOM/SCROLL
            e.preventDefault();

            hasInteracted.current = true;

            // BREAK HOLD on Wheel Event
            if (isHolding.current || isDragging.current) {
                isHolding.current = false;
                isDragging.current = false;
                // We do NOT stopMomentum() here because we want the scroll to immediately take over velocity.
                // But we must ensure the "hold" visual/logic stops.
            }

            const delta = e.deltaY;

            // Opposite direction brake: if moving and input is opposite, stop instead
            // NOTE: We invert delta for logic check because we are about to invert the applied force
            // Current Speed > 0 (Forward). 
            // Standard: Scroll Up (Neg Delta) = Forward. 
            // So if Speed > 0 and Delta > 0 (Scroll Down/Back), we brake.
            if ((speedRef.current > 3 && delta > 0) || (speedRef.current < -3 && delta < 0)) {
                stopMomentum();
                isBraking.current = true;
                return;
            }
            isBraking.current = false;

            // INVERTED WHEEL: Scroll Up (Negative Delta) -> Positive Accel (Forward)
            const accel = -delta * 0.15;
            speedRef.current += accel;
            capSpeed();
            lastWheelTime.current = Date.now();
        };

        const handleTouchStart = (e) => {
            hasInteracted.current = true;

            // Brake Logic: If moving fast, just stop.
            if (Math.abs(speedRef.current) > 5) {
                stopMomentum();
                isBraking.current = true;
                return;
            }
            isBraking.current = false;

            if (e.touches.length === 2) {
                // PINCH ZOOM DETECTED -> Break Hold
                isHolding.current = false;
                isDragging.current = false;

                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchDistRef.current = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const handleTouchMove = (e) => {
            if (selectedSentence) return;
            if (isBraking.current) return; // Ignore move if just braked

            if (e.touches.length === 2 && touchDistRef.current !== null) {
                e.preventDefault();

                // PINCH ZOOM -> Ensure Hold is Broken
                isHolding.current = false;
                isDragging.current = false;

                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const delta = dist - touchDistRef.current;

                // Opposite direction brake: if moving and input is opposite, stop instead
                if ((speedRef.current > 3 && delta < 0) || (speedRef.current < -3 && delta > 0)) {
                    stopMomentum();
                    isBraking.current = true;
                    touchDistRef.current = null;
                    return;
                }

                speedRef.current += delta * 1.5; // Reduced for slower, more controlled movement
                touchDistRef.current = dist;
                capSpeed();
                lastWheelTime.current = Date.now();
            }
        };

        const handleTouchEnd = () => {
            touchDistRef.current = null;
        };

        const capSpeed = () => {
            const MAX_SPEED = 1000; // Much higher max speed (was 200)
            if (speedRef.current > MAX_SPEED) speedRef.current = MAX_SPEED;
            if (speedRef.current < -MAX_SPEED) speedRef.current = -MAX_SPEED;
        };

        const handleGestureStart = (e) => {
            e.preventDefault();
        };

        const handleGestureChange = (e) => {
            e.preventDefault();
            if (selectedSentence) return;
            hasInteracted.current = true;

            // Map gesture scale to speed
            // scale > 1 (zoom in) -> Move Forward
            // scale < 1 (zoom out) -> Move Backward
            // Logic: Delta = (scale - 1) * Factor
            const scaleDelta = (e.scale - 1);

            // If scaleDelta is significant
            if (Math.abs(scaleDelta) > 0.01) {
                // Break Hold
                isHolding.current = false;
                isDragging.current = false;

                const speedDelta = scaleDelta * 50; // Sensitivity factor
                speedRef.current += speedDelta;
                capSpeed();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('gesturestart', handleGestureStart, { passive: false });
        window.addEventListener('gesturechange', handleGestureChange, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('gesturestart', handleGestureStart);
            window.removeEventListener('gesturechange', handleGestureChange);
        };
    }, [selectedSentence]);

    // Rotation Events
    useEffect(() => {
        const onPointerDown = (e) => {
            if (globalIsIntro) return; // Block rotation during intro animation

            hasInteracted.current = true; // Mark interaction immediately!
            isHolding.current = true;     // User is holding

            // Stop movement immediately on input (Pause)
            speedRef.current = 0;
            rotVel.current = { x: 0, y: 0 }; // Also pause rotation visually

            if (selectedSentence) return; // Block rotation in detail mode
            if (e.isPrimary === false) return;
            isDragging.current = true;
            lastMouse.current = { x: e.clientX, y: e.clientY };
        };

        const onPointerMove = (e) => {
            if (!isDragging.current) return;
            if (selectedSentence) return;

            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;
            lastMouse.current = { x: e.clientX, y: e.clientY };

            const sensitivity = 0.0003; // Decreased sensitivity (was 0.0005)
            rotVel.current.x += dx * sensitivity;
            rotVel.current.y += dy * sensitivity;

            // While dragging/rotating, maintain minimum speed (User request: "Moves slowly while rotating")
            // REMOVED: speedRef.current = 20; -> We want it to stop now if holding.
        };

        const onPointerUp = () => {
            // Restore Momentum on Release ONLY if we were actually holding/dragging.
            // If wheel event broke the hold, isHolding/isDragging will be false,
            // so we skip this block and preserve the scroll speed!
            if (isHolding.current || isDragging.current) {

                // 1. Release Logic (Click/Drag release) - RESET TO MINIMUM SPEED
                // User request: "When clicking/dragging and releasing, reset to min speed only."
                const MIN_SPEED = 20;

                // Determine direction: snapshot direction OR last known direction
                // We use savedMomentum.current.speed to know what the direction WAS.
                const direction = Math.sign(savedMomentum.current.speed) || lastDirectionRef.current || 1;

                // Force reset to MIN_SPEED in that direction. 
                // We DO NOT restore the previous high speed.
                speedRef.current = direction * MIN_SPEED;

                // 2. Rotation Logic
                // If user did NOT drag (just held), restore old rotation.
                // If user DID drag (fling), keep the new fling rotation (don't overwrite with old).
                if (rotVel.current.x === 0 && rotVel.current.y === 0) {
                    rotVel.current.x = savedMomentum.current.rotX;
                    rotVel.current.y = savedMomentum.current.rotY;
                }
            }

            isDragging.current = false;
            isHolding.current = false; // Release hold
        };

        const onPointerCancel = () => {
            isDragging.current = false;
            isHolding.current = false;
        };

        window.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
        window.addEventListener('pointerleave', onPointerCancel);

        return () => {
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerCancel);
            window.removeEventListener('pointerleave', onPointerCancel);
        };
    }, [selectedSentence]);

    useFrame((state, delta) => {
        const scene = state.scene;
        if (!scene.fog) scene.fog = new THREE.FogExp2(0x000000, 0.0025);
        if (!scene.background) scene.background = new THREE.Color(0, 0, 0);

        if (globalIsIntro) {
            // WARP IN ANIMATION (Physics based for continuous handoff)
            const targetZ = 400;
            const currentZ = camera.position.z;
            const dist = currentZ - targetZ;

            // P-Controller: Speed is proportional to distance
            // Multiplier 2.5 for "Light Speed" exponential approach from 50000 -> 0 in ~3s
            let targetSpeed = dist * 2.5;

            // Cap max speed (was 8000) - Increase for Galaxy Warp
            if (targetSpeed > 800000) targetSpeed = 800000;

            // Handoff threshold: When calculated speed drops below normal idle speed (20)
            if (targetSpeed <= 20) {
                globalIsIntro = false;
                speedRef.current = 20; // Exact handoff
            } else {
                // Move camera
                speedRef.current = targetSpeed;
                camera.position.z -= targetSpeed * delta;
            }

            return; // Skip other movement logic during intro
        }

        if (!selectedSentence) {
            // UNIVERSE PHYSICS (Perpetual Movement)
            const MIN_SPEED = 20;

            // Track direction whenever we are moving
            if (Math.abs(speedRef.current) > 0.1) {
                lastDirectionRef.current = Math.sign(speedRef.current);
            }

            // HOVER/HOLD STOP LOGIC
            // If user is recently scrolling (Wheel/Pinch), IGNORE the hover stop.
            // This allows the user to scroll "off" a word they were hovering.
            const isRecentWheel = Date.now() - lastWheelTime.current < 500;

            if (isHolding.current || (hoverCount.current > 0 && !isRecentWheel)) {
                // If holding OR hovering (and not scrolling), stop completely
                speedRef.current = 0;
            } else {
                // Friction / Auto-Cruise
                const currentSpeed = speedRef.current;

                if (Math.abs(currentSpeed) > MIN_SPEED) {
                    speedRef.current *= 0.994;
                }
                // 2. Auto-Cruise (Low speeds) - Preserve Direction
                else {
                    // Default to forward (1) if stopped, otherwise keep sign
                    // Use last known direction if currently stopped
                    const direction = Math.sign(currentSpeed) || lastDirectionRef.current;
                    const targetSpeed = direction * MIN_SPEED;

                    // Smooth recovery to cruise speed
                    speedRef.current += (targetSpeed - currentSpeed) * 0.05;
                }

                // CONTINUOUS SNAPSHOT:
                // While moving freely (not held, not hovering), save state.
                // This ensures that if we suddenly pause (hover/click), we know what to restore.
                savedMomentum.current = {
                    speed: speedRef.current,
                    rotX: rotVel.current.x,
                    rotY: rotVel.current.y
                };
            }
        } else {
            speedRef.current = 0;
            rotVel.current = { x: 0, y: 0 }; // Kill rotation while in detail
        }

        if (!selectedSentence) {
            // Move in Camera Direction (Fly Mode)

            // Apply Rotation Momentum
            // Use Local Axis Rotation to prevent "spinning" (Gimbal Lock/World Axis issue)
            // This ensures "Right" always means "Screen Right" regardless of pitch.
            const yaw = rotVel.current.x;
            const pitch = rotVel.current.y;

            // Apply Yaw (around Local Y axis)
            camera.rotateY(yaw);

            // Apply Pitch (around Local X axis)
            camera.rotateX(pitch);

            // Dampen Rotation
            rotVel.current.x *= 0.98;
            rotVel.current.y *= 0.98;

            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            forward.normalize();

            const moveVec = forward.clone().multiplyScalar(speedRef.current * delta);
            camera.position.add(moveVec);
        }

        if (scene.fog) scene.fog.color.copy(scene.background);

        // Detail mode: just freeze, no visual changes to background
        if (selectedSentence) {
            stopMomentum();
        }
    });

    const raycastRadius = 250;

    const hoverCount = useRef(0);

    const handleHoverChange = (isHovering) => {
        if (isHovering) {
            hoverCount.current++;
        } else {
            hoverCount.current = Math.max(0, hoverCount.current - 1);
            // If no longer hovering anything AND not holding click...
            if (hoverCount.current === 0 && !isHolding.current) {
                // RESTORE MOMENTUM (Hover Exit)
                speedRef.current = savedMomentum.current.speed;
                rotVel.current.x = savedMomentum.current.rotX;
                rotVel.current.y = savedMomentum.current.rotY;
            }
        }
    };

    return (
        <group>
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
                    onSelect={handleSelectSentenceWrapper}
                    onHoverChange={handleHoverChange}
                    isDetailMode={!!selectedSentence}
                    isSelected={selectedSentence && selectedSentence.id === i}
                    frozen={!!selectedSentence}
                />
            ))}
        </group>
    );
};

export default WordCloud;
