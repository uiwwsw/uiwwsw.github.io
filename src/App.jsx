import React, {
  Suspense,
  lazy,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import './index.css';
import { buildUniverseModel, getContextWindow } from './utils/universeModel';

const WordCloud = lazy(() => import('./components/WordCloud'));
const loadContextData = () => import('./data/velog-context.json');
const UNIVERSE_SEED_STORAGE_KEY = 'uiwwsw.universe-seed.v1';
const GUIDE_DISMISSED_STORAGE_KEY = 'uiwwsw.guide-dismissed.v1';
const DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

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

function createUniverseSeed() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0];
  }

  return Math.floor(Math.random() * 4294967296);
}

function readUniverseSeed() {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const urlSeed = Number(params.get('seed'));

    if (params.has('seed') && Number.isFinite(urlSeed)) {
      const normalizedSeed = urlSeed >>> 0;
      window.localStorage.setItem(UNIVERSE_SEED_STORAGE_KEY, String(normalizedSeed));
      return normalizedSeed;
    }

    const storedSeed = window.localStorage.getItem(UNIVERSE_SEED_STORAGE_KEY);
    const parsedSeed = Number(storedSeed);

    if (storedSeed && Number.isFinite(parsedSeed)) {
      return parsedSeed >>> 0;
    }

    const nextSeed = createUniverseSeed();
    window.localStorage.setItem(UNIVERSE_SEED_STORAGE_KEY, String(nextSeed));
    return nextSeed;
  } catch (error) {
    console.warn('Falling back to ephemeral universe seed.', error);
    return createUniverseSeed();
  }
}

function readGuideDismissed() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(GUIDE_DISMISSED_STORAGE_KEY) === '1';
  } catch (error) {
    console.warn('Failed to read guide preference.', error);
    return false;
  }
}

function persistGuideDismissed() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(GUIDE_DISMISSED_STORAGE_KEY, '1');
  } catch (error) {
    console.warn('Failed to persist guide preference.', error);
  }
}

function truncateLabel(text, maxLength = 56) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function estimateReadingTime(sentences = []) {
  const content = sentences
    .filter(sentence => (sentence.type || 'text') !== 'code')
    .map(sentence => sentence.fullSentence || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!content) {
    return 1;
  }

  return Math.max(1, Math.ceil(content.split(' ').length / 220));
}

function formatPublishedDate(publishedAt) {
  if (!publishedAt) return null;

  const parsed = new Date(publishedAt);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return DATE_FORMATTER.format(parsed);
}

function normalizeSearchValue(value) {
  return (value || '').toLowerCase().trim();
}

