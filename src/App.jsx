import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Html } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import './index.css';

// --------------------------------------------------------
// Shaders for the "Digital Universe" Effect
// --------------------------------------------------------

const signalVertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uHover;
  
  attribute vec3 aGridPos; // Original grid position
  attribute float aSpeed;  // Individual speed
  attribute float aOffset; // Time offset
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDist;     // Distance for depth fading
  
  void main() {
    float t = uTime * aSpeed + aOffset;
    
    // Position Loop: Move only along Y axis (like data streams)
    vec3 pos = aGridPos;
    float height = 40.0;
    pos.y = mod(pos.y + t, height) - (height * 0.5);
    
    // Mouse Interaction: Displace X/Z like a magnetic field
    // We compute distance in 2D (View plane approximation or world XZ)
    // Here we use world XZ for a "force field" column effect
    float dist = distance(pos.xz, uMouse * 20.0);
    float radius = 5.0;
    
    if (dist < radius) {
      vec2 dir = normalize(pos.xz - uMouse * 20.0);
      float force = (1.0 - dist / radius);
      // Push outwards horizontally
      pos.xz += dir * force * 3.0 * uHover;
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation: 
    // We want them to look like little dashes/squares
    gl_PointSize = (150.0 * aSpeed) * (1.0 / -mvPosition.z);
    
    // Color Logic
    // Bright head, trailing tail effect handled in fragment?
    // Or just vary color by speed (faster = brighter)
    float brightness = 0.5 + aSpeed * 0.5;
    vec3 baseColor = vec3(0.1, 0.4, 1.0); // Cyan Blue
    vec3 hotColor = vec3(0.8, 0.2, 1.0);  // Magento/Purple
    
    vColor = mix(baseColor, hotColor, aSpeed * uHover); 
    
    // Digital Blink effect based on position
    float blink = sin(pos.y * 0.5 + uTime * 5.0) * 0.5 + 0.5;
    vColor += vec3(blink * 0.3);

    // Pass view depth for custom fog if needed, or use vDist
    vDist = -mvPosition.z;
    vAlpha = smoothstep(50.0, 0.0, vDist); // Fade far particles
  }
`;

const signalFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Square / Signal Shape
    // No "discard" for circles, we want digital squares.
    
    // Add a stylized border or core
    vec2 uv = gl_PointCoord - 0.5;
    float d = max(abs(uv.x), abs(uv.y)); // Chebyshev distance (Square)
    
    // Crisp edge
    if (d > 0.5) discard;
    
    // Inner Glow
    float strength = 1.0 - smoothstep(0.2, 0.5, d);
    
    gl_FragColor = vec4(vColor * strength * 2.0, vAlpha);
  }
`;

// --------------------------------------------------------
// Structured Grid Component
// --------------------------------------------------------

const DigitalStream = () => {
  const meshRef = useRef();

  const { positions, speeds, offsets } = useMemo(() => {
    const count = 5000; // Dense field
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    const columns = 50; // X
    const rows = 50;    // Z (Depth)
    const spacing = 1.2;

    let i = 0;
    for (let x = 0; x < columns; x++) {
      for (let z = 0; z < rows; z++) {
        // Create 2 particles per column slightly offset for trail feel
        for (let k = 0; k < 2; k++) {
          if (i >= count) break;

          // Grid with some jitter (so it's not PERFECTLY boring)
          const jitterX = (Math.random() - 0.5) * 0.5;
          const jitterZ = (Math.random() - 0.5) * 0.5;

          positions[i * 3] = (x - columns / 2) * spacing + jitterX; // X
          positions[i * 3 + 1] = (Math.random() - 0.5) * 40;        // Y (Vertical distribution)
          positions[i * 3 + 2] = (z - rows / 2) * spacing + jitterZ; // Z

          // Speed: Some streams are fast (data), some static (structure)
          speeds[i] = Math.random() > 0.8 ? 2.5 : 0.2; // 20% Fast signals
          offsets[i] = Math.random() * 100;
          i++;
        }
      }
    }

    return { positions, speeds, offsets };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 0 }
  }), []);

  const { pointer } = useThree();
  const targetHover = useRef(0);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;

      // Smooth mouse
      meshRef.current.material.uniforms.uMouse.value.lerp(pointer, 0.05);

      // Hover disturbance calculation
      const speed = Math.abs(pointer.x - meshRef.current.material.uniforms.uMouse.value.x) +
        Math.abs(pointer.y - meshRef.current.material.uniforms.uMouse.value.y);
      targetHover.current = THREE.MathUtils.lerp(targetHover.current, speed * 15.0, 0.1);

      // Clamp hover to avoid explosion
      meshRef.current.material.uniforms.uHover.value = Math.min(targetHover.current, 2.0);
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aGridPos" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSpeed" count={speeds.length} array={speeds} itemSize={1} />
        <bufferAttribute attach="attributes-aOffset" count={offsets.length} array={offsets} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={signalVertexShader}
        fragmentShader={signalFragmentShader}
        transparent
      />
    </points>
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
          <color attach="background" args={['#020204']} />
          <PerspectiveCamera makeDefault position={[0, 2, 20]} fov={55} />

          <DigitalStream />

          {/* Post Processing for the "Deep/Film" look */}
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
            <DepthOfField target={[0, 0, 0]} focalLength={0.3} bokehScale={5} height={700} />
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
