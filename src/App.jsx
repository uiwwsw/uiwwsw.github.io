import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import './index.css';
import { buildUniverseModel, getContextWindow } from './utils/universeModel';

const WordCloud = lazy(() => import('./components/WordCloud'));
const loadContextData = () => import('./data/velog-context.json');

const canvasConfig = {
  antialias: true,
  alpha: false,
  stencil: false,
  depth: true,
  powerPreference: 'high-performance'
};

function getOverlayMetrics(width, height) {
  const safeWidth = Math.max(width ?? (typeof window !== 'undefined' ? window.innerWidth : 1440), 320);
  const safeHeight = Math.max(height ?? (typeof window !== 'undefined' ? window.innerHeight : 940), 320);
  const isMobile = safeWidth <= 768;
  const isTablet = safeWidth <= 1180;
  const frameWidth = isMobile ? 430 : isTablet ? 1040 : 1440;
  const frameHeight = isMobile ? 920 : isTablet ? 1060 : 940;
  const scale = Math.min(1, safeWidth / frameWidth, safeHeight / frameHeight);

  return {
    frameWidth,
    frameHeight,
    scale: Number(scale.toFixed(3))
  };
}

export default function App() {
  const [contextData, setContextData] = useState(null);
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [contextSentences, setContextSentences] = useState([]);
  const [focusedArticle, setFocusedArticle] = useState(null);
  const [overlayMetrics, setOverlayMetrics] = useState(() => getOverlayMetrics());

  useEffect(() => {
    let mounted = true;

    loadContextData().then(module => {
      if (mounted) {
        setContextData(module.default);
      }
    }).catch((error) => {
      console.error('Failed to load mental universe data.', error);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleContextMenu = (event) => event.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    const updateOverlayMetrics = () => {
      setOverlayMetrics(getOverlayMetrics(window.innerWidth, window.innerHeight));
    };

    updateOverlayMetrics();
    window.addEventListener('resize', updateOverlayMetrics);
    window.addEventListener('orientationchange', updateOverlayMetrics);

    return () => {
      window.removeEventListener('resize', updateOverlayMetrics);
      window.removeEventListener('orientationchange', updateOverlayMetrics);
    };
  }, []);

  const universe = useMemo(() => {
    if (!contextData) return null;
    return buildUniverseModel(contextData);
  }, [contextData]);

  const selectedArticle = selectedSentence && universe
    ? universe.articleById[selectedSentence.articleId]
    : null;
  const activeArticle = selectedArticle || focusedArticle || universe?.articles[0] || null;

  const handleSelectSentence = (sentenceData) => {
    if (!universe) return;

    const article = universe.articleById[sentenceData.articleId];

    setSelectedSentence(sentenceData);
    setContextSentences(getContextWindow(article, sentenceData.sentenceIndex, 7));
  };

  const handleBack = () => {
    setSelectedSentence(null);
    setContextSentences([]);
  };

  const handleOpenArticle = (article) => {
    if (!article) return;

    const sentenceIndex = Math.max(
      0,
      article.sentences.findIndex(sentence => (sentence.type || 'text') === 'text')
    );

    setSelectedSentence({
      articleId: article.articleId,
      sentenceIndex
    });
    setContextSentences(getContextWindow(article, sentenceIndex, 7));
  };

  if (!universe) {
    return <div className="app-shell" aria-hidden="true" />;
  }

  const overlayStyle = {
    '--overlay-scale': overlayMetrics.scale,
    '--overlay-frame-width': `${overlayMetrics.frameWidth}px`,
    '--overlay-frame-height': `${overlayMetrics.frameHeight}px`
  };

  return (
    <div className="app-shell">
      <div className={`canvas-container ${selectedSentence ? 'detail-active' : ''}`}>
        <Canvas
          gl={canvasConfig}
          dpr={[1, 1.6]}
          onCreated={({ gl }) => {
            gl.setClearColor('#02040a');
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
          }}
        >
          <color attach="background" args={['#02040a']} />
          <PerspectiveCamera makeDefault position={[0, 12, 920]} fov={50} />

          <Suspense fallback={null}>
            <WordCloud
              universe={universe}
              selectedSentence={selectedSentence}
              onSelectSentence={handleSelectSentence}
              onFocusArticleChange={setFocusedArticle}
            />
          </Suspense>

          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0} mipmapBlur intensity={0.72} radius={0.62} />
            <Vignette eskil={false} offset={0.12} darkness={0.9} />
          </EffectComposer>

          <ambientLight intensity={0.78} />
          <directionalLight position={[140, 220, 180]} intensity={0.38} color="#9ad5ff" />
          <pointLight position={[-180, 60, 240]} intensity={0.22} color="#ffc670" />
        </Canvas>
      </div>

      <div
        className={`overlay ${selectedSentence ? 'is-hidden' : ''}`}
        style={overlayStyle}
      >
        <div className="overlay-inner">
          <div className="overlay-atmosphere overlay-atmosphere-a" />
          <div className="overlay-atmosphere overlay-atmosphere-b" />

          <section className="hero-shell">
            <header className="header">
              <div className="brand-block">
                <span className="brand-kicker">GitHub Pages Mental Universe</span>
                <div className="logo">uiwwsw</div>
              </div>
              <nav className="header-nav">
                <a href="https://velog.io/@uiwwsw" target="_blank" rel="noreferrer">Velog</a>
                <a href="https://github.com/uiwwsw" target="_blank" rel="noreferrer">GitHub</a>
              </nav>
            </header>

            <div className="hero">
              <p className="eyebrow">항해하는 생각의 우주</p>
              <h1>
                내 모든 글이
                <br />
                별자리와 성운이 되는 곳
              </h1>
              <p className="subtitle">
                Velog에 쌓인 문장과 코드 조각을 정신세계의 우주로 다시 엮었습니다.
                스크롤과 드래그로 항해하고, 문장을 눌러 그 글의 내면으로 들어가세요.
              </p>

              <div className="hero-hints">
                <span className="desktop-only">드래그로 시선 이동 · 스크롤로 가속과 감속</span>
                <span className="mobile-only">드래그로 시선 이동 · 핀치로 속도 조절</span>
                <span>문장을 누르면 같은 글의 문맥이 열립니다</span>
              </div>
            </div>
          </section>

          <section
            className="focus-panel is-interactive"
            style={{ '--focus-color': activeArticle?.color || '#83d8ff' }}
            onClick={() => handleOpenArticle(activeArticle)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleOpenArticle(activeArticle);
              }
            }}
            role="button"
            tabIndex={selectedSentence ? -1 : 0}
            aria-label={activeArticle ? `${activeArticle.title} 열기` : '현재 글 열기'}
          >
            <div className="focus-header">
              <span className="focus-label">Current Constellation</span>
              <span className="focus-sector">{activeArticle?.topicLabel}</span>
            </div>
            <h2>{activeArticle?.title}</h2>
            <p>{activeArticle?.excerpt}</p>
            <div className="focus-meta">
              <span>{activeArticle?.sentenceCount} fragments</span>
              <span>{activeArticle?.codeCount} code blocks</span>
              <span>{`Archive #${(activeArticle?.articleId || 0) + 1}`}</span>
            </div>
          </section>
        </div>
      </div>

      <div className={`detail-overlay ${selectedSentence ? 'is-open' : ''}`}>
        {selectedSentence && selectedArticle && (
          <div className="detail-shell">
            <nav className="detail-navbar">
              <button onClick={handleBack} className="btn-back" aria-label="별자리로 돌아가기">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div className="detail-nav-copy">
                <span className="detail-nav-label">Constellation View</span>
                <strong>{selectedArticle.constellationName}</strong>
              </div>

              <a className="detail-link" href={selectedArticle.link} target="_blank" rel="noreferrer">
                Velog 원문
              </a>
            </nav>

            <article className="detail-panel" style={{ '--detail-accent': selectedArticle.color }}>
              <div className="detail-header">
                <span className="detail-sector">{selectedArticle.topicLabel}</span>
                <h2>{selectedArticle.title}</h2>
                <p className="detail-excerpt">{selectedArticle.excerpt}</p>

                <div className="detail-meta">
                  <span>{selectedArticle.sentenceCount} fragments</span>
                  <span>{selectedArticle.codeCount} code blocks</span>
                  <span>{`Archive #${selectedArticle.articleId + 1}`}</span>
                </div>
              </div>

              <div className="article-body">
                {contextSentences.map((sentence, index) => (
                  <div
                    key={`${selectedArticle.articleId}-${index}`}
                    className={`article-block ${sentence.isSelected ? 'is-selected' : 'is-context'}`}
                  >
                    {sentence.type === 'code' ? (
                      <div className="code-window">
                        <div className="code-header">
                          <span className="code-dot red" />
                          <span className="code-dot yellow" />
                          <span className="code-dot green" />
                          <span className="code-language">{sentence.language || 'code'}</span>
                        </div>
                        <pre><code>{sentence.text}</code></pre>
                      </div>
                    ) : (
                      <p className="text-paragraph">{sentence.text}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="detail-footer">
                <button className="secondary-cta" onClick={handleBack}>
                  우주로 돌아가기
                </button>
                <a className="primary-cta" href={selectedArticle.link} target="_blank" rel="noreferrer">
                  전체 글 읽기
                </a>
              </div>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
