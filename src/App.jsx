import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import './index.css';
import WordCloud from './components/WordCloud';

// --------------------------------------------------------
// Main Scenery
// --------------------------------------------------------

export default function App() {
  return (
    <>
      <div className="canvas-container">
        <Canvas gl={{ antialias: false, alpha: false, stencil: false, depth: true }}>
          <color attach="background" args={['#020202']} />
          {/* Top Down Camera: position Y=40, lookAt 0,0,0 */}
          <PerspectiveCamera makeDefault position={[0, 40, 0]} fov={50} onUpdate={c => c.lookAt(0, 0, 0)} />



          <WordCloud />

          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.0} mipmapBlur intensity={0.8} radius={0.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>

          <ambientLight intensity={0.5} />
        </Canvas>
      </div>

      <div className="overlay">
        <header className="header">
          <div className="logo">uiwwsw</div>
          {/* <nav>
            <a href="https://github.com/uiwwsw" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="mailto:uiwwsw@icloud.com">Email</a>
          </nav> */}
        </header>

        <main className="content">
          <h1>
            <span className="gradient-text">Words</span>
            <br />
            & Code.
          </h1>
          <p className="subtitle">
            이곳은 제 머릿속을 부유하는 수많은 단어들의 우주입니다.
          </p>

          {/* <div className="stats">
            <div className="stat-item">
              <span className="value">System</span>
              <span className="label">Online</span>
            </div>
          </div> */}
        </main>
      </div>
    </>
  );
}
