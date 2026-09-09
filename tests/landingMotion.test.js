import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import {
  createLandingMotion,
  stepLandingMotion,
  landingPose,
  landingLight,
  LANDING_DURATION,
} from "../src/utils/landingMotion.js";
import {
  createLunarCraters,
  lunarHeight,
  lunarSegments,
} from "../src/utils/lunarTerrain.js";
import {
  flightPose,
  earthPosition,
  EARTH_RADIUS,
} from "../src/utils/observatory.js";
import {
  createFlightInput,
  centerFlightInput,
} from "../src/utils/flightInput.js";

const advance = (state, seconds, options = { ready: true }, fps = 60) => {
  for (let i = 0; i < Math.ceil(seconds * fps); i++)
    stepLandingMotion(state, 1 / fps, options);
};
const craters = createLunarCraters();
function cameraFor(amount, width, height) {
  const compact = width <= 760;
  const pose = landingPose(flightPose(0, compact), amount, compact);
  const camera = new THREE.PerspectiveCamera(
    compact ? 58 : 46,
    width / height,
    0.1,
    650,
  );
  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  camera.updateMatrixWorld();
  return camera;
}
function horizon(camera) {
  let top = -Infinity,
    left = -Infinity,
    right = -Infinity;
  for (let x = -130; x <= 130; x += 2)
    for (let z = -80; z <= 70; z += 2) {
      const point = new THREE.Vector3(x, lunarHeight(x, z, craters), z).project(
        camera,
      );
      if (point.z >= 1 || point.z <= -1 || Math.abs(point.x) > 1) continue;
      top = Math.max(top, point.y);
      if (point.x < -0.25) left = Math.max(left, point.y);
      if (point.x > 0.25) right = Math.max(right, point.y);
    }
  return { top, left, right };
}

test("landing starts only after the real scene reveal, not during loading or hidden time", () => {
  const state = createLandingMotion();
  advance(state, 30, { ready: false });
  assert.deepEqual(state, createLandingMotion());
  advance(state, 30, { ready: true, paused: true });
  assert.equal(state.amount, 1);
  advance(state, 2);
  const before = { ...state };
  advance(state, 120, { ready: true, paused: true });
  assert.deepEqual(state, before);
  stepLandingMotion(state, 30, { ready: true });
  assert.ok(state.elapsed - before.elapsed <= 0.050001);
  for (const delta of [NaN, Infinity, -1, 0]) {
    const snapshot = { ...state };
    stepLandingMotion(state, delta, { ready: true });
    assert.deepEqual(state, snapshot);
  }
});

test("the 7.2s landing eases from rest to rest at 30/60/120Hz and never replays", () => {
  const samples = [];
  for (const fps of [30, 60, 120]) {
    const state = createLandingMotion();
    advance(state, 3.6, { ready: true }, fps);
    samples.push(state.amount);
    advance(state, LANDING_DURATION, { ready: true }, fps);
    assert.equal(state.phase, "done");
    assert.equal(state.amount, 0);
    advance(state, 10, { ready: false, interrupted: false }, fps);
    assert.equal(state.amount, 0, "returning home must not restart the intro");
  }
  for (const amount of samples) assert.ok(Math.abs(amount - 0.5) < 1e-10);
  const state = createLandingMotion();
  stepLandingMotion(state, 1 / 60, { ready: true });
  assert.ok(1 - state.amount < 0.000001, "gentle initial acceleration");
});

test("manual control interrupts once and removes offsets continuously without blocking input", () => {
  const state = createLandingMotion();
  advance(state, 2);
  const before = state.amount;
  stepLandingMotion(state, 1 / 60, { ready: true, interrupted: true });
  assert.equal(state.phase, "handoff");
  assert.ok(state.amount > before * 0.85 && state.amount < before);
  // Even if the initiating input flag clears, the original timeline never resumes.
  advance(state, 1.2);
  assert.equal(state.phase, "done");
  const early = createLandingMotion();
  stepLandingMotion(early, 1 / 60, { interrupted: true });
  assert.equal(
    early.amount,
    0,
    "input before WebGL readiness skips behind the backdrop",
  );
  const input = createFlightInput();
  assert.equal(input.interacted, false);
  centerFlightInput(input);
  assert.equal(
    input.interacted,
    true,
    "compass/Home/sector navigation permanently takes over",
  );
});

test("reduced motion, reading panels and non-home sectors can skip without waiting for assets", () => {
  for (const started of [false, true]) {
    const state = createLandingMotion();
    if (started) advance(state, 2);
    stepLandingMotion(state, 0, { ready: false, paused: true, skip: true });
    assert.equal(state.phase, "done");
    assert.equal(state.amount, 0);
    advance(state, 3);
    assert.equal(state.amount, 0);
  }
});

test("landing ends at the unchanged exploration pose and never mutates its source", () => {
  for (const compact of [false, true])
    for (const progress of [0, 0.5, 1]) {
      const base = flightPose(progress, compact);
      const snapshot = structuredClone(base);
      assert.deepEqual(landingPose(base, 0, compact), base);
      landingPose(base, 0.7, compact);
      assert.deepEqual(base, snapshot);
    }
});

