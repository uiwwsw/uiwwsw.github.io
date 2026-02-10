import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Html } from '@react-three/drei';
import { Starfield } from './Starfield';
import { Constellation } from './Constellation';
import { ReadingPath } from './ReadingPath';
import { WarpField } from './WarpField';
import { DustField } from './DustField';
import * as THREE from 'three';
import contextData from '../../data/velog-context.json';

export function UniverseScene({ onModeChange }) {
    const { camera } = useThree();
    const [immersionMode, setImmersionMode] = React.useState(null);
    const [isWarping, setIsWarping] = React.useState(false);

    // Map data to positions with clusters (Nebulas)
    const constellations = useMemo(() => {
        const items = Object.values(contextData);
        const count = items.length;

        // 1. Identify Clusters (Tags)
        const tagGroups = {};
        items.forEach(item => {
            const mainTag = (item.tags && item.tags[0]) || 'Uncategorized';
            if (!tagGroups[mainTag]) tagGroups[mainTag] = [];
            tagGroups[mainTag].push(item);
        });

        const clusters = Object.keys(tagGroups);
        const clusterCount = clusters.length;

        // Assign positions to clusters
        const clusterPositions = clusters.map((tag, i) => {
            const phi = Math.acos(-1 + (2 * i) / clusterCount);
            const theta = Math.sqrt(clusterCount * Math.PI) * phi;
            const radius = 60; // Nebulas are far apart
            return {
                tag,
                center: new THREE.Vector3(
                    radius * Math.cos(theta) * Math.sin(phi),
                    radius * Math.sin(theta) * Math.sin(phi),
                    radius * Math.cos(phi)
                ),
                color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5) // Distinct color per nebula
            };
        });

        const result = [];

        // 2. Position Articles within their Cluster
        clusterPositions.forEach(cluster => {
            const articles = tagGroups[cluster.tag];
            const articleCount = articles.length;

            articles.forEach((article, i) => {
                // Distribute locally around cluster center
                const offsetRadius = 15; // Size of the nebula
                const phi = Math.acos(-1 + (2 * i) / articleCount);
                const theta = Math.sqrt(articleCount * Math.PI) * phi;

                const localPos = new THREE.Vector3(
                    offsetRadius * Math.cos(theta) * Math.sin(phi),
                    offsetRadius * Math.sin(theta) * Math.sin(phi),
                    offsetRadius * Math.cos(phi)
                );

                // Add some randomness
                localPos.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5
                ));

                result.push({
                    article,
                    position: cluster.center.clone().add(localPos),
                    clusterColor: cluster.color
                });
            });
        });

        return { constellations: result, clusters: clusterPositions };
    }, []);

    React.useEffect(() => {
        onModeChange && onModeChange(immersionMode ? 'IMMERSION' : 'EXPLORATION');
    }, [immersionMode, onModeChange]);

    React.useEffect(() => {
        const handleExit = () => setImmersionMode(null);
        window.addEventListener('exit-immersion', handleExit);
        return () => window.removeEventListener('exit-immersion', handleExit);
    }, []);

    const handleConstellationClick = (article) => {
        console.log("Initiating Warp Sequence to:", article.title);
        setIsWarping(true);

        // Warp transition duration
        setTimeout(() => {
            setImmersionMode(article);
            setIsWarping(false);
        }, 2000);
    };

    const handleExitImmersion = () => {
        setImmersionMode(null);
    };

    return (
        <>
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 20, 100]} />

            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            {!immersionMode ? (
                <>
                    <Starfield count={8000} radius={80} />
                    <DustField count={2000} />
                    <WarpField active={isWarping} />

                    {/* Render Nebulas (Clusters) */}
                    {constellations.clusters.map((cluster, i) => (
                        <group key={`cluster-${i}`} position={cluster.center}>
                            <Html distanceFactor={40} center transform sprite>
                                <div style={{
                                    color: `#${cluster.color.getHexString()}`,
                                    fontFamily: 'SUITE Variable',
                                    fontSize: '40px',
                                    fontWeight: 'bold',
                                    textShadow: '0 0 20px currentColor',
                                    opacity: 0.6,
                                    letterSpacing: '4px',
                                    textTransform: 'uppercase'
                                }}>
                                    {cluster.tag}
                                </div>
                            </Html>
                            {/* Add a subtle glow light for the nebula */}
                            <pointLight color={cluster.color} intensity={2} distance={30} decay={2} />
                        </group>
                    ))}

                    {constellations.constellations.map((c, i) => (
                        <Constellation
                            key={i}
                            article={c.article}
                            position={c.position}
                            onClick={handleConstellationClick}
                        />
                    ))}
                    <OrbitControls
                        enablePan={false}
                        enableZoom={true}
                        minDistance={5}
                        maxDistance={90}
                        autoRotate={true}
                        autoRotateSpeed={0.3}
                    />
                </>
            ) : (
                <ReadingPath article={immersionMode} onExit={handleExitImmersion} />
            )}
        </>
    );
}
