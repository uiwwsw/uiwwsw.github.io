import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Html } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import './index.css';
import { createAlphabetTexture } from './utils/alphabetTexture';

// --------------------------------------------------------
// Shaders for the "Fluid Alphabet" Effect (Top Down)
// --------------------------------------------------------

const alphabetVertexShader = `
  uniform float uTime;
  uniform vec3 uMouse; // Changed to vec3 to hold World Position (X, Y, Z) directly
  uniform float uHover;
  uniform vec2 uAtlasGrid; 
  
  attribute vec3 aGridPos;
  attribute float aCharIndex;
  attribute float aOffset; 
  
  varying float vAlpha;
  varying float vCharIndex;

  void main() {
    vCharIndex = aCharIndex;
    float t = uTime * 0.8;
    
    // 1. Base Position
    vec3 pos = aGridPos;
    
    // 2. Breathing / Density Effect
    // Instead of waves up/down, we move X/Z to expand/contract
    float breatheX = sin(pos.x * 0.15 + t + aOffset * 0.1);
    float breatheZ = cos(pos.z * 0.15 + t * 0.9);
    
    // Apply small horizontal displacement
    // This creates the "breathing" density look
    pos.x += breatheX * 0.5; 
    pos.z += breatheZ * 0.5;
    
    // 3. Mouse Interaction (Repulsion/Lens)
    // uMouse is now in World Space coordinates
    // We only care about XZ distance
    float dist = distance(pos.xz, uMouse.xz); 
    float radius = 12.0;
    float influence = smoothstep(radius, 0.0, dist); // 1.0 at center, 0 at edge
    
    vec2 dir = normalize(pos.xz - uMouse.xz);
    
    // Strong repulsion (Push away)
    pos.xz += dir * influence * 6.0 * uHover;
    
    // Slight lift to create 3D feel even in top down (parallax)
    // Lifts them up towards camera slightly
    pos.y += influence * 6.0 * uHover;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (500.0) * (1.0 / -mvPosition.z);
    
    // Visibility logic
    // Rule: "Initially invisible" (User Request 1). 
    // Revealed by: 
    // A) The "breathing" motion (faintly)
    // B) Mouse interaction (brightly)
    
    float motionVisibility = smoothstep(0.7, 1.0, abs(breatheX * breatheZ)); // Only show "crests" of density
    float mouseVisibility = influence * 4.0;
    
    // Base State: Very faint / Visible only on movement
    vAlpha = 0.0 + (motionVisibility * 0.15) + mouseVisibility;
    vAlpha = clamp(vAlpha, 0.0, 1.0);
  }
`;

const alphabetFragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uAtlasGrid; 
  
  varying float vAlpha;
  varying float vCharIndex;

  void main() {
    vec2 spriteUV = gl_PointCoord;
    spriteUV.y = 1.0 - spriteUV.y; // Flip Y
    
    // Atlas Mapping
    float cols = uAtlasGrid.x;
    float rows = uAtlasGrid.y;
    float col = mod(vCharIndex, cols);
    float row = floor(vCharIndex / cols);
    
    vec2 cellUV = vec2(
      (col + spriteUV.x) / cols,
      (row + spriteUV.y) / rows
    );
    
    vec4 texColor = texture2D(uTexture, cellUV);
    
    if (texColor.a < 0.1) discard; 
    
    // Color Strategy
    vec3 color = vec3(0.9, 0.95, 1.0);
    
    // Highlight mouse interaction area 
    if (vAlpha > 0.8) {
      color = vec3(1.0, 1.0, 1.0); 
    } else {
       color = vec3(0.6, 0.7, 0.8); 
    }
    
    gl_FragColor = vec4(color, vAlpha * texColor.a);
  }
`;

// --------------------------------------------------------
// Alphabet Grid Component
// --------------------------------------------------------

const AlphabetGrid = () => {
  const meshRef = useRef();
  const { texture, cols, rows, count: charCount } = useMemo(() => createAlphabetTexture(), []);

  const { positions, charIndices, offsets } = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const charIndices = new Float32Array(count);
    const offsets = new Float32Array(count);

    const gridCols = 70;
    const gridRows = 70;
    const spacingX = 1.0;
    const spacingZ = 1.0;

    // Center it
    const startX = -(gridCols * spacingX) / 2;
    const startZ = -(gridRows * spacingZ) / 2;

    let i = 0;
    for (let x = 0; x < gridCols; x++) {
      for (let z = 0; z < gridRows; z++) {
        if (i >= count) break;

        // Regular Grid
        positions[i * 3] = startX + x * spacingX;
        positions[i * 3 + 1] = 0.0;
        positions[i * 3 + 2] = startZ + z * spacingZ;

        charIndices[i] = Math.floor(Math.random() * charCount);
        offsets[i] = Math.random() * 100;
        i++;
      }
    }
    return { positions, charIndices, offsets };
  }, [charCount]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector3(9999, 0, 9999) }, // World Space Target
    uHover: { value: 1.0 },
    uTexture: { value: texture },
    uAtlasGrid: { value: new THREE.Vector2(cols, rows) }
  }), [texture, cols, rows]);

  // Handle Raycasting via Pointer Events on a Plane
  // We need a ref to store the target mouse position from the event
  const targetMouse = useRef(new THREE.Vector3(9999, 0, 9999));

  const handlePointerMove = (e) => {
    // e.point is the Vector3 world intersection point
    // We update our target
    targetMouse.current.copy(e.point);
  };

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;

      // Lerp for smoothness
      meshRef.current.material.uniforms.uMouse.value.lerp(targetMouse.current, 0.15);
    }
  });

  return (
    <group>
      {/* Interaction Plane: Invisible, covers the grid area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} onPointerMove={handlePointerMove}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-aGridPos" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-aCharIndex" count={charIndices.length} array={charIndices} itemSize={1} />
          <bufferAttribute attach="attributes-aOffset" count={offsets.length} array={offsets} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={alphabetVertexShader}
          fragmentShader={alphabetFragmentShader}
          transparent
        />
      </points>
    </group>
  );
};

// --------------------------------------------------------
// Main Scenery
// --------------------------------------------------------

export default function App() {
  return (
    <>
      <div className="canvas-container">
        <Canvas gl={{ antialias: false, alpha: false, stencil: false, depth: true }}>
          <color attach="background" args={['#020202']} />
          {/* Top Down Camera: position Y=50, lookAt 0,0,0 */}
          <PerspectiveCamera makeDefault position={[0, 40, 0]} fov={50} onUpdate={c => c.lookAt(0, 0, 0)} />

          <AlphabetGrid />

          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.0} mipmapBlur intensity={1.2} radius={0.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>

          <ambientLight intensity={0.5} />
        </Canvas>
      </div>

      <div className="overlay">
        <header className="header">
          <div className="logo">uiwwsw</div>
          <nav>
            <a href="https://github.com/uiwwsw" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="mailto:uiwwsw@icloud.com">Email</a>
          </nav>
        </header>

        <main className="content">
          <h1>
            <span className="gradient-text">Signals</span>
            <br />
            From the Void.
          </h1>
          <p className="subtitle">
            Exploring the intersection of code, motion, and depth.
          </p>

          <div className="stats">
            <div className="stat-item">
              <span className="value">System</span>
              <span className="label">Online</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
