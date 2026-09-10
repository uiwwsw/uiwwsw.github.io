import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PerspectiveCamera, Vector3 } from "three";
import {
  createStarProjector,
  starVisibility,
  createStarUpdateClock,
  stepStarUpdateClock,
  STAR_NEAR,
  STAR_EDGE,
} from "../src/utils/starVisibility.js";
import {
  packStarLabels,
  nearbyStars,
  transitionStarLabels,
  sameStarLabels,
} from "../src/utils/starSelection.js";
import {
  flightPose,
  earthPosition,
  EARTH_RADIUS,
} from "../src/utils/observatory.js";
import { arrangeVisitStars } from "../src/utils/visitSky.js";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const project = createStarProjector();

test("point visibility, hit testing and projection share camera depth and edge fading", () => {
  assert.equal(starVisibility(-1, 0, 0), 0);
  assert.equal(starVisibility(STAR_NEAR[0], 0, 0), 0);
  assert.equal(starVisibility(STAR_NEAR[1], 0, 0), 1);
  assert.equal(starVisibility(50, STAR_EDGE[1], 0), 0);
  const camera = new PerspectiveCamera(60, 1, 0.1, 650);
  camera.updateMatrixWorld();
  assert.equal(project({ position: [0, 0, 10] }, camera, 600, 600), null);
  assert.equal(project({ position: [0, 0, -2] }, camera, 600, 600), null);
  const actual = { id: "visible", position: [0, 0, -20] };
  const hit = project(actual, camera, 600, 600);
  assert.equal(hit.x, 300);
  assert.equal(hit.y, 300);
  assert.equal(hit.depth, 20);
  assert.deepEqual(
    nearbyStars([hit], 300, 300, true).map((a) => a.id),
    [actual.id],
  );
  camera.position.x = 3;
  camera.updateMatrixWorld();
  const moved = project(actual, camera, 600, 600);
  assert.ok(moved.x < hit.x);
  assert.equal(nearbyStars([moved], hit.x, hit.y, false).length, 0);
  assert.equal(nearbyStars([moved], moved.x, moved.y, false)[0].id, actual.id);
});

test("an article in front of Earth remains selectable while an article behind the surface is occluded", () => {
  const camera = new PerspectiveCamera(60, 1, 0.1, 650);
  camera.updateMatrixWorld();
  const earth = new Vector3(0, 0, -30);
  assert.ok(project({ position: [0, 0, -20] }, camera, 600, 600, earth, 5));
  assert.equal(
    project({ position: [0, 0, -40] }, camera, 600, 600, earth, 5),
    null,
  );
  assert.ok(project({ position: [10, 0, -40] }, camera, 600, 600, earth, 5));
  assert.ok(
    project(
      { position: [0, 0, -40] },
      camera,
      600,
      600,
      new Vector3(0, 0, 30),
      5,
    ),
  );
});

test("label and click updates resume immediately after long sessions, regardless of Fiber clock restarts", () => {
  const state = createStarUpdateClock();
  for (let i = 0; i < 60 * 60; i++) stepStarUpdateClock(state, 1 / 60);
  const before = state.now;
  // Hidden rendering does not tick. Resuming Fiber restarts its absolute clock
  // at zero, but only bounded deltas enter this independent UI clock.
  let updates = 0;
  for (let i = 0; i < 14; i++)
    if (stepStarUpdateClock(state, 1 / 60).layout) updates++;
  assert.ok(state.now > before);
  assert.ok(updates >= 1);
  const snapshot = state.now;
  stepStarUpdateClock(state, 3600);
  assert.ok(Math.abs(state.now - snapshot - 0.05) < 1e-8);
  for (const delta of [NaN, -1, Infinity]) stepStarUpdateClock(state, delta);
  assert.ok(Number.isFinite(state.now));
  const sky = read("src/components/ArticleSky.jsx");
  assert.doesNotMatch(sky, /clock\.elapsedTime|lastCheck/);
  assert.ok(
    sky.indexOf("candidates.current =\n") <
      sky.indexOf("if (!tick.layout) return"),
  );
  const scene = read("src/components/UniverseScene.jsx");
  assert.match(scene, /camera\.updateMatrixWorld\(\);[\s\S]*?}, -0\.5\)/);
});

