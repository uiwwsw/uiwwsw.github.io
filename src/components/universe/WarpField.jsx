import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function WarpField({ active = false }) {
    const count = 1000;
    const mesh = useRef();
    const light = useRef();

    // Create lines radiating from center
    const { positions, colors } = useMemo(() => {
        const pos = new Float32Array(count * 3 * 2); // 2 points per line
        const cols = new Float32Array(count * 3 * 2);
        const color = new THREE.Color('#00ffff');

        for (let i = 0; i < count; i++) {
            const r = 100 + Math.random() * 100;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);

            // Start point (far)
            pos[i * 6] = x * r;
            pos[i * 6 + 1] = y * r;
            pos[i * 6 + 2] = z * r;

            // End point (closer - creating the streak)
            pos[i * 6 + 3] = x * (r - 20); // Length of streak
            pos[i * 6 + 4] = y * (r - 20);
            pos[i * 6 + 5] = z * (r - 20);

            color.toArray(cols, i * 6);
            color.toArray(cols, i * 6 + 3);
        }

        return { positions: pos, colors: cols };
    }, []);

    useFrame((state, delta) => {
        if (!mesh.current || !active) return;

        // Rotate and scale to simulate speed
        mesh.current.rotation.z += delta * 0.2;

        const scale = active ? 1 + (Math.sin(state.clock.elapsedTime * 10) * 0.1) : 1;
        mesh.current.scale.set(scale, scale, scale * 2);

        // Pass through effect
        if (active) {
            mesh.current.rotation.z += delta * 2;
        }
    });

    if (!active) return null;

    return (
        <lineSegments ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count * 2}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={count * 2}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial
                vertexColors={true}
                blending={THREE.AdditiveBlending}
                transparent={true}
                opacity={0.6}
            />
        </lineSegments>
    );
}
