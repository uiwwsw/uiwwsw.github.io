import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FLIGHT_GUIDANCE,
  shouldShowFlightGuide,
  createIdleGuide,
  GUIDE_FIRST_IDLE_MS,
  GUIDE_RETURN_IDLE_MS,
  READING_GUIDANCE,
} from "../src/utils/flightGuide.js";

const available = {
  requested: true,
  ready: true,
  assembled: true,
  sceneError: false,
  panel: null,
  pageHidden: false,
  focusingEarth: false,
};
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("control guidance waits for the completed world, not a navigation timer", () => {
  assert.equal(shouldShowFlightGuide(available), true);
  for (const patch of [
    { ready: false, assembled: false },
    { ready: true, assembled: false },
    { ready: false, assembled: true },
  ])
    assert.equal(shouldShowFlightGuide({ ...available, ...patch }), false);
});

test("reading, failures, hidden tabs and Earth approach suppress control prompts", () => {
  for (const patch of [
    { panel: "article" },
    { panel: "archive" },
    { panel: "about" },
    { pageHidden: true },
    { sceneError: true },
    { focusingEarth: true },
  ]) {
    assert.equal(shouldShowFlightGuide({ ...available, ...patch }), false);
    assert.equal(shouldShowFlightGuide(available), true);
  }
  assert.doesNotMatch(
    JSON.stringify([FLIGHT_GUIDANCE, READING_GUIDANCE]),
    /이스터|숨겨진|가까워지고|신호|저항|깃헙|벨로그|github|velog/i,
  );
});

test("visibility gating never overrides a dismissed idle request", () => {
  const dismissed = { ...available, requested: false };
  for (const patch of [
    {},
    { pageHidden: true },
    { pageHidden: false },
    { panel: "article" },
    { panel: null },
    { ready: false },
    { ready: true },
  ])
    assert.equal(shouldShowFlightGuide({ ...dismissed, ...patch }), false);
  const snapshot = structuredClone(dismissed);
  assert.equal(shouldShowFlightGuide({ ...dismissed, requested: true }), true);
  assert.deepEqual(dismissed, snapshot, "guidance never mutates flight state");
});

test("paused and reduced-motion users still receive usable static instructions", () => {
  assert.equal(
    shouldShowFlightGuide({ ...available, quiet: true, reducedMotion: true }),
    true,
  );
  const css = read("src/components/FlightGuide.css");
  assert.match(css, /data-quiet="false"/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /animation: none !important/);
  assert.match(css, /2\.4s ease-in-out 3/);
  assert.doesNotMatch(css, /infinite|backdrop-filter/);
});

test("guide cannot consume sky input or introduce an entry dependency, timer or storage gate", () => {
  const css = read("src/components/FlightGuide.css");
  const component = read("src/components/FlightGuide.jsx");
  assert.match(css, /pointer-events: none/);
  assert.match(css, /position: absolute/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /max-height: 520px/);
  assert.match(css, /max-height: 380px/);
  assert.match(css, /inset: -26px -10px -4px/);
  assert.doesNotMatch(
    component,
    /three|onPointer|onWheel|setTimeout|setInterval|localStorage|sessionStorage/,
  );
});

