import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FLIGHT_GUIDANCE,
  shouldShowFlightGuide,
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
    JSON.stringify(FLIGHT_GUIDANCE),
    /이스터|숨겨진|가까워지고|신호|저항|깃헙|벨로그|github|velog/i,
  );
});

test("dismissal stays dismissed across returning home, visibility and reading, until explicitly reopened", () => {
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
    "enterCloud",
  ])
    assert.match(
      app,
      new RegExp(
        `const ${action} = useCallback\\([\\s\\S]*?setGuideRequested\\(false\\)`,
      ),
    );
  assert.match(app, /onChange=\{\(event\) => \{\s*manualInput\(\)/);
  assert.match(app, /aria-controls="flight-guide"/);
  assert.match(app, /aria-describedby=\{\s*guideVisible \? "flight-guide-copy"/);
  assert.match(app, /aria-expanded=\{guideVisible\}/);
  assert.match(app, /setGuideRequested\(!guideVisible\)/);
  assert.match(app, /className="flight-help"\s*data-flight-control/);
});
