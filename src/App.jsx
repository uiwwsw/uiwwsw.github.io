import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Html } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import './index.css';
import { FloatingWords } from './FloatingWords';

// --------------------------------------------------------
// Main Scenery
// --------------------------------------------------------

export default function App() {
  return (
    <>
      <div className="canvas-container">
        <Canvas gl={{ antialias: false, alpha: false, stencil: false, depth: true }}>
          <color attach="background" args={['#020204']} />
          <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={50} />

          <FloatingWords />

          {/* Post Processing for the "Deep/Film" look */}
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.2} radius={0.4} />
            <DepthOfField target={[0, 0, 0]} focalLength={0.5} bokehScale={5} height={700} />
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
