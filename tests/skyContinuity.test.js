import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import {
  createBackgroundStarData,
  createSkyPreview,
} from "../src/utils/skyBackdrop.js";
import { flightPose } from "../src/utils/observatory.js";

test("initial HTML star anchors project to the same positions as the actual GPU starfield", () => {
  for (const compact of [false, true]) {
    const data = createBackgroundStarData(compact);
    const stars = createSkyPreview(compact);
    assert.deepEqual(createSkyPreview(compact), stars);
    assert.equal(stars.length, 96);
    assert.equal(data.sizes.length, compact ? 2800 : 6000);
    assert.equal(new Set(stars.map((s) => s.id)).size, 96);
    for (const aspect of [390 / 844, 1440 / 900, 3440 / 1440]) {
      const pose = flightPose(0, compact);
      const camera = new THREE.PerspectiveCamera(
        compact ? 58 : 46,
        aspect,
        0.1,
        650,
      );
      camera.position.set(...pose.position);
      camera.lookAt(...pose.target);
      camera.updateMatrixWorld();
      for (const star of stars) {
        const projected = new THREE.Vector3()
          .fromArray(data.positions, star.id * 3)
          .project(camera);
        assert.ok(Math.abs(projected.x - star.x / aspect) < 0.00002);
        assert.ok(Math.abs(projected.y + star.y) < 0.00002);
        assert.ok(star.opacity > 0 && star.opacity <= 0.35);
      }
    }
  }
});

test("fixed lunar geometry writes depth before the nebula draw", () => {
  const bodies = readFileSync(
    new URL("../src/components/CelestialBodies.jsx", import.meta.url),
    "utf8",
  ).split("function LunarSurface")[1];
  assert.equal((bodies.match(/<meshStandardMaterial/g) || []).length, 2);
  assert.doesNotMatch(bodies, /transparent|depthWrite|getDrawingBufferSize/);
  const scene = readFileSync(
    new URL("../src/components/UniverseScene.jsx", import.meta.url),
    "utf8",
  ).split("function DeepSky")[1].split("const BackgroundStars")[0];
  assert.match(scene, /<mesh renderOrder=\{10\}>/);
});

test("the initial backdrop has no image request or Three dependency and keeps matching clocks at reveal", () => {
  const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  assert.doesNotMatch(
    read("src/utils/skyBackdrop.js"),
    /from "three"|window|document/,
  );
  assert.doesNotMatch(
    read("src/components/OpeningSky.jsx"),
    /<img|<image|<canvas/,
  );
  const css = read("src/index.css");
  assert.match(css, /transition: opacity \.25s linear/);
  assert.doesNotMatch(css, /#233e5c80|#26364e65/);
  assert.match(
    read("src/components/UniverseScene.jsx"),
    /createBackgroundStarData\(compact, visitSeed\)/,
  );
  assert.match(
    read("src/components/UniverseScene.jsx"),
    /paused=\{paused \|\| !revealed\}/,
  );
});
