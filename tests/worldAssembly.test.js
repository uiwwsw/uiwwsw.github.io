import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { lunarRevealOpacity } from "../src/utils/lunarReveal.js";
import {
  createWorldAssembly,
  stepWorldAssembly,
  worldAssemblyLayout,
  assemblyEarthPosition,
  assemblyGroundY,
  ASSEMBLY_DURATION,
  ASSEMBLY_TIMING,
} from "../src/utils/worldAssembly.js";
import {
  flightPose,
  earthPosition,
  EARTH_RADIUS,
} from "../src/utils/observatory.js";
import {
  createLunarCraters,
  lunarHeight,
  lunarSegments,
} from "../src/utils/lunarTerrain.js";

const advance = (state, seconds, options = { ready: true }, fps = 60) => {
  for (let i = 0; i < Math.ceil(seconds * fps); i++)
    stepWorldAssembly(state, 1 / fps, options);
};
const viewports = [
  [320, 568],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1440, 900],
  [3440, 1440],
  [844, 390],
];
function setup(width, height) {
  const compact = width <= 760;
  const pose = flightPose(0, compact);
  const camera = new THREE.PerspectiveCamera(
    compact ? 58 : 46,
    width / height,
    0.1,
    650,
  );
  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  camera.updateMatrixWorld();
  const frustum = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    ),
  );
  const state = createWorldAssembly(compact);
  state.layout = worldAssemblyLayout(compact, width / height);
  return { compact, camera, frustum, state };
}
const earthSphere = (state) =>
  new THREE.Sphere(
    new THREE.Vector3(...assemblyEarthPosition(state.layout, state.earth)),
    EARTH_RADIUS * 1.025,
  );

test("Earth starts fully offscreen and the gently lowered Moon is completely unrevealed", () => {
  for (const [width, height] of viewports) {
    const { state, frustum } = setup(width, height);
    assert.equal(
      frustum.intersectsSphere(earthSphere(state)),
      false,
      `Earth edge at ${width}x${height}`,
    );
    const drop = assemblyGroundY(state.layout, 1);
    assert.ok(drop >= -3.2 && drop < 0, "no large elevator-like displacement");
    for (let height = 0; height <= 1; height += 0.01)
      assert.equal(lunarRevealOpacity(height, 1 - state.ground), 0);
    advance(state, ASSEMBLY_DURATION + 0.1);
    assert.equal(frustum.intersectsSphere(earthSphere(state)), true);
  }
});

test("objects assemble with real translations while camera position, rotation and FOV remain fixed", () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    const { state, camera } = setup(width, height);
    const position = camera.position.clone(),
      quaternion = camera.quaternion.clone(),
      projection = camera.projectionMatrix.clone();
    const initialProjection = earthSphere(state).center.clone().project(camera);
    let previousX = Infinity,
      previousFloor = -Infinity;
    for (let i = 0; i < Math.ceil((ASSEMBLY_DURATION + 0.1) * 60); i++) {
      stepWorldAssembly(state, 1 / 60, { ready: true });
      const projected = earthSphere(state).center.clone().project(camera);
      const floor = assemblyGroundY(state.layout, state.ground);
      assert.ok(projected.x <= previousX + 1e-10);
      assert.ok(
        Math.abs(projected.y - initialProjection.y) < 1e-10,
        "horizontal entry must not simulate camera tilt",
      );
      assert.ok(floor >= previousFloor - 1e-10);
      previousX = projected.x;
      previousFloor = floor;
      assert.ok(camera.position.equals(position));
      assert.ok(camera.quaternion.equals(quaternion));
      assert.ok(camera.projectionMatrix.equals(projection));
    }
    assert.ok(previousX > 0 && previousX < 1);
    assert.equal(previousFloor, 0);
  }
});

