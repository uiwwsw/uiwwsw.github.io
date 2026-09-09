import React, {
  Suspense,
  lazy,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { clamp, filterCatalog, formatDate, TOPICS } from "./utils/observatory";
import {
  AudioToggle,
  Icon,
  Panel,
  SceneBoundary,
} from "./components/Interface";
import "./index.css";
import { createFlightInput, centerFlightInput } from "./utils/flightInput.js";
import { useFlightInput } from "./hooks/useFlightInput.js";
import { useFlightMotion } from "./hooks/useFlightMotion.js";
import SecretSignal from "./components/SecretSignal";
import { signalStrength, earthFocusBlend } from "./utils/secretSignal.js";
import { HOME_SECTOR, groupSectors } from "./utils/skyRegistry.js";
import { useArticleContent } from "./hooks/useArticleContent.js";
import ArticleBody from "./components/ArticleBody.jsx";
import OpeningSky from "./components/OpeningSky.jsx";
import FlightGuide from "./components/FlightGuide.jsx";
import { shouldShowFlightGuide } from "./utils/flightGuide.js";
import { arrangeVisitStars } from "./utils/visitSky.js";
import { articlePath, updatePageSeo } from "./utils/seo.js";

const UniverseScene = lazy(() => import("./components/UniverseScene"));
const initialParams = new URLSearchParams(
  typeof window === "undefined" ? "" : window.location.search,
);
const plainNavigation = (event) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;
function useMedia(query) {
  const subscribe = useCallback(
    (update) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export default function App({ initialHome, visitSeed = 0 } = {}) {
  const [articles, setArticles] = useState([]);
  const [sectors, setSectors] = useState([HOME_SECTOR]);
  const [sectorId, setSectorId] = useState("home");
  const [year, setYear] = useState("all");
  const [page, setPage] = useState(0);
  const [nearby, setNearby] = useState([]);
  const [diagnosticsStats, setDiagnosticsStats] = useState("");
  const [ambientStats, setAmbientStats] = useState("");
  const [pageHidden, setPageHidden] = useState(false);
  const [dataState, setDataState] = useState("loading");
  const [clientReady, setClientReady] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneSettled, setSceneSettled] = useState(false);
  const [assembled, setAssembled] = useState(false);
  const [guideRequested, setGuideRequested] = useState(true);
  const [guidePointer, setGuidePointer] = useState(null);
  const [sceneError, setSceneError] = useState(
    import.meta.env.DEV && initialParams.get("webgl") === "off",
  );
  const [cruising, setCruising] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [panel, setPanel] = useState(null);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [codeOnly, setCodeOnly] = useState(false);
  const compact = useMedia("(max-width: 760px)");
  const coarsePointer = useMedia("(pointer: coarse)");
  const touchControls = guidePointer ? guidePointer === "touch" : coarsePointer;
  const reducedMotion =
    useMedia("(prefers-reduced-motion: reduce)") ||
    (import.meta.env.DEV && initialParams.get("motion") === "reduce");
  const paused = motionPaused || reducedMotion || !!panel || pageHidden;
  const {
    distance,
    setDistance,
    travel,
    stop: stopTravel,
  } = useFlightMotion({
    enabled: !panel && !pageHidden,
    reducedMotion: reducedMotion || motionPaused,
    allowSignal: sectorId === "home",
  });
  const progress = clamp(distance);
  const signal = sectorId === "home" ? signalStrength(distance) : 0;
  const earthFocus = sceneError ? 0 : earthFocusBlend(signal);
  const focusingEarth = earthFocus > 0.05;
  const guideVisible = shouldShowFlightGuide({
    requested: guideRequested,
    ready: sceneReady,
    assembled,
    sceneError: sceneError || dataState === "error",
    panel,
    pageHidden,
    focusingEarth: signal > 0,
  });
  useEffect(() => {
    const update = () => setPageHidden(document.hidden);
    update();
    setClientReady(true);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const sceneRef = useRef();
  const inputRef = useRef(createFlightInput());
  const searchRef = useRef();
  const hydrated = useRef(false);
  const deferredQuery = useDeferredValue(query);
  const reading = useArticleContent(selected);
  const archiveListRef = useRef();
  const sectorGroups = useMemo(
    () => groupSectors(articles, sectors),
    [articles, sectors],
  );
  const sector = sectorGroups.find((item) => item.id === sectorId) ||
    sectorGroups[0] || { ...HOME_SECTOR, articles: [] };
  const years = useMemo(
    () =>
      [
        ...new Set(
          articles
            .map((article) => article.publishedAt?.slice(0, 4))
            .filter(Boolean),
        ),
      ]
        .sort()
        .reverse(),
    [articles],
  );

  useEffect(() => {
    let active = true;
    import("./data/velog-index.json")
      .then(async (module) => {
        let index = module.default;
        if (
          import.meta.env.DEV &&
          [300, 1000, 3000].includes(Number(initialParams.get("stress")))
        )
          index = (await import("./utils/stressCatalog.js")).makeStressCatalog(
            index,
            Number(initialParams.get("stress")),
          );
        if (active) {
          setArticles(
            arrangeVisitStars(index.articles, index.sectors, visitSeed),
          );
          setSectors(index.sectors);
          if (
            !index.sectors.some(
              (item) => item.id === initialParams.get("sector"),
            )
          )
            setSectorId("home");
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
    setGuideRequested(false);
    setSectorId(article.sectorId || "home");
    setNearby([]);
    setSelected(article);
    setPanel("article");
    setCruising(false);
    setDistance((current) => clamp(current, 0.35, 1));
  }, []);
  const followArticle = (event, article) => {
    if (!plainNavigation(event)) return;
    const loadedArticle = articles.find((item) => item.id === article.id);
    // Before catalog loading completes, keep the prerendered real href usable.
    if (!loadedArticle?.bodyUrl) return;
    event.preventDefault();
    selectArticle(loadedArticle);
  };
  const closePanel = useCallback(() => {
    setPanel(null);
    setSelected(null);
  }, []);
  const returnHome = useCallback(() => {
    setSectorId("home");
    setYear("all");
    centerFlightInput(inputRef.current);
    setDistance(0);
    setCruising(false);
    setSelected(null);
    setPanel(null);
    setQuery("");
    setTopic("all");
    setCodeOnly(false);
  }, []);
  const beginJourney = useCallback(() => {
    setGuideRequested(false);
    setSectorId("home");
    centerFlightInput(inputRef.current);
    setSelected(null);
    setPanel(null);
    if (reducedMotion || motionPaused) setDistance(0.65);
    else {
      setDistance((current) =>
        current >= 0.98 ? 0.2 : Math.max(current, 0.16),
      );
      setCruising(true);
    }
  }, [reducedMotion, motionPaused]);
  const visitSector = useCallback((id) => {
    setGuideRequested(false);
    centerFlightInput(inputRef.current);
    setSectorId(id);
    setDistance(0.25);
    setCruising(false);
    setSelected(null);
    setTopic("all");
    setQuery("");
    setCodeOnly(false);
    setYear("all");
    setPanel(null);
  }, []);
  const showNearby = useCallback((items) => {
    setGuideRequested(false);
    setNearby(items);
    setPanel("nearby");
    setCruising(false);
  }, []);
  const enterCloud = useCallback((id) => {
    setGuideRequested(false);
    setTopic(id);
    setDistance(0.65);
    setCruising(false);
  }, []);

  useEffect(() => {
    if (dataState !== "ready" || hydrated.current) return;
    hydrated.current = true;
    if (initialParams.has("q")) setQuery(initialParams.get("q"));
    if (initialParams.has("topic"))
      setTopic(
        TOPICS[initialParams.get("topic")] ? initialParams.get("topic") : "all",
      );
    if (initialParams.has("year")) setYear(initialParams.get("year") || "all");
    if (initialParams.has("code"))
      setCodeOnly(initialParams.get("code") === "1");
    if (sectors.some((item) => item.id === initialParams.get("sector")))
      setSectorId(initialParams.get("sector"));
    if (["q", "topic", "year", "code"].some((key) => initialParams.has(key)))
      setPanel("archive");
    const id = initialParams.get("article");
    const article = articles.find(
      (item) => item.id === id || item.legacyId === id,
    );
    if (article) selectArticle(article);
    setLocationReady(true);
  }, [articles, sectors, dataState, selectArticle]);
  useEffect(() => {
    if (!locationReady) return;
    const params = new URLSearchParams();
    if (import.meta.env.DEV)
      for (const key of ["stress", "webgl", "motion", "ambient"])
        if (initialParams.has(key)) params.set(key, initialParams.get(key));
    if (query) params.set("q", query);
    if (topic !== "all") params.set("topic", topic);
    if (codeOnly) params.set("code", "1");
    if (year !== "all") params.set("year", year);
    if (sectorId !== "home") params.set("sector", sectorId);
    if (selected) params.set("article", selected.id);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
    );
    updatePageSeo(selected);
  }, [
    query,
    topic,
    codeOnly,
    selected,
    dataState,
    year,
    sectorId,
    locationReady,
  ]);
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
        setDistance((value) => clamp(value + delta / 42000));
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
  const manualInput = useCallback(() => {
    inputRef.current.interacted = true;
    setGuideRequested(false);
    setCruising(false);
  }, []);
  const leaveSignal = useCallback(() => {
    setDistance(0.9);
    setCruising(false);
    sceneRef.current?.querySelector('input[type="range"]')?.focus();
  }, []);
  useEffect(() => {
    function keydown(event) {
      const editing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName);
      if (event.key === "Escape" && !panel && signal > 0) {
        event.preventDefault();
        leaveSignal();
        return;
      }
      if (!editing && event.key === "/" && !panel) {
        event.preventDefault();
        setPanel("archive");
        return;
      }
      if (panel || editing || event.altKey || event.ctrlKey || event.metaKey)
        return;
      // Arrow keys scroll a revealed card on short screens instead of closing it.
      if (event.target.closest("[data-flight-control]") && event.key !== "Home")
        return;
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
        ].includes(event.key)
      ) {
        event.preventDefault();
        manualInput();
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          inputRef.current.lookX = clamp(
            inputRef.current.lookX + (event.key === "ArrowLeft" ? -6 : 6),
            -52,
            52,
          );
          return;
        }
        if (event.key === "Home") returnHome();
        else travel(["ArrowUp", "PageDown"].includes(event.key) ? 0.03 : -0.03);
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [panel, returnHome, travel, leaveSignal, signal, manualInput]);
  useFlightInput({
    surfaceRef: sceneRef,
    inputRef,
    enabled: !panel && !pageHidden,
    onTravel: travel,
    onManualInput: manualInput,
    onLook: stopTravel,
  });

  const filtered = useMemo(
    () => filterCatalog(articles, deferredQuery, topic, codeOnly, year),
    [articles, deferredQuery, topic, codeOnly, year],
  );
  useEffect(() => setPage(0), [deferredQuery, topic, codeOnly, year]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 24));
  const activePage = Math.min(page, pageCount - 1);
  const pageArticles = filtered.slice(activePage * 24, (activePage + 1) * 24);
  const changePage = (next) => {
    setPage(next);
    requestAnimationFrame(() => {
      archiveListRef.current?.scrollIntoView({ block: "start" });
      archiveListRef.current?.focus({ preventScroll: true });
    });
  };
  const highlighted = useMemo(
    () =>
      query || topic !== "all" || codeOnly || year !== "all"
        ? new Set(filtered.map((a) => a.id))
        : null,
    [filtered, query, topic, codeOnly, year],
  );
  const ready = useCallback(() => setSceneReady(true), []);
  const assemblyComplete = useCallback(() => setAssembled(true), []);
  const fail = useCallback(() => {
    setSceneError(true);
    setSceneReady(false);
    setSceneSettled(false);
  }, []);
  useEffect(() => {
    // A reduced-motion handoff has no transitionend event.
    if (sceneReady && reducedMotion) setSceneSettled(true);
  }, [sceneReady, reducedMotion]);
  const exploring = sectorId !== "home" || progress > 0.12 || !!selected;
  const latestEssay =
    articles.find((article) => article.topic === "essay") ||
    articles[0] ||
    initialHome?.latestEssay;
  const articleCount =
    dataState === "ready" ? articles.length : initialHome?.articleCount || 0;
  const phase =
    sectorId !== "home"
      ? sector.label
      : progress < 0.15
        ? "달의 고요 속에서"
        : progress < 0.68
          ? "별과 별 사이를 지나"
          : "조금 더 가까워진 이야기";

  return (
    <main
      onPointerDownCapture={(event) => {
        if (event.pointerType === "touch" || event.pointerType === "mouse")
          setGuidePointer(event.pointerType);
      }}
      className={`observatory ${exploring ? "is-exploring" : ""} ${sceneReady ? "scene-ready" : ""} ${assembled ? "has-assembled" : ""} ${focusingEarth ? "is-earth-focused" : ""}`}
      data-reduced-motion={reducedMotion}
      data-sky-visit={clientReady ? visitSeed : undefined}
      style={{ "--earth-focus": earthFocus }}
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
      {!sceneSettled && <OpeningSky />}
      <div
        className="universe-canvas"
        onTransitionEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.propertyName === "opacity" &&
            sceneReady
          )
            setSceneSettled(true);
        }}
        aria-label="달에서 지구를 바라보는 3D 우주. 한 손가락 드래그로 상하좌우를 둘러봅니다. 두 손가락을 벌리면 다가가고 오므리면 멀어집니다. PC에서는 휠로 이동합니다. 별을 선택해 글을 읽을 수 있습니다."
      >
        {clientReady && !sceneError && (
          <SceneBoundary onError={fail}>
            <Suspense fallback={null}>
              <UniverseScene
                visitSeed={visitSeed}
                articles={sector.articles}
                sector={sector}
                onNearby={showNearby}
                onCloud={enterCloud}
                diagnostics={
                  import.meta.env.DEV &&
                  (initialParams.has("stress") || initialParams.has("ambient"))
                }
                onDiagnostics={setDiagnosticsStats}
                onAmbientDiagnostics={setAmbientStats}
                visible={!pageHidden}
                progress={progress}
                signal={signal}
                selected={selected}
                highlighted={highlighted}
                onSelect={selectArticle}
                paused={paused}
                reducedMotion={reducedMotion}
                compact={compact}
                onReady={ready}
                revealed={sceneReady}
                onAssemblyComplete={assemblyComplete}
                skipAssembly={motionPaused || !!panel}
                enhance={sceneSettled && assembled}
                onError={fail}
                inputRef={inputRef}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      {import.meta.env.DEV &&
        (initialParams.has("stress") || initialParams.has("ambient")) && (
          <output className="scene-diagnostics">
            TEST SKY · {diagnosticsStats}
            <br />
            {ambientStats}
          </output>
        )}
      <div className="scene-shade" aria-hidden="true" />
      <p className="screen-reader-only" role="status">
        {signal >= 1
          ? "숨겨진 신호를 발견했어요. GitHub와 Velog 작업실 링크가 열렸습니다."
          : ""}
      </p>
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
          <a
            href="/writing/"
            className={panel === "archive" ? "active" : ""}
            onClick={(event) => {
              if (!plainNavigation(event)) return;
              event.preventDefault();
              setPanel("archive");
            }}
          >
            글 모아보기{" "}
            <span className="nav-count">
              {dataState === "loading" && !initialHome ? "—" : articleCount}
            </span>
          </a>
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
          글 쓰는 프론트엔드 개발자 윤창원입니다.
          <br />
          코드를 쓰고, 생각을 씁니다.
        </p>
        <button className="journey-button" onClick={beginJourney}>
          <span className="journey-icon">
            <Icon name="arrow" size={19} />
          </span>
          <span>
            나의 우주 유영하기
            <small>
              {touchControls ? "PINCH TO EXPLORE" : "SCROLL TO EXPLORE"}
            </small>
          </span>
        </button>
        <div className="intro-caption">
          <span className="status-dot" />
          {dataState === "loading" && !initialHome
            ? "이야기를 불러오는 중"
            : `${articleCount}개의 기록, 저마다의 궤도`}
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

      {exploring && !panel && signal < 1 && (
        <section
          className="explore-heading"
          inert={focusingEarth ? "" : undefined}
          aria-hidden={focusingEarth || undefined}
        >
          <p className="eyebrow">BETWEEN THE STARS</p>
          <h1>{phase}</h1>
          <p>
            {progress < 0.38
              ? "멀리서는 성운으로, 가까이에서는 하나의 이야기로."
              : "별에 머물러 보세요. 가까이 모인 별은 함께 살펴볼 수 있어요."}
          </p>
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
          <div className="sector-navigation">
            <label>
              탐험 구역
              <select
                aria-label="탐험 구역"
                value={sector.id}
                onChange={(event) => visitSector(event.target.value)}
              >
                {sectorGroups.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} · {item.articles.length}개
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => setPanel("archive")}>연도별로 찾기 ↗</button>
          </div>
        </section>
      )}

      {signal >= 1 && sectorId === "home" && !panel && (
        <SecretSignal strength={signal} quiet={paused} onLeave={leaveSignal} />
      )}

      {!exploring && latestEssay && (
        <a
          className="featured-signal"
          href={articlePath(latestEssay)}
          onClick={(event) => followArticle(event, latestEssay)}
        >
          <span className="signal-orbit">
            <Icon name="star" size={18} />
          </span>
          <span>
            <small>마지막으로 띄운 생각</small>
            <strong>{latestEssay.title}</strong>
          </span>
          <Icon name="external" size={17} />
        </a>
      )}

      {(sceneError || dataState === "error") && signal < 1 && (
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
          {sectorId !== "home"
            ? "STAR SECTOR"
            : progress < 0.15
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
              {sectorId === "home" && progress < 0.15
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
            <span>{sectorId === "home" ? "MOON" : "NEBULA"}</span>
            {!sceneError && dataState !== "error" && signal === 0 ? (
              <button
                className="flight-help"
                data-flight-control
                aria-label="우주 조작 안내"
                title={guideVisible ? "조작 안내 닫기" : "조작 안내 보기"}
                aria-controls="flight-guide"
                aria-describedby={
                  guideVisible ? "flight-guide-copy" : undefined
                }
                aria-expanded={guideVisible}
                disabled={!sceneReady}
                onClick={() => setGuideRequested(!guideVisible)}
              >
                조작 안내
                <Icon name="help" size={13} />
              </button>
            ) : (
              <span>
                {sectorId !== "home"
                  ? "별을 따라 천천히"
                  : signal >= 1
                    ? "숨겨진 좌표 발견"
                    : exploring
                      ? "별을 따라 천천히"
                      : "스크롤하여 지구로"}
              </span>
            )}
            <span>{sectorId === "home" ? "EARTH" : "STARS"}</span>
          </div>
          <div className="flight-slider">
            <span className="origin-dot" />
            <input
              aria-label={
                sectorId === "home"
                  ? "달에서 지구까지 이동"
                  : "성운에서 별까지 이동"
              }
              type="range"
              min="0"
              max="100"
              value={Math.round(progress * 100)}
              onChange={(event) => {
                manualInput();
                setDistance(Number(event.target.value) / 100);
              }}
              onKeyDown={(event) => {
                if (
                  event.altKey ||
                  event.ctrlKey ||
                  event.metaKey ||
                  progress < 1 ||
                  ![
                    "ArrowUp",
                    "ArrowRight",
                    "PageDown",
                    "ArrowDown",
                    "ArrowLeft",
                    "PageUp",
                  ].includes(event.key)
                )
                  return;
                event.preventDefault();
                manualInput();
                travel(
                  ["ArrowUp", "ArrowRight", "PageDown"].includes(event.key)
                    ? 0.03
                    : -0.03,
                );
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
              centerFlightInput(inputRef.current);
              setCruising(false);
            }}
            aria-label="시점 중앙으로"
            title="시점 중앙으로"
          >
            <Icon name="compass" size={17} />
          </button>
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
      <FlightGuide
        visible={guideVisible}
        touch={touchControls}
        quiet={paused}
      />
      <div
        className={`bottom-credit ${guideVisible ? "has-flight-guide" : ""}`}
      >
        <span>© {new Date().getFullYear()} UIWWSW</span>
        <span>
          {!sceneReady && !sceneError
            ? "PREPARING THE UNIVERSE…"
            : "MADE OF THOUGHTS & STARDUST"}
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
          <label className="archive-year">
            기록한 해
            <select
              aria-label="기록한 해"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            >
              <option value="all">모든 연도</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}년
                </option>
              ))}
            </select>
          </label>
          <div
            className="article-list"
            ref={archiveListRef}
            tabIndex={-1}
            aria-label={`검색 결과 ${activePage + 1}페이지`}
          >
            {pageArticles.map((article, index) => (
              <a
                className="article-row"
                key={article.id}
                href={articlePath(article)}
                onClick={(event) => followArticle(event, article)}
              >
                <span className="article-number">
                  {String(activePage * 24 + index + 1).padStart(2, "0")}
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
              </a>
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
                    setYear("all");
                  }}
                >
                  모든 이야기 보기
                </button>
              </div>
            )}
          </div>
          {pageCount > 1 && (
            <nav className="archive-pagination" aria-label="글 목록 페이지">
              <button
                disabled={activePage === 0}
                onClick={() => changePage(activePage - 1)}
              >
                ← 이전
              </button>
              <span role="status">
                {activePage + 1} / {pageCount}
              </span>
              <button
                disabled={activePage + 1 >= pageCount}
                onClick={() => changePage(activePage + 1)}
              >
                다음 →
              </button>
            </nav>
          )}
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
            <a href={articlePath(selected)}>
              글 전용 페이지 <Icon name="external" size={15} />
            </a>
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
            사진을 누르면 원본 크기로 볼 수 있어요. 원문의 전체 서식은
            벨로그에서 확인해 주세요.
          </p>
          <div className="reading-body">
            {reading.status === "loading" && (
              <p role="status">이 별의 이야기를 불러오는 중…</p>
            )}
            {reading.status === "error" && (
              <div className="reading-error" role="alert">
                <p>
                  이야기를 불러오지 못했어요. 다시 시도하거나 위의 벨로그
                  링크에서 읽어 주세요.
                </p>
                <button onClick={reading.retry}>다시 불러오기 ↗</button>
              </div>
            )}
            <ArticleBody
              sentences={reading.sentences}
              title={selected.title}
              articleLink={selected.link}
            />
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

      {panel === "nearby" && (
        <Panel name="nearby" title="가까이 빛나는 이야기" onClose={closePanel}>
          <p className="panel-description">
            손끝에 모인 별들이에요. 읽고 싶은 이야기를 골라 주세요.
          </p>
          <div className="article-list">
            {nearby.map((article) => (
              <a
                className="article-row"
                key={article.id}
                href={articlePath(article)}
                onClick={(event) => followArticle(event, article)}
              >
                <span className="article-row-content">
                  <small>{TOPICS[article.topic].label}</small>
                  <strong>{article.title}</strong>
                  <p>{article.summary}</p>
                </span>
                <Icon name="arrow" />
              </a>
            ))}
          </div>
        </Panel>
      )}

      {panel === "about" && (
        <Panel
          name="about"
          title={
            <>
              안녕하세요,
              <br />글 쓰는 프론트엔드 개발자 윤창원입니다.
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
            윤창원 · Yoon Changwon · uiwwsw
            <br />
            React와 TypeScript로 사용자 인터페이스를 만들며, 개발 경험과
            프로젝트 회고, 일상 에세이를 씁니다.
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