test("App uses pointer capability and actual touch, dismisses on exploration and provides a keyboard help toggle", () => {
  const app = read("src/App.jsx");
  assert.match(app, /useMedia\("\(pointer: coarse\)"\)/);
  assert.match(app, /onPointerDownCapture/);
  assert.match(app, /setGuidePointer\(event.pointerType\)/);
  assert.match(app, /touchControls \? "PINCH TO EXPLORE"/);
  assert.match(app, /focusingEarth: signal > 0/);
  assert.match(app, /sceneError: sceneError \|\| dataState === "error"/);
  for (const action of [
    "manualInput",
    "selectArticle",
    "beginJourney",
    "visitSector",
    "showNearby",
  ])
    assert.match(
      app,
      new RegExp(
        `const ${action} = useCallback\\([\\s\\S]*?setGuideRequested\\(false\\)`,
      ),
    );
  assert.match(app, /onChange=\{\(event\) => \{\s*manualInput\(\)/);
  assert.match(app, /aria-controls="flight-guide"/);
  assert.match(
    app,
    /aria-describedby=\{\s*guideVisible \? "flight-guide-copy"/,
  );
  assert.match(app, /aria-expanded=\{guideVisible\}/);
  assert.match(app, /setGuideRequested\(!guideVisible\)/);
  assert.match(app, /className="flight-help"\s*data-flight-control/);
});

function idleFixture() {
  let now = 0;
  let id = 0;
  const timers = new Map();
  const changes = [];
  const guide = createIdleGuide({
    onChange: (visible) => changes.push(visible),
    schedule: (callback, delay) => {
      timers.set(++id, { callback, at: now + delay });
      return id;
    },
    cancel: (key) => timers.delete(key),
  });
  return {
    guide,
    changes,
    timers,
    advance(delta) {
      now += delta;
      for (const [key, timer] of [...timers])
        if (timer.at <= now) {
          timers.delete(key);
          timer.callback();
        }
    },
  };
}

test("help appears after initial inactivity and returns after a fresh idle window, not immediately on input", () => {
  const { guide, changes, timers, advance } = idleFixture();
  guide.enable(true);
  advance(GUIDE_FIRST_IDLE_MS - 1);
  assert.deepEqual(changes, []);
  advance(1);
  assert.deepEqual(changes, [true]);
  guide.request(false);
  assert.deepEqual(changes, [true, false]);
  advance(GUIDE_RETURN_IDLE_MS - 1);
  assert.deepEqual(changes, [true, false]);
  guide.request(false); // Continuing to explore postpones the reminder.
  advance(1);
  assert.deepEqual(changes, [true, false]);
  advance(GUIDE_RETURN_IDLE_MS);
  assert.deepEqual(changes, [true, false, true]);
  advance(600000);
  assert.deepEqual(changes, [true, false, true]);
  assert.equal(timers.size, 0, "no endless animation/reminder interval");
});

test("reading/hidden/cruise blocks cancel pending prompts; resume gets a fresh idle delay", () => {
  const { guide, changes, timers, advance } = idleFixture();
  guide.enable(true);
  guide.request(false);
  const stale = [...timers.values()][0].callback;
  guide.enable(false);
  advance(3600000);
  stale();
  assert.deepEqual(changes, []);
  assert.equal(timers.size, 0);
  guide.enable(true);
  advance(GUIDE_RETURN_IDLE_MS - 1);
  assert.deepEqual(changes, []);
  advance(1);
  assert.deepEqual(changes, [true]);
  guide.enable(false);
  assert.deepEqual(changes, [true, false]);
});

test("manual help opens immediately; disposal and rapid input cannot leave duplicate timers", () => {
  const { guide, changes, timers, advance } = idleFixture();
  guide.enable(true);
  for (let i = 0; i < 500; i++) guide.request(false);
  assert.equal(timers.size, 1);
  guide.request(true);
  assert.deepEqual(changes, [true]);
  assert.equal(timers.size, 0);
  guide.request(false);
  const stale = [...timers.values()][0].callback;
  guide.dispose();
  stale();
  advance(60000);
  guide.enable(true);
  assert.equal(timers.size, 0);
  assert.deepEqual(changes, [true, false]);
});

test("explicit help can stop cruise and open as soon as the scene becomes eligible", () => {
  const { guide, changes, timers } = idleFixture();
  guide.request(true);
  assert.deepEqual(changes, []);
  guide.enable(true);
  assert.deepEqual(changes, [true]);
  assert.equal(timers.size, 0);
  guide.enable(false);
  guide.enable(true);
  assert.deepEqual(changes, [true, false]);
  assert.equal(
    timers.size,
    1,
    "returning from hiding still gets a fresh idle window",
  );
});

test("idle guidance is wired to scene eligibility and deliberate actions without mouse-jitter loops", () => {
  const app = read("src/App.jsx");
  assert.match(app, /useIdleFlightGuide\(/);
  assert.match(app, /!cruising\s*&&\s*signal === 0/);
  assert.match(app, /onWheelCapture/);
  assert.match(app, /onKeyDownCapture/);
  assert.match(app, /exploring=\{exploring\}/);
  const hook = read("src/hooks/useIdleFlightGuide.js");
  assert.match(hook, /idle\.dispose\(\)/);
  assert.doesNotMatch(
    hook,
    /setInterval|localStorage|sessionStorage|pointermove/,
  );
});
