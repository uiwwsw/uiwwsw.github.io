import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PerspectiveCamera, Vector3 } from "three";
import {
  createStarProjectionBuffer,
  createStarProjector,
} from "../src/utils/starVisibility.js";
import { nearbyStars, packStarLabels } from "../src/utils/starSelection.js";
import {
  EARTH_RADIUS,
  earthPosition,
  flightPose,
} from "../src/utils/observatory.js";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const articles = JSON.parse(read("src/data/velog-index.json")).articles;

test("reused projection exactly matches allocating projection and nearest-hit budgets throughout the route", () => {
  const project = createStarProjector();
  for (const compact of [false, true]) {
    const [width, height, limit] = compact ? [390, 844, 36] : [1440, 900, 64];
    for (const source of [
      articles,
      articles.filter((a) => a.topic === "engineering"),
    ]) {
      const before = JSON.stringify(source);
      const buffer = createStarProjectionBuffer(source, limit);
      const earth = new Vector3(...earthPosition(compact));
      const camera = new PerspectiveCamera(
        compact ? 58 : 46,
        width / height,
        0.1,
        650,
      );
      for (let i = 0; i <= 40; i++) {
        const pose = flightPose(i / 40, compact);
        camera.position.set(...pose.position);
        camera.lookAt(...pose.target);
        camera.updateMatrixWorld();
        const expected = source
          .map((item) =>
            project(item, camera, width, height, earth, EARTH_RADIUS),
          )
          .filter(Boolean)
          .sort((a, b) => a.distance - b.distance);
        const result = buffer.update(
          camera,
          width,
          height,
          earth,
          EARTH_RADIUS,
        );
        assert.deepEqual(result.projected, expected);
        assert.deepEqual(result.picks, expected.slice(0, limit));
      }
      assert.equal(JSON.stringify(source), before);
    }
  }
});

test("projection records and arrays are reused while UI snapshots and source metadata stay immutable", () => {
  const source = Object.freeze([
    Object.freeze({
      id: "a",
      position: Object.freeze([0, 0, -20]),
      title: "이야기",
    }),
  ]);
  const buffer = createStarProjectionBuffer(source, 36);
  const camera = new PerspectiveCamera(60, 1, 0.1, 650);
  camera.updateMatrixWorld();
  const first = buffer.update(camera, 600, 600);
  const record = first.projected[0];
  const labels = packStarLabels(
    first.projected,
    600,
    600,
    false,
    undefined,
    [],
    [],
  );
  const picked = nearbyStars(first.picks, 300, 300, false);
  const snapshot = JSON.stringify({ labels, picked });
  const projected = first.projected,
    picks = first.picks;
  camera.position.x = 2;
  camera.updateMatrixWorld();
  const moved = buffer.update(camera, 600, 600);
  assert.equal(moved, first);
  assert.equal(moved.projected, projected);
  assert.equal(moved.picks, picks);
  assert.equal(moved.projected[0], record);
  assert.notEqual(record.x, 300);
  assert.equal(record.position, source[0].position);
  assert.equal(JSON.stringify({ labels, picked }), snapshot);
  assert.equal("x" in source[0], false);
});

test("hidden/offscreen candidates clear immediately and reappear without remounting or clock dependence", () => {
  const buffer = createStarProjectionBuffer(
    [{ id: "a", position: [0, 0, -20] }],
    36,
  );
  const camera = new PerspectiveCamera(60, 1, 0.1, 650);
  camera.updateMatrixWorld();
  const first = buffer.update(camera, 600, 600);
  assert.equal(first.picks.length, 1);
  assert.equal(buffer.clear(), first);
  assert.equal(first.picks.length, 0);
  assert.equal(first.projected.length, 0);
  assert.equal(buffer.update(camera, 600, 600).picks.length, 1);
  camera.lookAt(0, 0, 20);
  camera.updateMatrixWorld();
  assert.equal(buffer.update(camera, 600, 600).picks.length, 0);
  camera.lookAt(0, 0, -20);
  camera.updateMatrixWorld();
  assert.equal(buffer.update(camera, 600, 600).picks.length, 1);
  assert.deepEqual(
    createStarProjectionBuffer([], 36).update(camera, 600, 600),
    { projected: [], picks: [] },
  );
});

test("a full 96-star sector keeps the same bounded mobile/desktop hit budgets", () => {
  const source = Array.from({ length: 96 }, (_, i) => ({
    id: String(i),
    position: [0, 0, -20 - i],
  }));
  const camera = new PerspectiveCamera(60, 1, 0.1, 650);
  camera.updateMatrixWorld();
  for (const limit of [36, 64]) {
    const buffer = createStarProjectionBuffer(source, limit);
    const frame = buffer.update(camera, 600, 600);
    assert.equal(frame.projected.length, 96);
    assert.equal(frame.picks.length, limit);
    assert.deepEqual(
      frame.picks.map((a) => a.id),
      source.slice(0, limit).map((a) => a.id),
    );
  }
});

test("inactive screens skip projection and stable scene subtrees are memoized without stopping frame animation", () => {
  const sky = read("src/components/ArticleSky.jsx");
  assert.match(
    sky,
    /const readable = progress > 0\.12 && !selected && !focusing/,
  );
  assert.match(
    sky,
    /readable\s*\? projection.update\([\s\S]*?: projection.clear\(\)/,
  );
  assert.ok(
    sky.indexOf("candidates.current = picks") <
      sky.indexOf("if (!tick.layout) return"),
  );
  assert.ok(
    sky.indexOf("if (!tick.layout) return") < sky.indexOf("planetScreen.copy"),
  );
  const scene = read("src/components/UniverseScene.jsx");
  for (const name of ["DeepSky", "BackgroundStars"])
    assert.match(
      scene,
      new RegExp(`const ${name} = React.memo\\(function ${name}`),
    );
  assert.match(
    read("src/components/AmbientSpace.jsx"),
    /React.memo\(function AmbientSpace/,
  );
  assert.match(
    read("src/components/CelestialBodies.jsx"),
    /Earth = React.memo\(function Earth/,
  );
  for (const file of ["UniverseScene", "AmbientSpace", "CelestialBodies"])
    assert.match(read(`src/components/${file}.jsx`), /useFrame\(/);
  assert.match(scene, /frameloop=\{visible \? "always" : "never"\}/);
});
