import React, {
  Suspense,
  lazy,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildCatalog,
  clamp,
  filterCatalog,
  formatDate,
  TOPICS,
} from "./utils/observatory";
import {
  AudioToggle,
  Icon,
  Panel,
  SceneBoundary,
} from "./components/Interface";
import "./index.css";

const UniverseScene = lazy(() => import("./components/UniverseScene"));
const initialParams = new URLSearchParams(window.location.search);
function useMedia(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export default function App() {
  const [articles, setArticles] = useState([]);
  const [dataState, setDataState] = useState("loading");
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cruising, setCruising] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [panel, setPanel] = useState(
    initialParams.has("q") ||
      initialParams.has("topic") ||
      initialParams.has("code")
      ? "archive"
      : null,
  );
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState(initialParams.get("q") || "");
  const [topic, setTopic] = useState(
    TOPICS[initialParams.get("topic")] ? initialParams.get("topic") : "all",
  );
  const [codeOnly, setCodeOnly] = useState(initialParams.get("code") === "1");
  const compact = useMedia("(max-width: 760px)");
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const paused = motionPaused || reducedMotion || !!panel;
  const sceneRef = useRef();
  const searchRef = useRef();
  const hydrated = useRef(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;
    import("./data/velog-context.json")
      .then((module) => {
        if (active) {
          setArticles(buildCatalog(module.default));
          setDataState("ready");
        }
      })
      .catch(() => {
        if (active) setDataState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const selectArticle = useCallback((article) => {
    setSelected(article);
    setPanel("article");
    setCruising(false);
    setProgress((current) => Math.max(current, 0.35));
  }, []);
  const closePanel = useCallback(() => {
    setPanel(null);
    setSelected(null);
  }, []);
  const returnHome = useCallback(() => {
    setProgress(0);
    setCruising(false);
    setSelected(null);
    setPanel(null);
    setQuery("");
    setTopic("all");
    setCodeOnly(false);
  }, []);
  const beginJourney = useCallback(() => {
    setSelected(null);
    setPanel(null);
    if (reducedMotion || motionPaused) setProgress(0.65);
    else {
      setProgress((current) =>
        current >= 0.98 ? 0.2 : Math.max(current, 0.16),
      );
      setCruising(true);
    }
  }, [reducedMotion, motionPaused]);

  useEffect(() => {
    if (dataState !== "ready" || hydrated.current) return;
    hydrated.current = true;
    const id = initialParams.get("article");
    const article = articles.find(
      (item) => item.id === id || item.legacyId === id,
    );
    if (article) selectArticle(article);
  }, [articles, dataState, selectArticle]);
  useEffect(() => {
    if (!hydrated.current) return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (topic !== "all") params.set("topic", topic);
    if (codeOnly) params.set("code", "1");
    if (selected) params.set("article", selected.id);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
    );
    document.title = selected
      ? `${selected.title} · uiwwsw`
      : "uiwwsw — 기록이 별이 되는 우주";
  }, [query, topic, codeOnly, selected, dataState]);
  useEffect(() => {
    if (panel === "archive") searchRef.current?.focus();
  }, [panel]);
  useEffect(() => {
    if (!cruising || paused) return;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      if (now - last > 40) {
        const delta = Math.min(now - last, 100);
        setProgress((value) => clamp(value + delta / 42000));
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cruising, paused]);
  useEffect(() => {
    if (progress >= 1) setCruising(false);
  }, [progress]);
  useEffect(() => {
    function keydown(event) {
      const editing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName);
      if (!editing && event.key === "/" && !panel) {
        event.preventDefault();
        setPanel("archive");
        return;
      }
      if (panel || editing || event.altKey || event.ctrlKey || event.metaKey)
        return;
      if (
        ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home"].includes(
          event.key,
        )
      ) {
        event.preventDefault();
        setCruising(false);
        if (event.key === "Home") returnHome();
        else
          setProgress((value) =>
            clamp(
              value +
                (["ArrowUp", "PageDown"].includes(event.key) ? 0.08 : -0.08),
            ),
          );
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [panel, returnHome]);
  useEffect(() => {
    const element = sceneRef.current;
    let touchY = null;
    function wheel(event) {
      if (panel || event.ctrlKey || event.target.closest("button, a, input"))
        return;
      event.preventDefault();
      setCruising(false);
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 700 : 1);
      setProgress((value) => clamp(value + clamp(delta, -180, 180) * 0.00045));
    }
    function touchStart(event) {
      if (event.touches.length === 1) touchY = event.touches[0].clientY;
    }
    function touchMove(event) {
      if (
        panel ||
        touchY === null ||
        event.touches.length !== 1 ||
        event.target.closest("button")
      )
        return;
      const y = event.touches[0].clientY;
      setCruising(false);
      setProgress((value) => clamp(value + (touchY - y) * 0.002));
      touchY = y;
    }
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("touchstart", touchStart, { passive: true });
    element.addEventListener("touchmove", touchMove, { passive: true });
    return () => {
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("touchstart", touchStart);
      element.removeEventListener("touchmove", touchMove);
    };
  }, [panel]);

  const filtered = useMemo(
    () => filterCatalog(articles, deferredQuery, topic, codeOnly),
    [articles, deferredQuery, topic, codeOnly],
  );
  const highlighted = useMemo(
    () =>
      query || topic !== "all" || codeOnly
        ? new Set(filtered.map((a) => a.id))
        : null,
    [filtered, query, topic, codeOnly],
  );
  const ready = useCallback(() => setSceneReady(true), []);
  const fail = useCallback(() => setSceneError(true), []);
  const exploring = progress > 0.12 || !!selected;
  const latestEssay =
    articles.find((article) => article.topic === "essay") || articles[0];
  const phase =
    progress < 0.15
      ? "달의 고요 속에서"
      : progress < 0.68
        ? "별과 별 사이를 지나"
        : "조금 더 가까워진 이야기";

  return (
    <main
      className={`observatory ${exploring ? "is-exploring" : ""} ${sceneReady ? "scene-ready" : ""}`}
      ref={sceneRef}
    >
      <a
        className="skip-link"
        href="#archive"
        onClick={(event) => {
          event.preventDefault();
          setPanel("archive");
        }}
      >
        글 목록으로 바로가기
      </a>
      <div
        className="universe-canvas"
        aria-label="달에서 지구를 바라보는 3D 우주. 휠로 이동하고 별을 선택해 글을 읽을 수 있습니다."
      >
        {!sceneError && (
          <SceneBoundary onError={fail}>
            <Suspense fallback={null}>
              <UniverseScene
                articles={articles}
                progress={progress}
                selected={selected}
                highlighted={highlighted}
                onSelect={selectArticle}
                paused={paused}
                reducedMotion={reducedMotion}
                compact={compact}
                onReady={ready}
                onError={fail}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div className="scene-shade" aria-hidden="true" />
      <div className="screen-frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <header className="site-header">
        <button
          className="wordmark"
          onClick={returnHome}
          aria-label="uiwwsw, 달로 돌아가기"
        >
          <Icon name="star" size={27} />
          <span>
            uiwwsw<span className="wordmark-period">.</span>
          </span>
        </button>
        <nav aria-label="메인 메뉴">
          <button className={!panel ? "active" : ""} onClick={beginJourney}>
            우주 탐험
          </button>
          <button
            className={panel === "archive" ? "active" : ""}
            onClick={() => setPanel("archive")}
          >
            글 모아보기{" "}
            <span className="nav-count">{articles.length || "—"}</span>
          </button>
          <button onClick={() => setPanel("about")}>소개</button>
        </nav>
        <a
          className="github-link"
          href="https://github.com/uiwwsw"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <Icon name="external" size={16} />
        </a>
      </header>

      <div className="top-coordinate" aria-hidden="true">
        <span>PERSONAL UNIVERSE / VOL. 01</span>
        <span>EST. ON EARTH</span>
      </div>

      <section
        className="intro"
        aria-hidden={exploring}
        inert={exploring ? "" : undefined}
      >
        <p className="eyebrow intro-eyebrow">
          <span className="tiny-line" /> A LITTLE SPACE FOR MY THOUGHTS
        </p>
        <h1>
          기록은 별이 되고,
          <br />
          생각은 <span>우주가 된다.</span>
        </h1>
        <p className="intro-description">
          코드를 쓰고, 생각을 씁니다.
          <br />
          흘려보내고 싶지 않은 순간들을 이곳에 띄워 둡니다.
        </p>
        <button className="journey-button" onClick={beginJourney}>
          <span className="journey-icon">
            <Icon name="arrow" size={19} />
          </span>
          <span>
            나의 우주 유영하기<small>SCROLL TO EXPLORE</small>
          </span>
        </button>
        <div className="intro-caption">
          <span className="status-dot" />
          {dataState === "loading"
            ? "이야기를 불러오는 중"
            : `${articles.length}개의 기록, 저마다의 궤도`}
        </div>
      </section>

      {!exploring && (
        <div className="earth-note" aria-hidden="true">
          <span className="earth-note-line" />
          <div>
            <span className="eyebrow">OUR PALE BLUE DOT</span>
            <p>모든 이야기가 시작된 곳</p>
            <span className="earth-distance">EARTH · 384,400 KM FROM HOME</span>
          </div>
        </div>
      )}

      {exploring && !panel && (
        <section className="explore-heading">
          <p className="eyebrow">BETWEEN THE STARS</p>
          <h1>{phase}</h1>
          <p>별에 머물러 보세요. 하나의 이야기가 기다리고 있어요.</p>
          <div className="sky-filters" aria-label="별의 주제">
            <button
              onClick={() => setTopic("all")}
              aria-pressed={topic === "all"}
            >
              모든 별
            </button>
            {Object.entries(TOPICS).map(([id, item]) => (
              <button
                key={id}
                aria-pressed={topic === id}
                onClick={() => setTopic(id)}
              >
                <span style={{ background: item.color }} />
                {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {!exploring && latestEssay && (
        <button
          className="featured-signal"
          onClick={() => selectArticle(latestEssay)}
        >
          <span className="signal-orbit">
            <Icon name="star" size={18} />
          </span>
          <span>
            <small>마지막으로 띄운 생각</small>
            <strong>{latestEssay.title}</strong>
          </span>
          <Icon name="external" size={17} />
        </button>
      )}

      {(sceneError || dataState === "error") && (
        <div className="fallback-notice" role="status">
          <p>
            {dataState === "error"
              ? "글을 불러오지 못했어요. 벨로그에서 이야기를 만나보세요."
              : "이 환경에서는 3D 우주를 열 수 없어요. 글 목록에서 모든 이야기를 읽을 수 있습니다."}
          </p>
          {dataState === "error" ? (
            <a href="https://velog.io/@uiwwsw/posts">벨로그로 이동 ↗</a>
          ) : (
            <button onClick={() => setPanel("archive")}>글 목록 열기 ↗</button>
          )}
        </div>
      )}

      <aside className="journey-rail" aria-label="우주 여행 진행도">
        <span>01</span>
        <div className="rail-track">
          <span style={{ height: `${Math.max(4, progress * 100)}%` }} />
        </div>
        <span>03</span>
        <p>
          {progress < 0.15
            ? "LUNAR SURFACE"
            : progress < 0.68
              ? "DEEP SPACE"
              : "EARTH ORBIT"}
        </p>
      </aside>

      <footer className="flight-deck">
        <div className="location">
          <Icon name="moon" size={23} />
          <div>
            <span className="eyebrow">
              {progress < 0.15
                ? "THE MOON, A QUIET BEGINNING"
                : "SOMEWHERE IN MY UNIVERSE"}
            </span>
            <p>
              {phase}
              <span className="location-index">
                {" "}
                /{" "}
                {String(Math.min(3, Math.floor(progress * 3) + 1)).padStart(
                  2,
                  "0",
                )}
              </span>
            </p>
          </div>
        </div>
        <div className="flight-controls">
          <div className="flight-labels">
            <span>MOON</span>
            <span>{exploring ? "별을 따라 천천히" : "스크롤하여 지구로"}</span>
            <span>EARTH</span>
          </div>
          <div className="flight-slider">
            <span className="origin-dot" />
            <input
              aria-label="달에서 지구까지 이동"
              type="range"
              min="0"
              max="100"
              value={Math.round(progress * 100)}
              onChange={(event) => {
                setCruising(false);
                setProgress(Number(event.target.value) / 100);
              }}
            />
            <Icon name="star" size={13} />
          </div>
        </div>
        <div className="deck-actions">
          <AudioToggle />
          <button
            className="icon-button"
            onClick={() => {
              setMotionPaused((value) => !value);
              setCruising(false);
            }}
            aria-pressed={motionPaused || reducedMotion}
            aria-label={motionPaused ? "움직임 재생" : "움직임 줄이기"}
            disabled={reducedMotion}
            title={
              reducedMotion
                ? "시스템의 동작 줄이기 설정 적용 중"
                : "움직임 켜기 / 끄기"
            }
          >
            <Icon
              name={motionPaused || reducedMotion ? "play" : "pause"}
              size={17}
            />
          </button>
          {exploring && (
            <button
              className="icon-button"
              onClick={returnHome}
              aria-label="달로 돌아가기"
              title="달로 돌아가기"
            >
              <Icon name="moon" size={17} />
            </button>
          )}
        </div>
      </footer>
      <div className="bottom-credit">
        <span>© {new Date().getFullYear()} UIWWSW</span>
        <span>
          {!sceneReady && !sceneError
            ? "PREPARING THE UNIVERSE…"
            : "MADE OF THOUGHTS & STARDUST"}
        </span>
        <span>
          {exploring ? "DRAG TO LOOK AROUND" : "TAKE YOUR TIME. STAY A LITTLE."}
        </span>
      </div>

      {panel === "archive" && (
        <Panel
          name="archive"
          title="저마다 빛나는 이야기"
          onClose={closePanel}
          className="archive-panel"
        >
          <p className="panel-description">
            하나의 글, 하나의 별. 마음이 닿는 이야기부터 읽어 보세요.
          </p>
          <div className="archive-search">
            <Icon name="search" />
            <input
              ref={searchRef}
              placeholder="어떤 생각을 찾고 있나요?"
              aria-label="글 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                className="icon-button"
                onClick={() => setQuery("")}
                aria-label="검색어 지우기"
              >
                <Icon name="close" size={16} />
              </button>
            )}
            <kbd>/</kbd>
          </div>
          <div className="archive-topics">
            <button
              aria-pressed={topic === "all"}
              onClick={() => setTopic("all")}
            >
              모든 글 <span>{articles.length}</span>
            </button>
            {Object.entries(TOPICS).map(([id, item]) => (
              <button
                key={id}
                onClick={() => setTopic(id)}
                aria-pressed={topic === id}
              >
                <i style={{ background: item.color }} />
                {item.label}
              </button>
            ))}
          </div>
          <div className="archive-meta">
            <span>{filtered.length}개의 별을 찾았어요</span>
            <label>
              <input
                type="checkbox"
                checked={codeOnly}
                onChange={(event) => setCodeOnly(event.target.checked)}
              />
              코드가 있는 글
            </label>
          </div>
          <div className="article-list">
            {filtered.map((article, index) => (
              <button
                className="article-row"
                key={article.id}
                onClick={() => selectArticle(article)}
              >
                <span className="article-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="article-row-content">
                  <small style={{ color: article.color }}>
                    {TOPICS[article.topic].label}{" "}
                    <span>· {formatDate(article.publishedAt)}</span>
                  </small>
                  <strong>{article.title}</strong>
                  <p>{article.summary}</p>
                </span>
                <Icon name="external" />
              </button>
            ))}
            {dataState === "loading" && (
              <p className="empty-state" role="status">
                이야기를 불러오는 중입니다.
              </p>
            )}
            {dataState === "error" && (
              <p className="empty-state">
                글을 불러오지 못했어요.{" "}
                <a href="https://velog.io/@uiwwsw/posts">벨로그에서 읽기 ↗</a>
              </p>
            )}
            {dataState === "ready" && filtered.length === 0 && (
              <div className="empty-state">
                <Icon name="star" size={32} />
                <p>아직 이 이름의 별은 없네요.</p>
                <button
                  onClick={() => {
                    setQuery("");
                    setTopic("all");
                    setCodeOnly(false);
                  }}
                >
                  모든 이야기 보기
                </button>
              </div>
            )}
          </div>
        </Panel>
      )}

      {panel === "article" && selected && (
        <Panel
          key={selected.id}
          name="article"
          title={selected.title}
          onClose={closePanel}
          className="reading-panel"
        >
          <div className="reading-meta">
            <span style={{ color: selected.color }}>
              {TOPICS[selected.topic].label}
            </span>
            <span>{formatDate(selected.publishedAt)}</span>
            <span>{selected.readingTime}분 읽기</span>
          </div>
          <div className="reading-actions">
            <a href={selected.link} target="_blank" rel="noreferrer">
              벨로그에서 읽기 <Icon name="external" size={15} />
            </a>
            <button
              onClick={() => {
                setSelected(null);
                setPanel("archive");
              }}
            >
              <Icon name="list" size={15} />
              모든 글
            </button>
          </div>
          <p className="reading-source-note">
            원문의 이미지와 서식은 벨로그에서 볼 수 있어요.
          </p>
          <div className="reading-body">
            {selected.sentences
              .filter((sentence) => sentence.type !== "image")
              .map((sentence, index) =>
                sentence.type === "code" ? (
                  <div className="code-block" key={index}>
                    <span>{sentence.language || "code"}</span>
                    <pre>
                      <code>{sentence.fullSentence}</code>
                    </pre>
                  </div>
                ) : (
                  <p key={index}>{sentence.fullSentence}</p>
                ),
              )}
          </div>
          <div className="reading-end">
            <Icon name="star" size={24} />
            <p>잠시, 같은 별을 바라봐 주셔서 고마워요.</p>
            <button onClick={closePanel}>
              다시 우주로 <Icon name="arrow" size={16} />
            </button>
          </div>
        </Panel>
      )}

      {panel === "about" && (
        <Panel
          name="about"
          title={
            <>
              안녕하세요,
              <br />
              글을 쓰는 개발자 uiwwsw입니다.
            </>
          }
          onClose={closePanel}
          className="about-panel"
        >
          <div className="about-star">
            <Icon name="star" size={48} />
          </div>
          <p className="about-lead">
            만드는 일과, 생각을 남기는 일을 좋아합니다.
          </p>
          <p>
            코드를 쓰며 배운 것들, 무언가를 만들어 가는 과정, 그리고 일상에서
            마주친 마음들을 기록합니다. 그렇게 쌓인 글들이 이 작은 우주의 별이
            되었습니다.
          </p>
          <p>
            빠르게 지나가지 않아도 괜찮아요.
            <br />
            어떤 별에는 조금 더 오래 머물러 주세요.
          </p>
          <div className="about-links">
            <a
              href="https://velog.io/@uiwwsw/posts"
              target="_blank"
              rel="noreferrer"
            >
              Velog <Icon name="external" />
            </a>
            <a
              href="https://github.com/uiwwsw"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <Icon name="external" />
            </a>
          </div>
          <details className="credits">
            <summary>이 우주에 도움을 준 것들</summary>
            <p>
              Three.js · React Three Fiber
              <br />
              지구:{" "}
              <a
                href="https://threejs.org/examples/webgpu_tsl_earth.html"
                target="_blank"
                rel="noreferrer"
              >
                Three.js Earth
              </a>{" "}
              예제의 셰이딩을 참고했습니다.
              <br />
              지구 텍스처:{" "}
              <a
                href="https://www.solarsystemscope.com/textures/"
                target="_blank"
                rel="noreferrer"
              >
                Solar System Scope
              </a>{" "}
              (CC BY 4.0).
              <br />달 텍스처: Three.js 예제 에셋. 장면의 거리와 별의 위치는
              글을 탐험하기 위한 예술적 구성입니다.
            </p>
          </details>
        </Panel>
      )}
    </main>
  );
}