test("the visible Earth and floor keep their rhythm across viewports and refresh rates", (t) => {
  const craters = createLunarCraters();
  const terrain = [];
  for (let x = -130; x <= 130; x += 4)
    for (let z = -80; z <= 70; z += 4)
      terrain.push([x, lunarHeight(x, z, craters), z]);
  for (const [width, height] of viewports) {
    for (const fps of [30, 60, 120]) {
      const { state, camera, frustum } = setup(width, height);
      let firstEarth, firstGround;
      for (let i = 0; i < Math.ceil((ASSEMBLY_DURATION + 0.1) * fps); i++) {
        stepWorldAssembly(state, 1 / fps, { ready: true });
        if (!firstEarth && frustum.intersectsSphere(earthSphere(state)))
          firstEarth = state.elapsed;
        if (
          !firstGround &&
          terrain.some((p) => {
            const point = new THREE.Vector3(
              p[0],
              p[1] + assemblyGroundY(state.layout, state.ground),
              p[2],
            ).project(camera);
            return (
              Math.abs(point.x) < 1 &&
              Math.abs(point.y) < 1 &&
              Math.abs(point.z) < 1 &&
              lunarRevealOpacity((point.y + 1) / 2, 1 - state.ground) > 0.05
            );
          })
        )
          firstGround = state.elapsed;
      }
      assert.ok(firstEarth > 0.4 && firstEarth < 1.2, `Earth at ${firstEarth}`);
      assert.ok(
        firstGround >= 0.85 && firstGround < 1.35,
        `floor at ${firstGround}`,
      );
      assert.equal(state.phase, "done");
      if (fps === 60)
        t.diagnostic(
          `${width}x${height}: Earth ${firstEarth.toFixed(2)}s, floor ${firstGround.toFixed(2)}s (projection only)`,
        );
    }
  }
});

test("cold startup and hidden tabs never consume the object entry animation", () => {
  const state = createWorldAssembly();
  advance(state, 30, { ready: false });
  assert.deepEqual(state, createWorldAssembly());
  advance(state, 30, { ready: true, paused: true });
  assert.equal(state.earth, 1);
  advance(state, 0.5);
  const before = structuredClone(state);
  advance(state, 60, { ready: true, paused: true });
  assert.deepEqual(state, before);
  stepWorldAssembly(state, 90, { ready: true });
  assert.ok(state.elapsed - before.elapsed <= 0.050001);
  for (const delta of [NaN, Infinity, 0, -1]) {
    const snapshot = structuredClone(state);
    stepWorldAssembly(state, delta, { ready: true });
    assert.deepEqual(state, snapshot);
  }
});

test("the sky gets a short lead, then both bodies accelerate and settle without a launch snap", () => {
  const state = createWorldAssembly();
  stepWorldAssembly(state, 1 / 120, { ready: true });
  assert.equal(state.earth, 1, "the background starts the handoff first");
  assert.equal(state.ground, 1, "the floor waits for its own beat");
  advance(state, 0.1, { ready: true }, 120);
  assert.equal(state.ground, 1);
  advance(state, 0.1, { ready: true }, 120);
  assert.ok(state.earth < 1);
  assert.equal(state.ground, 1);
  advance(state, 0.5, { ready: true }, 120);
  assert.ok(state.ground < 1);
  assert.equal(ASSEMBLY_DURATION, 2.6);
  for (const [key, timing] of Object.entries(ASSEMBLY_TIMING)) {
    const end = timing.start + timing.duration;
    const nearArrival = createWorldAssembly();
    advance(nearArrival, end - 0.05);
    assert.ok(nearArrival[key] < 0.0002, "no visible last-frame snap");
    advance(nearArrival, 0.1);
    assert.equal(nearArrival[key], 0);
  }
});

test("staggered ease-out timing is consistent at 30/60/120Hz and never overshoots", () => {
  const samples = [];
  for (const fps of [30, 60, 120]) {
    const state = createWorldAssembly();
    advance(state, 0.5, { ready: true }, fps);
    samples.push([state.earth, state.ground]);
    assert.ok(state.earth < state.ground, "Earth starts before the ground");
    let previous = [state.earth, state.ground];
    for (let i = 0; i < Math.ceil(fps * ASSEMBLY_DURATION); i++) {
      stepWorldAssembly(state, 1 / fps, { ready: true });
      assert.ok(state.earth >= 0 && state.earth <= previous[0]);
      assert.ok(state.ground >= 0 && state.ground <= previous[1]);
      previous = [state.earth, state.ground];
    }
    assert.equal(state.elapsed, ASSEMBLY_DURATION);
    assert.equal(state.phase, "done");
  }
  for (const sample of samples)
    for (let i = 0; i < 2; i++)
      assert.ok(Math.abs(sample[i] - samples[0][i]) < 1e-10);
});

test("manual takeover completes object placement smoothly without restarting the timeline", () => {
  const state = createWorldAssembly();
  advance(state, 0.5);
  const before = [state.earth, state.ground];
  stepWorldAssembly(state, 1 / 60, { ready: true, interrupted: true });
  assert.equal(state.phase, "handoff");
  assert.ok(state.earth < before[0] && state.earth > before[0] * 0.85);
  assert.ok(state.ground < before[1] && state.ground > before[1] * 0.85);
  advance(state, 1.2);
  assert.equal(state.phase, "done");
  advance(state, 10, { ready: false });
  assert.equal(state.earth, 0);
  assert.equal(state.ground, 0);
});

