import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import './index.css';
import WordCloud from './components/WordCloud';
import contextData from './data/velog-context.json';

// --------------------------------------------------------
// Main Scenery
// --------------------------------------------------------

// Externalize config to prevent Canvas remounts
const canvasConfig = { antialias: false, alpha: false, stencil: false, depth: true };

export default function App() {
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [contextSentences, setContextSentences] = useState([]);

  const handleSelectSentence = (sentenceData) => {
    setSelectedSentence(sentenceData);

    // Get context sentences (exactly 5 total if possible)
    if (sentenceData && contextData[sentenceData.articleId]) {
      const article = contextData[sentenceData.articleId];
      const sentences = article.sentences;
      const currentIndex = Number(sentenceData.sentenceIndex);

      // Strategy: Show 5 sentences total
      // Prefer: 2 before + selected + 2 after
      // If not enough before/after, adjust accordingly
      const TARGET_COUNT = 5;
      let startIdx = Math.max(0, currentIndex - 2);
      let endIdx = Math.min(sentences.length, currentIndex + 3);

      // Adjust if we don't have enough sentences
      const currentCount = endIdx - startIdx;
      if (currentCount < TARGET_COUNT) {
        // Try to add more from the other side
        if (startIdx === 0) {
          // Add more after
          endIdx = Math.min(sentences.length, startIdx + TARGET_COUNT);
        } else if (endIdx === sentences.length) {
          // Add more before
          startIdx = Math.max(0, endIdx - TARGET_COUNT);
        }
      }

      const context = [];
      for (let i = startIdx; i < endIdx; i++) {
        context.push({
          text: sentences[i].fullSentence,
          type: sentences[i].type || 'text',
          isSelected: i === currentIndex
        });
      }

      setContextSentences(context);
    }
  };

  const handleBack = () => {
    setSelectedSentence(null);
    setContextSentences([]);
  };

  return (
    <>
      <div className={`canvas-container ${selectedSentence ? 'detail-active' : ''}`}>
        <Canvas gl={canvasConfig}>
          <color attach="background" args={['#020202']} />
          <PerspectiveCamera makeDefault position={[0, 40, 0]} fov={50} />

          <WordCloud
            onSelectSentence={handleSelectSentence}
            selectedSentence={selectedSentence}
            contextSentences={contextSentences}
          />

          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.0} mipmapBlur intensity={0.8} radius={0.5} />
            {!selectedSentence && <Vignette eskil={false} offset={0.1} darkness={1.1} />}
          </EffectComposer>

          <ambientLight intensity={0.5} />
        </Canvas>
      </div>

      <div className={`overlay ${selectedSentence ? 'hidden' : ''}`} style={{ opacity: selectedSentence ? 0 : 1, transition: 'opacity 0.5s' }}>
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

      {/* Back Button (only visible during dimension travel) */}
      {selectedSentence && (
        <button
          onClick={handleBack}
          style={{
            position: 'fixed',
            top: '2rem',
            left: '2rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'Space Grotesk, system-ui, sans-serif',
            fontWeight: '500',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ← 뒤로가기
        </button>
      )}

      {/* Blog Link Button */}
      {selectedSentence && (
        <button
          onClick={() => window.open(selectedSentence.link, '_blank')}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontFamily: 'Space Grotesk, system-ui, sans-serif',
            fontWeight: '600',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#a855f7';
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 30px rgba(168, 85, 247, 0.6)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#7c3aed';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.4)';
          }}
        >
          블로그 보러가기 →
        </button>
      )}

      {/* DETAIL OVERLAY (HTML) */}
      <div
        className="detail-overlay"
        style={{
          opacity: selectedSentence ? 1 : 0,
          pointerEvents: selectedSentence ? 'auto' : 'none',
          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: selectedSentence ? '0.3s' : '0s'
        }}
      >
        <div className="detail-content">
          {contextSentences.map((sentence, index) => (
            <div
              key={index}
              className={`detail-sentence ${sentence.isSelected ? 'selected' : ''}`}
            >
              {sentence.type === 'code' ? (
                <pre className="detail-code">
                  <code>{sentence.text}</code>
                </pre>
              ) : sentence.type === 'image' ? (
                <div className="detail-image-label">[이미지]</div>
              ) : (
                sentence.text
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
