import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Html } from '@react-three/drei';

export function ReadingPath({ article, onExit }) {
    const { camera } = useThree();
    const pathRef = useRef();

    // Create a smooth path for the sentences
    const { path, points } = useMemo(() => {
        if (!article) return { path: null, points: [] };

        const pts = [];
        const sentenceSpacing = 15; // Distance between sentences

        // Create a gentle S-curve or straight line forward
        article.sentences.forEach((s, i) => {
            pts.push(new THREE.Vector3(0, Math.sin(i * 0.5) * 2, -i * sentenceSpacing));
        });

        const curve = new THREE.CatmullRomCurve3(pts);
        return { path: curve, points: pts };
    }, [article]);

    // Current progress along the path (0 to 1)
    const scrollProgress = useRef(0);
    const targetProgress = useRef(0);

    useEffect(() => {
        const handleScroll = (e) => {
            // Increased sensitivity significantly
            targetProgress.current += e.deltaY * 0.002;
            targetProgress.current = Math.max(0, Math.min(1, targetProgress.current));
        };

        window.addEventListener('wheel', handleScroll);
        return () => window.removeEventListener('wheel', handleScroll);
    }, []);

    useFrame((state, delta) => {
        // Smooth scroll interpolation
        const previous = scrollProgress.current;
        scrollProgress.current += (targetProgress.current - scrollProgress.current) * delta * 5;

        // Calculate velocity (units per second)
        const velocity = (scrollProgress.current - previous) / delta;

        // Dispatch telemetry event for HUD
        window.dispatchEvent(new CustomEvent('hud-telemetry', {
            detail: {
                velocity: Math.abs(velocity * 1000).toFixed(2), // Scale for visual effect
                progress: (scrollProgress.current * 100).toFixed(1)
            }
        }));

        if (path) {
            // Move camera along path
            const pos = path.getPointAt(scrollProgress.current);
            const tangent = path.getTangentAt(scrollProgress.current);

            // Camera follows the path, slightly offset
            camera.position.lerp(new THREE.Vector3(pos.x, pos.y + 2, pos.z + 10), 0.1);

            // Look slightly ahead
            const lookAtPos = path.getPointAt(Math.min(1, scrollProgress.current + 0.05));
            camera.lookAt(lookAtPos);
        }
    });

    if (!article) return null;

    const starGeometry = useMemo(() => new THREE.SphereGeometry(0.2, 16, 16), []);
    const starMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#00F3FF", emissive: "#00F3FF", emissiveIntensity: 2 }), []);

    return (
        <group>
            {/* Render Sentences along the path */}
            {points.map((pt, i) => (
                <group key={i} position={pt}>
                    <mesh geometry={starGeometry} material={starMaterial} />

                    {/* Text Content */}
                    <Html position={[0, 2.5, 0]} center distanceFactor={12} transform>
                        <div style={{
                            width: '800px',
                            textAlign: 'center',
                            color: 'white',
                            fontFamily: 'SUITE Variable, serif',
                            fontSize: '32px',
                            lineHeight: '1.6',
                            textShadow: '0 0 15px rgba(0,0,0,0.9)',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '20px',
                            borderRadius: '10px',
                            backdropFilter: 'blur(4px)'
                        }}>
                            {article.sentences[i].fullSentence}
                        </div>
                    </Html>
                </group>
            ))}

            {/* Draw the path line for debugging/visuals */}
            <line>
                <bufferGeometry setFromPoints={path.getPoints(200)} />
                <lineBasicMaterial color="rgba(255, 255, 255, 0.1)" transparent opacity={0.2} />
            </line>
        </group>
    );
}