test("ground enters from below; the desktop left ridge appears before the floor", () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 568],
    [430, 932],
    [844, 390],
  ]) {
    const start = horizon(cameraFor(1, width, height));
    const middle = horizon(cameraFor(0.5, width, height));
    const end = horizon(cameraFor(0, width, height));
    assert.ok(
      start.top < -1,
      `ground must not already fill the opening at ${width}x${height}`,
    );
    assert.ok(middle.top > -1 && middle.top < -0.65);
    assert.ok(
      end.top > -0.4 && end.top < -0.15,
      "settled ground remains below the reading/sky area",
    );
    assert.ok(start.top < middle.top && middle.top < end.top);
  }
  const edge = horizon(cameraFor(0.75, 1440, 900));
  assert.ok(edge.left > -1 && edge.right < -1);
});

test("Earth settles in the upper-right and all landing poses stay clear of terrain and planet", () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    const compact = width <= 760;
    const earth = new THREE.Vector3(...earthPosition(compact));
    let previousEarthY = -Infinity;
    let previousAltitude = Infinity;
    for (let i = 0; i <= 100; i++) {
      const camera = cameraFor(1 - i / 100, width, height);
      const projected = earth.clone().project(camera);
      assert.ok(
        projected.y >= previousEarthY - 1e-10,
        "Earth rises through a continuous framing change",
      );
      previousEarthY = projected.y;
      assert.ok(camera.position.y <= previousAltitude);
      previousAltitude = camera.position.y;
      assert.ok(
        camera.position.y -
          lunarHeight(camera.position.x, camera.position.z, craters) >
          8,
      );
      assert.ok(camera.position.distanceTo(earth) > EARTH_RADIUS + 50);
      assert.ok(
        projected.x > 0 &&
          projected.x < 1 &&
          projected.y > -1 &&
          projected.y < 1,
      );
    }
    assert.ok(previousEarthY > 0.3);
  }
});

test("cinematic direction changes smoothly, with no roll or FOV pulse", () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    const state = createLandingMotion();
    let previous = cameraFor(1, width, height);
    for (let i = 0; i < 60 * 8; i++) {
      stepLandingMotion(state, 1 / 60, { ready: true });
      const camera = cameraFor(state.amount, width, height);
      assert.ok(
        camera.quaternion.angleTo(previous.quaternion) <
          THREE.MathUtils.degToRad(0.2),
      );
      assert.equal(camera.fov, previous.fov);
      assert.deepEqual(camera.up.toArray(), [0, 1, 0]);
      previous = camera;
    }
  }
});

test("sunlit warmth settles gently using the existing light, without an exposure flash", () => {
  let previous = Infinity;
  for (let i = 0; i <= 100; i++) {
    const light = landingLight(1 - i / 100);
    assert.ok(light.intensity <= previous);
    assert.ok(light.intensity >= 2.8 && light.intensity <= 3.1);
    assert.ok(light.warmth >= 0 && light.warmth <= 1);
    previous = light.intensity;
  }
  assert.equal(landingLight(0).intensity, 2.8);
});

test("lunar relief is deterministic and mobile geometry has a smaller bounded budget", () => {
  assert.deepEqual(createLunarCraters(), craters);
  const [mx, mz] = lunarSegments(true);
  const [dx, dz] = lunarSegments(false);
  assert.equal((mx + 1) * (mz + 1), 13545);
  assert.equal((dx + 1) * (dz + 1), 40001);
  assert.ok(((mx + 1) * (mz + 1)) / ((dx + 1) * (dz + 1)) < 0.34);
  for (let x = -130; x <= 130; x += 10)
    for (let z = -80; z <= 140; z += 10) {
      const y = lunarHeight(x, z, craters);
      assert.ok(Number.isFinite(y) && y > -25 && y < 0);
    }
});

test("scene wiring preserves startup gates, immediate input, hidden suspension and one Moon", () => {
  const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const scene = read("src/components/UniverseScene.jsx");
  const bodies = read("src/components/CelestialBodies.jsx");
  const app = read("src/App.jsx");
  assert.match(scene, /ready=\{revealed\}/);
  assert.match(scene, /\}, -2\)/);
  assert.match(scene, /phase === "done" && !reported\.current/);
  assert.match(scene, /frameloop=\{visible \? "always" : "never"\}/);
  assert.match(
    scene,
    /reducedMotion \|\| skipLanding \|\| !!selected \|\| sector\.id !== "home"/,
  );
  assert.match(app, /inputRef\.current\.interacted = true/);
  assert.match(app, /revealed=\{sceneReady\}/);
  assert.match(app, /skipLanding=\{motionPaused \|\| !!panel\}/);
  assert.match(app, /onLandingComplete=\{landingComplete\}/);
  assert.match(bodies, /gl\.initTexture\(lunarMap\)/);
  assert.match(bodies, /ground\.current\.frustumCulled = cull/);
  assert.equal((bodies.match(/name="lunar-ground"/g) || []).length, 1);
  assert.match(
    bodies,
    /React\.useEffect\(\(\) => \(\) => geometry\.dispose\(\), \[geometry\]\)/,
  );
  assert.match(
    bodies,
    /React\.useEffect\(\(\) => \(\) => lunarMap\.dispose\(\), \[lunarMap\]\)/,
  );
  assert.doesNotMatch(scene, /camera\.rotation\.z\s*=|<EffectComposer|<Bloom/);
});
