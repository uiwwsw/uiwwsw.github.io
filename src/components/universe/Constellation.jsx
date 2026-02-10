import React, { useMemo, useState } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

export function Constellation({ article, position, onClick }) {
    const [hovered, setHovered] = useState(false);

    // Layout sentences in a spiral or line relative to the group position
    const { stars, connections } = useMemo(() => {
        const starPoints = [];
        const connectionPoints = [];

        // Simple spiral layout
        const radiusGrowth = 0.5;
        const heightGrowth = 0.2;

        article.sentences.forEach((sentence, i) => {
            const angle = i * 0.8;
            const r = i * radiusGrowth;
            const x = r * Math.cos(angle);
            const z = r * Math.sin(angle);
            const y = i * heightGrowth;

            starPoints.push(new THREE.Vector3(x, y, z));

            if (i > 0) {
                connectionPoints.push([starPoints[i - 1], starPoints[i]]);
            }
        });

        return { stars: starPoints, connections: connectionPoints };
    }, [article]);

    const starGeometry = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);
    const starMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: hovered ? "#00F3FF" : "#aaaaaa" }), [hovered]);

    return (
        <group position={position}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={(e) => { e.stopPropagation(); onClick(article); }}
        >
            {/* Invisible Hitbox for easier clicking */}
            <mesh visible={false}>
                <sphereGeometry args={[2.5, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            {/* Title Label (Visible on hover or always if close?) */}
            <Html position={[0, stars.length * 0.2 + 2, 0]} distanceFactor={10} center>
                <div style={{
                    color: hovered ? '#00F3FF' : 'rgba(255,255,255,0.7)',
                    fontFamily: 'SUITE Variable, monospace',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    textShadow: '0 0 8px #000000',
                    transition: 'all 0.3s ease',
                    transform: hovered ? 'scale(1.2)' : 'scale(1)'
                }}>
                    {article.title}
                </div>
            </Html>

            {/* Stars (Sentences) */}
            {stars.map((pos, i) => (
                <mesh key={i} position={pos} geometry={starGeometry} material={starMaterial} />
            ))}

            {/* Connection Lines (Constellation Shape) */}
            {hovered && connections.map((pair, i) => (
                <Line key={i} points={pair} color="#00F3FF" opacity={0.3} transparent lineWidth={1} />
            ))}
        </group>
    );
}