function filterArticles(articles, { query, topic, codeOnly }) {
  const normalizedQuery = normalizeSearchValue(query);

  return articles
    .map((article) => {
      const tagText = (article.tags || []).join(' ');
      const searchSpace = normalizeSearchValue([
        article.title,
        article.excerpt,
        article.summary,
        article.topicLabel,
        tagText
      ].join(' '));

      const matchesTopic = topic === 'all' || article.topic === topic;
      const matchesCode = !codeOnly || article.codeCount > 0;
      const matchesQuery = !normalizedQuery || searchSpace.includes(normalizedQuery);

      if (!matchesTopic || !matchesCode || !matchesQuery) {
        return null;
      }

      let score = article.sentenceCount;

      if (normalizedQuery) {
        if (normalizeSearchValue(article.title).startsWith(normalizedQuery)) score += 1200;
        if (normalizeSearchValue(article.title).includes(normalizedQuery)) score += 800;
        if (normalizeSearchValue(tagText).includes(normalizedQuery)) score += 320;
        if (normalizeSearchValue(article.excerpt).includes(normalizedQuery)) score += 180;
      }

      if (article.codeCount > 0) score += 30;
      if (article.topic === topic) score += 120;

      return {
        article,
        score
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.article.articleId - right.article.articleId;
    })
    .map(result => result.article);
}

function getRelatedArticles(article, articles, limit = 3) {
  if (!article) return [];

  const articleTags = new Set(article.tags || []);

  return articles
    .filter(candidate => candidate.articleId !== article.articleId)
    .map((candidate) => {
      const sharedTagCount = (candidate.tags || []).filter(tag => articleTags.has(tag)).length;
      const sameTopicScore = candidate.topic === article.topic ? 3 : 0;
      const codeAffinity = candidate.codeCount > 0 && article.codeCount > 0 ? 1 : 0;
      const recencyAffinity = Math.max(0, 2 - Math.abs(candidate.articleId - article.articleId) * 0.08);

      return {
        article: candidate,
        score: sharedTagCount * 5 + sameTopicScore + codeAffinity + recencyAffinity
      };
    })
    .sort((left, right) => right.score - left.score || left.article.articleId - right.article.articleId)
    .slice(0, limit)
    .map(result => result.article);
}

function getJumpPoints(article, currentSentenceIndex, targetCount = 5) {
  if (!article) return [];

  const textSentences = article.sentences
    .map((sentence, index) => ({
      index,
      text: sentence.fullSentence,
      type: sentence.type || 'text'
    }))
    .filter(sentence => sentence.type === 'text' && sentence.text);

  if (textSentences.length === 0) {
    return [];
  }

  const sampleIndexes = new Set();
  const maxIndex = textSentences.length - 1;

  for (let index = 0; index < Math.min(targetCount, textSentences.length); index += 1) {
    sampleIndexes.add(Math.round((index * maxIndex) / Math.max(Math.min(targetCount, textSentences.length) - 1, 1)));
  }

  const currentTextIndex = textSentences.findIndex(sentence => sentence.index === currentSentenceIndex);

  if (currentTextIndex >= 0) {
    sampleIndexes.add(currentTextIndex);
  }

  return [...sampleIndexes]
    .sort((left, right) => left - right)
    .slice(0, targetCount + 1)
    .map(sampleIndex => textSentences[sampleIndex])
    .filter(Boolean)
    .map(sentence => ({
      sentenceIndex: sentence.index,
      label: truncateLabel(sentence.text, 34),
      isSelected: sentence.index === currentSentenceIndex
    }));
}

function findArticleByParam(universe, articleParam) {
  if (!universe || !articleParam) return null;

  return universe.articles.find(article => {
    return article.id === articleParam
      || article.slug === articleParam
      || String(article.articleId) === articleParam;
  }) || null;
}

function getReadingTimeLabel(article) {
  const minutes = article?.readingTime || estimateReadingTime(article?.sentences);
  return `${minutes} min read`;
}

export default function App() {
  const [contextData, setContextData] = useState(null);
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [contextSentences, setContextSentences] = useState([]);
  const [focusedArticle, setFocusedArticle] = useState(null);
  const [overlayMetrics, setOverlayMetrics] = useState(() => getOverlayMetrics());
  const [universeSeed] = useState(() => readUniverseSeed());
  const [showGuide, setShowGuide] = useState(() => !readGuideDismissed());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [codeOnly, setCodeOnly] = useState(false);
  const [flightTargetArticleId, setFlightTargetArticleId] = useState(null);
  const hasHydratedUrlRef = useRef(false);
  const searchInputRef = useRef(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

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

  useEffect(() => {
    if (!isSearchOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen || typeof window === 'undefined') {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isSearchOpen]);

  const universe = useMemo(() => {
    if (!contextData) return null;
    return buildUniverseModel(contextData, universeSeed);
  }, [contextData, universeSeed]);

  const selectedArticle = selectedSentence && universe
    ? universe.articleById[selectedSentence.articleId]
    : null;
  const activeArticle = selectedArticle || focusedArticle || null;
  const hasActiveArticle = !!activeArticle;

  const handleDismissGuide = () => {
    persistGuideDismissed();
    setShowGuide(false);
  };

  const handleSelectSentence = (sentenceData) => {
    if (!universe) return;

    const article = universe.articleById[sentenceData.articleId];

    setSelectedSentence(sentenceData);
    setContextSentences(getContextWindow(article, sentenceData.sentenceIndex, 7));
    handleDismissGuide();
  };

  const clearSelection = () => {
    setSelectedSentence(null);
    setContextSentences([]);
    setFocusedArticle(null);
  };

  const handleBack = () => {
    clearSelection();
  };

  const handleOpenArticle = (article, forcedSentenceIndex = null) => {
    if (!article) return;

    const fallbackSentenceIndex = Math.max(
      0,
      article.sentences.findIndex(sentence => (sentence.type || 'text') === 'text')
    );
    const nextSentenceIndex = Number.isInteger(forcedSentenceIndex)
      ? forcedSentenceIndex
      : fallbackSentenceIndex;

    setSelectedSentence({
      articleId: article.articleId,
      sentenceIndex: nextSentenceIndex
    });
    setContextSentences(getContextWindow(article, nextSentenceIndex, 7));
    setFlightTargetArticleId(null);
    setIsSearchOpen(false);
    handleDismissGuide();
  };

  const handleOpenSearchPreset = ({
    query = '',
    topic = 'all',
    code = false,
    closeDetail = false
  }) => {
    if (closeDetail) {
      clearSelection();
    }

    setSearchQuery(query);
    setSelectedTopic(topic);
    setCodeOnly(code);
    setIsSearchOpen(true);
    handleDismissGuide();
  };

  useEffect(() => {
    if (!universe || hasHydratedUrlRef.current || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get('topic');
    const queryParam = params.get('q');
    const articleParam = params.get('article');
    const sentenceParam = Number(params.get('sentence'));

    if (topicParam && (topicParam === 'all' || universe.topicSummary.some(topic => topic.topic === topicParam))) {
      setSelectedTopic(topicParam);
    }

    if (queryParam) {
      setSearchQuery(queryParam);
      setIsSearchOpen(true);
    }

    if (params.get('code') === '1') {
      setCodeOnly(true);
      setIsSearchOpen(true);
    }

    const article = findArticleByParam(universe, articleParam);

    if (article) {
      handleOpenArticle(article, Number.isFinite(sentenceParam) ? sentenceParam : null);
    }

    hasHydratedUrlRef.current = true;
  }, [universe]);

  useEffect(() => {
    if (!universe || !hasHydratedUrlRef.current || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams();
    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery) {
      params.set('q', normalizedQuery);
    }

    if (selectedTopic !== 'all') {
      params.set('topic', selectedTopic);
    }

    if (codeOnly) {
      params.set('code', '1');
    }

    params.set('seed', String(universeSeed));

    if (selectedArticle) {
      params.set('article', selectedArticle.id);

      if (selectedSentence) {
        params.set('sentence', String(selectedSentence.sentenceIndex));
      }
    }

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [
    universe,
    universeSeed,
    searchQuery,
    selectedTopic,
    codeOnly,
    selectedArticle,
    selectedSentence
  ]);

  const topicOptions = universe?.topicSummary || [];
  const filteredArticles = useMemo(() => {
    if (!universe) return [];

    return filterArticles(universe.articles, {
      query: deferredSearchQuery,
      topic: selectedTopic,
      codeOnly
    });
  }, [universe, deferredSearchQuery, selectedTopic, codeOnly]);

  const searchResults = filteredArticles.slice(0, 6);
  const hasSearchFilters = searchQuery.trim().length > 0 || selectedTopic !== 'all' || codeOnly;
  const filteredFragmentCount = filteredArticles.reduce(
    (total, article) => total + article.sentenceCount,
    0
  );
  const topTags = useMemo(() => {
    if (!universe) return [];

    const counts = new Map();

    universe.articles.forEach((article) => {
      (article.tags || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ko'))
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));
  }, [universe]);
  const relatedArticles = useMemo(() => {
    if (!selectedArticle || !universe) return [];
    return getRelatedArticles(selectedArticle, universe.articles);
  }, [selectedArticle, universe]);
  const jumpPoints = useMemo(() => {
    if (!selectedArticle || !selectedSentence) return [];
    return getJumpPoints(selectedArticle, selectedSentence.sentenceIndex);
  }, [selectedArticle, selectedSentence]);
  const visibleArticleIds = useMemo(() => {
    if (!hasSearchFilters) {
      return null;
    }

    const nextIds = new Set(filteredArticles.map(article => article.articleId));

    if (selectedArticle) {
      nextIds.add(selectedArticle.articleId);
    }

    if (focusedArticle) {
      nextIds.add(focusedArticle.articleId);
    }

    return [...nextIds];
  }, [filteredArticles, focusedArticle, hasSearchFilters, selectedArticle]);

  if (!universe) {
    return <div className="app-shell" aria-hidden="true" />;
  }

  const overlayStyle = {
    '--overlay-scale': overlayMetrics.scale,
    '--overlay-frame-width': `${overlayMetrics.frameWidth}px`,
    '--overlay-frame-height': `${overlayMetrics.frameHeight}px`
  };
  const isMobileViewport = overlayMetrics.frameWidth === 430;
  const hudTopic = activeArticle
    ? activeArticle.topicLabel
    : selectedTopic !== 'all'
      ? topicOptions.find(topic => topic.topic === selectedTopic)?.label || 'Filtered Orbit'
      : 'Free Flight';
  const hudArticleTitle = activeArticle?.title || '자유 항해 중';
  const visibleArticleCount = hasSearchFilters ? filteredArticles.length : universe.stats.articleCount;
  const visibleFragmentCount = hasSearchFilters ? filteredFragmentCount : universe.stats.fragmentCount;
  const selectedArticlePublishedLabel = formatPublishedDate(selectedArticle?.publishedAt);
  const searchResultCountLabel = hasSearchFilters
    ? `${filteredArticles.length}개 별자리 일치`
    : `${universe.stats.articleCount}개 전체 별자리`;
  const isFlightActive = flightTargetArticleId != null;
  const canOpenActiveArticle = hasActiveArticle && !selectedSentence && !isFlightActive;

  const handleToggleSearch = () => {
    handleDismissGuide();
    setIsSearchOpen(current => !current);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (searchResults.length > 0) {
      handleTravelToArticle(searchResults[0]);
    }
  };

  const handleTravelToArticle = (article) => {
    if (!article) return;

    setFlightTargetArticleId(article.articleId);
    setFocusedArticle(article);
    setIsSearchOpen(false);
    handleDismissGuide();
  };

  const handleFlightComplete = (articleId) => {
    setFlightTargetArticleId((current) => {
      if (current !== articleId) {
        return current;
      }

      return null;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTopic('all');
    setCodeOnly(false);
  };
  const handleApplyTag = (tag, { closeDetail = false } = {}) => {
    handleOpenSearchPreset({
      query: tag,
      topic: 'all',
      code: false,
      closeDetail
    });
  };
  const handleApplyTopic = (topic, { closeDetail = false, code = false } = {}) => {
    handleOpenSearchPreset({
      query: '',
      topic,
      code,
      closeDetail
    });
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
              visibleArticleIds={visibleArticleIds}
              flightTargetArticleId={flightTargetArticleId}
              onFlightComplete={handleFlightComplete}
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

          <div className="atlas-hud atlas-hud-left" aria-hidden="true">
            <span className="atlas-hud-label">Current Vector</span>
            <strong>{truncateLabel(hudArticleTitle, 48)}</strong>
            <p>{hudTopic}</p>
          </div>

          <div className="atlas-hud atlas-hud-right" aria-hidden="true">
            <span>{visibleArticleCount} constellations</span>
            <span>{visibleFragmentCount} fragments</span>
            <span>{isFlightActive ? 'approaching orbit' : hasSearchFilters ? 'filtered orbit' : 'full atlas'}</span>
          </div>

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
                검색으로 원하는 글의 궤도에 바로 진입하고, 열린 글 안에서 문맥을 따라 더 깊게 이동할 수 있습니다.
              </p>

              <div className="hero-hints">
                <span>제목, 주제, 태그 검색으로 원하는 글부터 여세요</span>
                <span>문장을 누르면 같은 글의 문맥이 열립니다</span>
              </div>

              <div className="hero-actions">
                <button
                  type="button"
                  className={`hero-cta hero-cta-search ${isSearchOpen ? 'is-active' : ''}`}
                  onClick={handleToggleSearch}
                >
                  {isSearchOpen ? '검색 닫기' : '검색 열기'}
                </button>
              </div>
            </div>

            {showGuide && !isMobileViewport && (
              <aside className="guide-card">
                <div className="guide-copy">
                  <span className="guide-kicker">First Orbit</span>
                  <p>
                    검색을 열어 제목, 주제, 태그로 먼저 진입한 뒤
                    열린 글 안에서 문장과 관련 글을 따라 이동하면 됩니다.
                  </p>
                </div>
                <button type="button" className="guide-dismiss" onClick={handleDismissGuide}>
                  안내 닫기
                </button>
              </aside>
            )}

            <section className={`search-panel ${isSearchOpen ? 'is-open' : ''}`}>
              <div className="search-panel-header">
                <div>
                  <span className="search-kicker">Atlas Search</span>
                  <h3>원하는 글의 궤도로 바로 이동하기</h3>
                </div>
                <button type="button" className="search-close" onClick={() => setIsSearchOpen(false)}>
                  닫기
                </button>
              </div>

              <form className="search-form" onSubmit={handleSearchSubmit}>
                <label className="search-field">
                  <span className="sr-only">글 검색</span>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    placeholder="글 제목, 주제, 태그로 탐색"
                  />
                </label>

                <div className="search-controls">
                  <label className="select-field">
                    <span className="sr-only">주제 필터</span>
                    <select
                      value={selectedTopic}
                      onChange={event => setSelectedTopic(event.target.value)}
                    >
                      <option value="all">모든 주제</option>
                      {topicOptions.map((topic) => (
                        <option key={topic.topic} value={topic.topic}>
                          {topic.shortLabel}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={codeOnly}
                      onChange={event => setCodeOnly(event.target.checked)}
                    />
                    <span>코드 포함 글만</span>
                  </label>

                  <button type="submit" className="search-submit" disabled={searchResults.length === 0}>
                    첫 결과로 이동
                  </button>

                  {hasSearchFilters && (
                    <button type="button" className="search-reset" onClick={handleResetFilters}>
                      초기화
                    </button>
                  )}
                </div>
              </form>

              <div className="search-stats">
                <span>{searchResultCountLabel}</span>
                <span>{hasSearchFilters ? `${filteredFragmentCount} fragments in view` : 'entire archive ready'}</span>
              </div>

              {topTags.length > 0 && (
                <div className="tag-rail">
                  {topTags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-chip ${searchQuery.trim() === tag ? 'is-active' : ''}`}
                      onClick={() => handleApplyTag(tag)}
                    >
                      <span>#{tag}</span>
                      <small>{count}</small>
                    </button>
                  ))}
                </div>
              )}

              <div className="search-results">
                {searchResults.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    className="search-result"
                    onClick={() => handleTravelToArticle(article)}
                  >
                    <div className="search-result-header">
                      <span className="search-result-topic">{article.topicShortLabel}</span>
                      <span className="search-result-meta">{getReadingTimeLabel(article)}</span>
                    </div>
                    <strong>{article.title}</strong>
                    <p>{article.excerpt}</p>
                  </button>
                ))}

                {searchResults.length === 0 && (
                  <div className="search-empty">
                    현재 조건과 맞는 별자리가 없습니다. 검색어나 필터를 조금 풀어보세요.
                  </div>
                )}
              </div>
            </section>

          </section>

          <section
            className={`focus-panel ${canOpenActiveArticle ? 'is-interactive' : hasActiveArticle ? 'is-tracking' : 'is-empty'}`}
            style={{ '--focus-color': activeArticle?.color || '#83d8ff' }}
            onClick={canOpenActiveArticle ? () => handleOpenArticle(activeArticle) : undefined}
            onKeyDown={(event) => {
              if (!canOpenActiveArticle) return;

              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleOpenArticle(activeArticle);
              }
            }}
            role={canOpenActiveArticle ? 'button' : undefined}
            tabIndex={canOpenActiveArticle ? 0 : -1}
            aria-hidden={!hasActiveArticle}
            aria-label={canOpenActiveArticle ? `${activeArticle.title} 열기` : undefined}
          >
            {hasActiveArticle && (
              <>
                <div className="focus-header">
                  <span className="focus-label">{isFlightActive ? 'Approaching Constellation' : 'Current Constellation'}</span>
                  <span className="focus-sector">{activeArticle.topicLabel}</span>
                </div>
                <h2>{activeArticle.title}</h2>
                <p>{activeArticle.excerpt}</p>
                <div className="focus-meta">
                  <span>{getReadingTimeLabel(activeArticle)}</span>
                  <span>{activeArticle.sentenceCount} fragments</span>
                  <span>{activeArticle.codeCount} code blocks</span>
                </div>
              </>
            )}
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
                <button
                  type="button"
                  className="detail-sector detail-sector-button"
                  onClick={() => handleApplyTopic(selectedArticle.topic, { closeDetail: true })}
                >
                  {selectedArticle.topicLabel}
                </button>
                <h2>{selectedArticle.title}</h2>
                <p className="detail-excerpt">{selectedArticle.excerpt}</p>

                <div className="detail-meta">
                  {selectedArticlePublishedLabel && <span>{selectedArticlePublishedLabel}</span>}
                  <span>{getReadingTimeLabel(selectedArticle)}</span>
                  <span>{selectedArticle.sentenceCount} fragments</span>
                  <span>{selectedArticle.codeCount} code blocks</span>
                  <span>{`Archive #${selectedArticle.articleId + 1}`}</span>
                </div>

                {selectedArticle.tags?.length > 0 && (
                  <div className="detail-tags">
                    {selectedArticle.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="detail-tag detail-tag-button"
                        onClick={() => handleApplyTag(tag, { closeDetail: true })}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {jumpPoints.length > 1 && (
                <section className="detail-section">
                  <div className="detail-section-header">
                    <span className="detail-section-label">Key Fragments</span>
                    <p>같은 글 안에서 다른 생각의 지점으로 바로 이동합니다.</p>
                  </div>
                  <div className="jump-points">
                    {jumpPoints.map((point) => (
                      <button
                        key={`${selectedArticle.id}-${point.sentenceIndex}`}
                        type="button"
                        className={`jump-point ${point.isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleOpenArticle(selectedArticle, point.sentenceIndex)}
                      >
                        {point.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

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

              {relatedArticles.length > 0 && (
                <section className="detail-section">
                  <div className="detail-section-header">
                    <span className="detail-section-label">Related Orbits</span>
                    <p>주제나 결이 가까운 다른 글로 이어서 이동합니다.</p>
                  </div>
                  <div className="related-grid">
                    {relatedArticles.map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        className="related-card"
                        onClick={() => handleOpenArticle(article)}
                      >
                        <span className="related-topic">{article.topicShortLabel}</span>
                        <strong>{article.title}</strong>
                        <p>{article.excerpt}</p>
                        <div className="related-meta">
                          <span>{getReadingTimeLabel(article)}</span>
                          <span>{article.sentenceCount} fragments</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

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