test("labels use a free side of the real anchor and exclude UI/planet rectangles", () => {
  const stars = [{ id: "right-edge", x: 370, y: 400, position: [1, 2, 3] }];
  const [label] = packStarLabels(stars, 390, 844, true, undefined, [], []);
  assert.ok(label.offsetX < 0);
  assert.equal(label.x, stars[0].x);
  assert.equal(label.position, stars[0].position);
  assert.ok(label.rect.x + label.rect.width <= 378);
  assert.equal(
    packStarLabels(
      stars,
      390,
      844,
      true,
      undefined,
      [],
      [{ x: 0, y: 0, width: 390, height: 844 }],
    ).length,
    0,
  );
  const blocked = packStarLabels(
    stars,
    390,
    844,
    true,
    { x: 260, y: 410, radius: 100 },
    [],
    [],
  );
  assert.equal(blocked.length, 0);
  const prioritized = packStarLabels(
    [
      { id: "retained", x: 370, y: 400 },
      { id: "hovered", x: 370, y: 400 },
    ],
    390,
    844,
    true,
    undefined,
    ["hovered", "retained", "hovered"],
    [],
  );
  assert.equal(prioritized[0].id, "hovered");
});

test("retained labels adopt new positions/layout instead of keeping stale snapshots", () => {
  const a = { id: "a", position: [0, 0, -20], offsetX: 12, offsetY: 0 };
  const before = transitionStarLabels([], [a], 0);
  const next = transitionStarLabels(before, [{ ...a, offsetX: -210 }], 1);
  assert.equal(next[0].offsetX, -210);
  assert.equal(sameStarLabels(before, next), false);
  assert.equal(sameStarLabels(next, [...next]), true);
});

test("the ordinary Moon–Earth route exposes real titles without requiring sideways gestures", () => {
  const index = JSON.parse(read("src/data/velog-index.json"));
  for (const compact of [false, true]) {
    const [width, height] = compact ? [390, 844] : [1440, 900];
    for (const seed of [1, 7, 42, 20260909, 0xffffffff]) {
      const articles = arrangeVisitStars(
        index.articles,
        index.sectors,
        seed,
      ).filter((a) => a.sectorId === "home");
      const discovered = new Set();
      let emptySamples = 0;
      for (let i = 1; i <= 18; i++) {
        const progress = 0.1 + i * 0.05;
        const camera = new PerspectiveCamera(
          compact ? 58 : 46,
          width / height,
          0.1,
          650,
        );
        const pose = flightPose(progress, compact);
        camera.position.set(...pose.position);
        camera.lookAt(...pose.target);
        camera.updateMatrixWorld();
        const planet = new Vector3(...earthPosition(compact));
        const projectedPlanet = planet.clone().project(camera);
        const radius =
          ((EARTH_RADIUS /
            Math.sqrt(
              planet.distanceTo(camera.position) ** 2 - EARTH_RADIUS ** 2,
            )) *
            height) /
          (2 * Math.tan((camera.fov * Math.PI) / 360));
        const projected = articles
          .map((a) => project(a, camera, width, height, planet, EARTH_RADIUS))
          .filter(Boolean)
          .sort((a, b) => a.distance - b.distance);
        const labels = packStarLabels(projected, width, height, compact, {
          x: ((projectedPlanet.x + 1) * width) / 2,
          y: ((1 - projectedPlanet.y) * height) / 2,
          radius,
        });
        if (!labels.length) emptySamples++;
        labels.forEach((a) => discovered.add(a.id));
      }
      assert.ok(
        discovered.size >= Math.min(articles.length, compact ? 5 : 15),
        `${compact}/${seed}: ${discovered.size} readable stars`,
      );
      assert.equal(
        emptySamples,
        0,
        `${compact}/${seed}: ${emptySamples} empty route samples`,
      );
    }
  }
  const sky = read("src/components/ArticleSky.jsx");
  assert.doesNotMatch(
    sky,
    /individualLabels|clouds\.map\(project\)|detail > 0\.45/,
  );
  assert.match(sky, /data-article-star=\{item.id\}/);
});

test("the native slider has large input/thumb targets without changing pinch or keyboard access", () => {
  const css = read("src/index.css");
  const app = read("src/App.jsx");
  assert.match(css, /\.flight-slider input \{[^}]*height: 52px/s);
  for (const pseudo of ["webkit-slider-thumb", "moz-range-thumb"])
    assert.match(
      css,
      new RegExp(`::-${pseudo} \\{[^}]*width: 44px;[^}]*height: 44px`, "s"),
    );
  assert.match(app, /className="flight-slider" data-flight-control/);
  assert.match(app, /step="0\.1"/);
  assert.match(app, /aria-valuetext/);
  assert.match(css, /\.flight-slider input:focus-visible/);
});
