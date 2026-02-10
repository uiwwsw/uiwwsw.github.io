import React, { useMemo, useRef, useState, useEffect, lazy, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { preloadFont } from 'troika-three-text';
import * as THREE from 'three';

// Lazy load data for better performance
const loadSentencesData = () => import('../data/velog-words.json');

const fontUrl = '/fonts/SUITE-Variable.ttf';

const INTERACTION_CUTOFF = 150;
const HOVER_CLICK_WINDOW_MS = 500;

// --- MODULE LEVEL STATE (SINGLETON) ---
// Prevents state reset on component remounts
let globalIsIntro = true;

let globalUserPos = new THREE.Vector3(0, 0, 400); // For restoring position on remount if needed
let globalUserQuat = new THREE.Quaternion();

// --- GLOBAL SENTENCES GENERATION (Dynamic Helper) ---
const generateLayout = (data) => {
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

    // Filter out unwanted content
    const filteredData = data.filter(s => {
        if (!s.fullSentence) return false;
        // Exclude "Assisted by AI"
        if (/Assisted by AI/i.test(s.fullSentence)) return false;
        return true;
    });

    return filteredData.map((s, i) => {
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
            let cleanedText = s.fullSentence.trim();
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
};


const SentenceWrapper = ({ id, data, onSelect, registerItem, unregisterItem, onHoverChange, onHoverItem, onDirectPointerDown, onDirectPointerUp, isDetailMode, frozen, isBonus }) => {
    // Destructure needed fields from data
    const { displayText, position } = data;

    const groupRef = useRef();
    const innerRef = useRef(); // New: Handles visual offset (magnet) independent of world pos
    const { camera } = useThree();
    const [hovered, setHovered] = useState(false);
    const [isTooFar, setIsTooFar] = useState(false);
    const textRef = useRef();
    const tapStartRef = useRef(null);

    const isTap = (e) => {
        const start = tapStartRef.current;
        if (!start) return false;

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const distSq = dx * dx + dy * dy;
        const duration = Date.now() - start.t;

        tapStartRef.current = null;

        return distSq <= 16 && duration < 500;
    };

    // Register to Parent for Click Detection
    useEffect(() => {
        if (registerItem && groupRef.current) {
            registerItem(id, groupRef, data);
        }
        return () => {
            if (unregisterItem) unregisterItem(id);
        };
    }, [id, data, registerItem, unregisterItem]);

    // Virtual Anchor for Infinite Logic stability
    const anchorRef = useRef(new THREE.Vector3(0, 0, 400));

    const vec = new THREE.Vector3();
    const originalPos = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame((state, delta) => {
        // Ensure visible and scaled up (remove old isHidden logic)
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        const camera = state.camera;

        // Idle Animation (Applied to GROUP - The Anchor)
        const movementRadius = 0.3;
        const idleX = Math.sin(time * 0.5 + originalPos.x * 0.1) * movementRadius;
        const idleY = Math.sin(time * 0.2 + originalPos.x * 0.5) * 0.5;

        // Apply idle to current position
        groupRef.current.position.x += idleX * delta;
        groupRef.current.position.y += idleY * delta;

        // Skip infinite wrapping if frozen (detail view or returning)
        if (!frozen && !isBonus) {

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
                // Randomize X/Y on Z-wrap (Infinite Random Starfield)
                relPos.x = (Math.random() - 0.5) * radius * 2;
                relPos.y = (Math.random() - 0.5) * radius * 2;
            } else if (relPos.z < -halfL) {
                relPos.z += tunnelL;
                changed = true;
                // Randomize X/Y on Z-wrap
                relPos.x = (Math.random() - 0.5) * radius * 2;
                relPos.y = (Math.random() - 0.5) * radius * 2;
            }

            // Wrap X/Y only if NOT changed by Z-wrap (protect bounds for side movement)
            if (!changed) {
                if (relPos.x > radius) { relPos.x -= radius * 2; changed = true; }
                if (relPos.x < -radius) { relPos.x += radius * 2; changed = true; }
                if (relPos.y > radius) { relPos.y -= radius * 2; changed = true; }
                if (relPos.y < -radius) { relPos.y += radius * 2; changed = true; }
            }

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

        // Dynamic Scaling (Only if visible)
        // Dynamic Scaling REMOVED - using static large font
        if (innerRef.current) {
            innerRef.current.position.set(0, 0, 0);
            innerRef.current.scale.setScalar(1.0);
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
            <group ref={innerRef}>
                {/* Hit Area (Invisible, slightly larger) */}
                <mesh
                    onPointerOver={(e) => {
                        const dist = camera.position.distanceTo(groupRef.current.position);
                        if (dist > INTERACTION_CUTOFF) return;

                        e.stopPropagation();

                        if (!isTooFar) {
                            setHovered(true);
                            document.body.style.cursor = 'pointer';
                            if (onHoverChange) onHoverChange(true);
                            if (onHoverItem) onHoverItem(data, groupRef);
                        }
                    }}
                    onPointerOut={(e) => {
                        const dist = camera.position.distanceTo(groupRef.current.position);
                        if (dist > INTERACTION_CUTOFF) return;

                        e.stopPropagation();

                        setHovered(false);
                        document.body.style.cursor = 'auto';
                        if (onHoverChange) onHoverChange(false);
                    }}
                    onPointerDown={(e) => {
                        const dist = camera.position.distanceTo(groupRef.current.position);
                        if (dist > INTERACTION_CUTOFF) return;

                        tapStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };

                        e.stopPropagation();
                        if (onDirectPointerDown) onDirectPointerDown();
                    }}
                    onPointerUp={(e) => {
                        const dist = camera.position.distanceTo(groupRef.current.position);
                        if (dist > INTERACTION_CUTOFF) return;

                        e.stopPropagation();
                        if (onDirectPointerUp) onDirectPointerUp();

                        if (isTap(e)) {
                            onSelect(data);
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
                    <planeGeometry args={[displayText.length * 1.2 + 2, 2.0]} />
                    <meshBasicMaterial transparent opacity={0.0} depthWrite={false} depthTest={false} color="red" />
                </mesh>

                <Text
                    ref={textRef}
                    fontSize={1.2}
                    font={fontUrl}
                    color={hovered ? "#ffffff" : "#dddddd"}
                    anchorX="center"
                    anchorY="middle"
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        if (!isTooFar) {
                            setHovered(true);
                            document.body.style.cursor = 'pointer';
                            if (onHoverChange) onHoverChange(true);
                            if (onHoverItem) onHoverItem(data, groupRef);
                        }
                    }}
                    onPointerOut={(e) => {
                        e.stopPropagation();
                        setHovered(false);
                        document.body.style.cursor = 'auto';
                        if (onHoverChange) onHoverChange(false);
                    }}
                    onPointerDown={(e) => {
                        tapStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };

                        e.stopPropagation();
                        if (onDirectPointerDown) onDirectPointerDown();
                    }}
                    onPointerUp={(e) => {
                        e.stopPropagation();
                        if (onDirectPointerUp) onDirectPointerUp();

                        if (isTap(e)) {
                            onSelect(data);
                        }
                    }}
                    fillOpacity={0}
                    outlineWidth="5%"
                    outlineColor="#020202"
                    whiteSpace="nowrap"
                    overflowWrap="normal"
                >
                    {displayText}
                </Text>
            </group>
        </Billboard>
    );
};



const RaycastHandler = ({ mouseRef, sphereRadius }) => {
    const { camera, pointer } = useThree();
    useFrame(() => {
        // Unproject mouse to world space at 'sphereRadius' distance from camera
        const safeRadius = sphereRadius || 250;
        const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5);
        vec.unproject(camera);
        const dir = vec.sub(camera.position).normalize();

        const targetPos = camera.position.clone().add(dir.multiplyScalar(safeRadius));
        mouseRef.current.copy(targetPos);
    });
    return null;
};

// ... (Rest of existing code)

// Inside WordCloud Render:
// <BonusWords sentencesData={sentencesData} ... />

const WordCloud = ({ onSelectSentence, selectedSentence, contextSentences }) => {
    const { camera, viewport } = useThree();
    const mouseRef = useRef(new THREE.Vector3(0, 0, 0));
    const activeWordRef = useRef(null);
    const touchDistRef = useRef(null);
    const clickStartTime = useRef(0);
    const wasPinchRef = useRef(false);
    const isReturningRef = useRef(false); // [Safety] Block clicks right after returning
    const [sentencesData, setSentencesData] = React.useState(null);
    const suppressNearestClickRef = useRef(false);

    const markDirectPointerDown = () => {
        suppressNearestClickRef.current = true;
    };

    const markDirectPointerUp = () => {
        setTimeout(() => {
            suppressNearestClickRef.current = false;
        }, 0);
    };

    // Load data asynchronously

    React.useEffect(() => {
        // Preload font and configure ttf decoder
        preloadFont(
            {
                font: fontUrl,
            },
            () => {
                // Font loaded
            }
        );

        loadSentencesData().then((dataModule) => {
            setSentencesData(dataModule.default);
        });
    }, []);

    // Custom Rotation Controls
    const rotVel = useRef({ x: 0, y: 0 });
    const lastMouse = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastHoveredRef = useRef(null);

    const recordHoverItem = (data, ref) => {
        lastHoveredRef.current = {
            data,
            ref,
            t: Date.now()
        };
    };

    // Wrap selection to prevent clicking during intro
    const handleSelectSentenceWrapper = (data) => {
        if (globalIsIntro) return;
        lastHoveredRef.current = null;
        onSelectSentence(data);
    };

    // Stop all momentum helper
    const stopMomentum = () => {
        speedRef.current = 0;
        rotVel.current = { x: 0, y: 0 };
    };

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
            // This is critical for mobile where touchend might be missed or state stuck
            isHolding.current = false;
            isDragging.current = false;
            isBraking.current = false;
            touchDistRef.current = null; // Clear pinch/tap state
            wasPinchRef.current = false; // [Safety] Ensure pinch state is cleared
            isReturningRef.current = true; // [Safety] Block unintentional clicks immediately after close
            setTimeout(() => { isReturningRef.current = false; }, 500);

            // [Safety] Stop any residual rotation
            rotVel.current = { x: 0, y: 0 };

            // [Safety] Resume gentle cruising if stopped, to avoid "dead canvas" feel
            if (Math.abs(speedRef.current) < 5) {
                speedRef.current = 20;
            }

            // Note: hoverCount is managed by onHover events, but we might want to ensure momentum resumes

            // Check if we just returned?
            if (prevSelectionRef.current) {
                // Ensure we are stopped or resume gently?
                // User said "cancel whatever hold", implying they want it "free".
                // Stop momentum initially to prevent sudden jump, but flags are now clear so auto-cruise will pick up immediately.
                // stopMomentum(); // REMOVED: Let the speed reset above take effect for smoother return


            }
        }
        prevSelectionRef.current = selectedSentence;
    }, [selectedSentence]);

    // Use dynamic generation (Memoized to persist during interaction, but fresh on reload)
    const sentences = useMemo(() => {
        if (!sentencesData) return [];
        return generateLayout(sentencesData);
    }, [sentencesData]);

    // Live Registry for Real-Time Click Detection
    const itemRefs = useRef(new Map());

    const registerItem = (id, ref, data) => {
        itemRefs.current.set(id, { ref, data });
    };

    const unregisterItem = (id) => {
        itemRefs.current.delete(id);
    };

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
            if (selectedSentence) return;
            // [Safety] Only canvas touches
            if (e.target.nodeName !== 'CANVAS') return;

            hasInteracted.current = true;
            e.preventDefault(); // Prevent default scroll/zoom

            // Safety: Reset flags on new touch
            isDragging.current = false;
            // isHolding is managed by onPointerDown, but good to ensure
            // touchDistRef is reset below

            // Brake Logic: If moving fast, just stop.
            if (Math.abs(speedRef.current) > 5) {
                stopMomentum();
                isBraking.current = true;
                return;
            }
            isBraking.current = false;

            if (e.touches.length > 1) {
                wasPinchRef.current = true;
            }

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

        const handleTouchEnd = (e) => {
            // TAP DETECTION (Mobile)
            // Safety cleanup
            touchDistRef.current = null;

            // Allow a small delay for 'click' to process in onPointerUp?
            // No, onPointerUp happens before? Or simultaneous.
            // Just ensure we don't get stuck.
            // If we assume onPointerUp has run, we can clear here.
            // Use setTimeout to clear AFTER potential click events processed?
            // Actually, if we just clear them, it might be fine.

            // Force reset flags if no touches left
            if (e.touches.length === 0) {
                isDragging.current = false;
                isHolding.current = false;

                // [Safety] Delayed "Watchdog" reset
                // If for any reason state gets stuck (e.g. pinch flag), clear it after a short delay
                // preventing permanent blockage of clicks.
                setTimeout(() => {
                    if (!isHolding.current) { // Only if user isn't holding again
                        wasPinchRef.current = false;
                        isDragging.current = false;
                        touchDistRef.current = null;
                    }
                }, 600);
            }
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
        window.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('gesturestart', handleGestureStart, { passive: false });
        window.addEventListener('gesturechange', handleGestureChange, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart, true); // Fix: Match capture phase
            window.removeEventListener('touchmove', handleTouchMove, true);   // Fix: Match capture phase
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('gesturestart', handleGestureStart);
            window.removeEventListener('gesturechange', handleGestureChange);
        };
    }, [selectedSentence]);

    // Rotation Events
    useEffect(() => {
        const onPointerDown = (e) => {
            if (globalIsIntro) return; // Block rotation during intro animation
            // [Safety] Only interact if touching the canvas (ignore UI buttons)
            if (e.target.nodeName !== 'CANVAS') return;

            lastMouse.current = { x: e.clientX, y: e.clientY };
            if (e.isPrimary) wasPinchRef.current = false;
            clickStartTime.current = Date.now();
            hasInteracted.current = true; // Mark interaction immediately!
            isHolding.current = true;     // User is holding

            // Stop movement immediately on input (Pause)
            speedRef.current = 0;
            rotVel.current = { x: 0, y: 0 }; // Also pause rotation visually

            if (selectedSentence) return; // Block rotation in detail mode
            if (e.isPrimary === false) return;
            isDragging.current = false;
        };

        const onPointerMove = (e) => {
            if (selectedSentence) return;

            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;

            // Only consider it a drag if moved significantly
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                isDragging.current = true;
            }

            if (!isDragging.current && !isHolding.current) return;

            // If strictly holding but not dragging yet, we might skip? 
            // But usually we want instant feedback. 
            // The isDragging flag protects the "Click" logic. 
            // The rotation logic should run if we are moving mouse while holding.

            if (isHolding.current) {
                lastMouse.current = { x: e.clientX, y: e.clientY }; // Always update last mouse

                const sensitivity = 0.0001;
                rotVel.current.x += dx * sensitivity;
                rotVel.current.y += dy * sensitivity;
            }
        };

        const onPointerUp = (e) => {
            // Restore Momentum on Release ONLY if we were actually holding/dragging.
            if (isHolding.current || isDragging.current) {
                const skipNearestThisClick = suppressNearestClickRef.current;
                suppressNearestClickRef.current = false;

                // CLICK DETECTION
                // If we didn't drag, and we are not in detail mode, it's a click.
                const clickDuration = Date.now() - clickStartTime.current;
                if (!skipNearestThisClick && !isDragging.current && !selectedSentence && !globalIsIntro && !wasPinchRef.current && !isReturningRef.current && clickDuration < 500) {
                    // It was a CLICK (Tap) on the background.
                    // Priority: nearest by camera distance/screen-space.

                    // Run "Find Nearest" Logic (Screen Space)

                    // 1. Get click coordinates (NDC for Project) & Screen for Distance
                    const screenX = e.clientX;
                    const screenY = e.clientY;

                    // 2. Collect ALL Candidates (Using LIVE POSITIONS)
                    camera.updateMatrixWorld(); // Critical: Ensure camera state is fresh!
                    const liveItems = Array.from(itemRefs.current.values());

                    let closest = null;
                    let minScreenDistSq = Infinity;
                    const BASE_CLICK_RADIUS = 60; // Max radius for fully visible items

                    const width = window.innerWidth;
                    const height = window.innerHeight;
                    const widthHalf = width / 2;
                    const heightHalf = height / 2;

                    liveItems.forEach(item => {
                        const { ref, data } = item;
                        if (!ref.current) return;
                        if (ref.current.visible === false) return;

                        // LIVE World Position (updated by animation loop)
                        const pos = new THREE.Vector3();
                        ref.current.getWorldPosition(pos); // Get absolute world position

                        // Check if in front roughly (Camera looks down -Z)
                        const pLocal = pos.clone().applyMatrix4(camera.matrixWorldInverse);
                        if (pLocal.z > 0) return; // Behind camera

                        // DISTANCE CHECK (Size Proxy)
                        const distanceToCamera = camera.position.distanceTo(pos);
                        const FAR_CUTOFF = 250; // Ignore extremely small/far items
                        if (distanceToCamera > FAR_CUTOFF) return;

                        // Click radius scales with distance (min 1px)
                        // Map distance [NEAR_CUTOFF, FAR_CUTOFF] -> radius [MAX_RADIUS, MIN_RADIUS]
                        const NEAR_CUTOFF = 100; // Anything closer than this gets MAX radius
                        const MAX_RADIUS = 60;
                        const MIN_RADIUS = 1;

                        let allowedRadius = MAX_RADIUS;
                        if (distanceToCamera > NEAR_CUTOFF) {
                            const range = FAR_CUTOFF - NEAR_CUTOFF;
                            const progress = range > 0 ? (distanceToCamera - NEAR_CUTOFF) / range : 1;
                            const p = Math.max(0, Math.min(1, progress));
                            allowedRadius = MAX_RADIUS - (p * (MAX_RADIUS - MIN_RADIUS));
                        }

                        if (allowedRadius < MIN_RADIUS) allowedRadius = MIN_RADIUS;
                        const allowedDistSq = allowedRadius * allowedRadius;

                        pos.project(camera);

                        const x = (pos.x * widthHalf) + widthHalf;
                        const y = -(pos.y * heightHalf) + heightHalf;

                        const dx = x - screenX;
                        const dy = y - screenY;
                        const distSq = dx * dx + dy * dy;

                        // 1. Is it within its OWN valid radius?
                        if (distSq > allowedDistSq) return;

                        // 2. Is it the CLOSEST valid one found so far?
                        if (distSq < minScreenDistSq) {
                            minScreenDistSq = distSq;
                            closest = data; // Return the metadata
                        }
                    });

                    // 3. Select if found (Validity already checked inside loop)
                    if (closest) {
                        lastHoveredRef.current = null;
                        handleSelectSentenceWrapper(closest);
                        isDragging.current = false;
                        isHolding.current = false;
                        return; // Done
                    }

                    // Fallback: if a word was hovered recently, treat as its click.
                    const recentHover = lastHoveredRef.current;
                    if (recentHover && Date.now() - recentHover.t <= HOVER_CLICK_WINDOW_MS) {
                        const recentRef = recentHover.ref;
                        if (recentRef?.current && recentRef.current.visible !== false) {
                            lastHoveredRef.current = null;
                            handleSelectSentenceWrapper(recentHover.data);
                            isDragging.current = false;
                            isHolding.current = false;
                            return;
                        }
                    }
                }

                // 1. Release Logic (Resume Speed)
                const MIN_SPEED = 20;

                // Determine direction: snapshot direction OR last known direction
                const direction = Math.sign(savedMomentum.current.speed) || lastDirectionRef.current || 1;

                // Force reset to MIN_SPEED in that direction. 
                speedRef.current = direction * MIN_SPEED;

                // 2. Rotation Logic
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
            suppressNearestClickRef.current = false;
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
    }, [selectedSentence, sentences]);

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
            // Only stop if user is explicitly holding (clicking/touching) to interact.
            // Hovering should NOT stop movement (User Request).

            if (isHolding.current) {
                // If holding, stop completely
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

    // Don't render until data is loaded

    if (!sentencesData) {
        return null;
    }

    return (
        <group>
            <RaycastHandler mouseRef={mouseRef} sphereRadius={raycastRadius} />
            {sentences.map((data, i) => (
                <SentenceWrapper
                    key={i}
                    id={i}
                    data={data}
                    onSelect={handleSelectSentenceWrapper}
                    onHoverChange={handleHoverChange}
                    onHoverItem={recordHoverItem}
                    onDirectPointerDown={markDirectPointerDown}
                    onDirectPointerUp={markDirectPointerUp}
                    registerItem={registerItem}
                    unregisterItem={unregisterItem}
                    frozen={!!selectedSentence}
                />
            ))}

        </group>
    );
};

export default WordCloud;
