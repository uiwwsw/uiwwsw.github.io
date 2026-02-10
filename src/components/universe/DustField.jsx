import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function DustField({ count = 2000 }) {
    const mesh = useRef();

    // Generate random dust positions
    const particles = useMemo(() => {
        const temp = new Float32Array(count * 3);
        const radius = 40; // Closer than stars
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * radius * 2;
            const y = (Math.random() - 0.5) * radius * 2;
            const z = (Math.random() - 0.5) * radius * 2;

            temp[i * 3] = x;
            temp[i * 3 + 1] = y;
            temp[i * 3 + 2] = z;
        }
        return temp;
    }, [count]);

    useFrame((state, delta) => {
        if (mesh.current) {
            // Subtle ambient float
            mesh.current.rotation.y += delta * 0.05;
            mesh.current.rotation.x += delta * 0.01;
        }
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.length / 3}
                    array={particles}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color="#88ccff"
                sizeAttenuation={true}
                transparent={true}
                opacity={0.4}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}
