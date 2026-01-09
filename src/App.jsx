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

  // Disable context menu
  React.useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

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
            <span className="gradient-text">Thoughts</span>
            <br />
            & Code.
          </h1>
          <p className="subtitle">
            이곳은 제 머릿속을 부유하는, 수많은 생각의 우주입니다.
          </p>

          {/* <div className="stats">
            <div className="stat-item">
              <span className="value">System</span>
              <span className="label">Online</span>
            </div>
          </div> */}
        </main>
      </div>

      {/* DETAIL OVERLAY (HTML) */}
      {/* DETAIL OVERLAY (HTML) */}
      <div
        className="detail-overlay"
        style={{
          opacity: selectedSentence ? 1 : 0,
          pointerEvents: selectedSentence ? 'auto' : 'none',
          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: selectedSentence ? '0.2s' : '0s'
        }}
      >
        {selectedSentence && (
          <>
            {/* 1. Navbar */}
            <nav className="detail-navbar">
              <button onClick={handleBack} className="btn-back" aria-label="Go Back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="navbar-title">
                {contextData[selectedSentence.articleId]?.title || 'Untitled'}
              </div>
              <div className="navbar-spacer" />
            </nav>

            {/* 2. Article Content */}
            <article className="detail-article">
              <div className="article-body">
                {contextSentences.map((sentence, index) => (
                  <div
                    key={index}
                    className={`article-block ${sentence.isSelected ? 'is-selected' : 'is-context'}`}
                  >
                    {sentence.type === 'code' ? (
                      <div className="code-window">
                        <div className="code-header">
                          <span className="code-dot red"></span>
                          <span className="code-dot yellow"></span>
                          <span className="code-dot green"></span>
                        </div>
                        <pre><code>{sentence.text}</code></pre>
                      </div>
                    ) : sentence.type === 'image' ? (
                      <div className="image-placeholder">
                        <span className="icon">🖼️</span>
                        <span className="label">Image Content</span>
                      </div>
                    ) : (
                      <p className="text-paragraph">
                        {sentence.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* 3. Footer / CTA */}
              <div className="article-footer">
                <button
                  className="btn-primary-cta"
                  onClick={() => window.open(selectedSentence.link, '_blank')}
                >
                  <span className="btn-text">전체 글 읽기</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </article>
          </>
        )}
      </div>
    </>
  );
}