test("early input, reduced motion, panels, navigation and secret focus can skip immediately", () => {
  for (const options of [{ interrupted: true }, { skip: true, paused: true }]) {
    const state = createWorldAssembly();
    stepWorldAssembly(state, 0, options);
    assert.equal(state.phase, "done");
    assert.equal(state.earth, 0);
    assert.equal(state.ground, 0);
  }
  const state = createWorldAssembly();
  advance(state, 0.5);
  stepWorldAssembly(state, 0, { skip: true });
  assert.equal(state.phase, "done");
});

test("final object transforms preserve the exact existing Earth origin and Moon travel origin", () => {
  for (const compact of [false, true]) {
    const layout = worldAssemblyLayout(compact, 1.6);
    const before = structuredClone(layout);
    assert.deepEqual(assemblyEarthPosition(layout, 0), earthPosition(compact));
    assert.equal(Math.abs(assemblyGroundY(layout, 0)), 0);
    assemblyEarthPosition(layout, 0.5);
    assert.deepEqual(layout, before);
    for (const aspect of [NaN, Infinity, 0, -1]) {
      const safe = worldAssemblyLayout(compact, aspect);
      assert.ok(
        [...safe.earthOffset, safe.groundOffset].every(Number.isFinite),
      );
    }
  }
});

test("responsive recalibration does not replay the sequence or alter completed placements", () => {
  const state = createWorldAssembly(true);
  advance(state, 0.5);
  const before = [state.earth, state.ground, state.elapsed];
  state.layout = worldAssemblyLayout(false, 844 / 390);
  assert.deepEqual([state.earth, state.ground, state.elapsed], before);
  advance(state, 5);
  state.layout = worldAssemblyLayout(true, 390 / 844);
  assert.deepEqual(
    assemblyEarthPosition(state.layout, state.earth),
    earthPosition(true),
  );
  assert.equal(state.phase, "done");
});

test("the lunar ridge and mobile geometry budget remain deterministic", () => {
  const craters = createLunarCraters();
  assert.deepEqual(createLunarCraters(), craters);
  const vertices = (compact) =>
    lunarSegments(compact).reduce(
      (count, segments) => count * (segments + 1),
      1,
    );
  assert.equal(vertices(true), 13545);
  assert.equal(vertices(false), 40001);
  for (let x = -130; x <= 130; x += 10)
    for (let z = -80; z <= 140; z += 10) {
      const y = lunarHeight(x, z, craters);
      assert.ok(Number.isFinite(y) && y > -25 && y < 0);
    }
});

test("scene translates the actual planet and floor, not the camera or a duplicate poster", () => {
  const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const scene = read("src/components/UniverseScene.jsx");
  const bodies = read("src/components/CelestialBodies.jsx");
  const app = read("src/App.jsx");
  assert.doesNotMatch(
    scene,
    /landingPose|landingLight|createLandingMotion|LunarLight/,
  );
  assert.match(scene, /const pose = signalFlightPose\(/);
  assert.match(scene, /paused \|\| assemblyRef\.current\.phase !== "done"/);
  assert.match(scene, /ready=\{revealed\}/);
  assert.match(scene, /\}, -2\)/);
  assert.match(scene, /phase === "done" && !reported\.current/);
  assert.match(scene, /signal > 0/);
  assert.match(scene, /frameloop=\{visible \? "always" : "never"\}/);
  assert.match(
    bodies,
    /arrival\.current\.position\.set\([\s\S]*?assemblyEarthPosition/,
  );
  assert.match(bodies, /arrival\.current\.position\.y = assemblyGroundY/);
  assert.equal((bodies.match(/name="earth-surface"/g) || []).length, 1);
  assert.equal((bodies.match(/name="lunar-ground"/g) || []).length, 1);
  assert.match(bodies, /gl\.initTexture\(lunarMap\)/);
  assert.match(bodies, /object\.frustumCulled = cull/);
  assert.match(bodies, /ground\.current\.frustumCulled = cull/);
  assert.match(
    bodies,
    /planetPositionRef\.current\.copy\(arrival\.current\.position\)/,
  );
  assert.match(
    read("src/components/ArticleSky.jsx"),
    /planet\.copy\(planetPositionRef\.current\)/,
  );
  assert.match(app, /onAssemblyComplete=\{assemblyComplete\}/);
  assert.match(app, /skipAssembly=\{motionPaused \|\| !!panel\}/);
  assert.match(
    read("src/index.css"),
    /\.scene-ready\.has-assembled \.earth-note/,
  );
});
