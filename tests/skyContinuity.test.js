import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import {
  createBackgroundStarData,
  createSkyPreview,
} from "../src/utils/skyBackdrop.js";
import { flightPose } from "../src/utils/observatory.js";
import {
  lunarRevealOpacity,
  patchLunarRevealShader,
} from "../src/utils/lunarReveal.js";

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

test("terrain reveal is empty initially, solid finally, and progresses from bottom to horizon without flashing", () => {
  for (let height = 0; height <= 1; height += 0.01) {
    assert.equal(lunarRevealOpacity(height, 0), 0);
    assert.equal(lunarRevealOpacity(height, 1), 1);
    let previous = 0;
    for (let progress = 0; progress < 1; progress += 0.005) {
      const alpha = lunarRevealOpacity(height, progress);
      assert.ok(alpha >= previous && alpha <= 1);
      previous = alpha;
    }
  }
  assert.ok(lunarRevealOpacity(0.1, 0.4) > lunarRevealOpacity(0.3, 0.4));
  const feather = lunarRevealOpacity(0.25, 0.5);
  assert.ok(
    feather > 0 && feather < 1,
    "the advancing edge is soft, not a hard clip",
  );
  for (const height of [0, 0.1, 0.2, 0.3, 0.4, 0.45])
    assert.equal(
      lunarRevealOpacity(height, 0.99),
      1,
      "final settlement cannot pop visible ground",
    );
});

test("both lunar materials share the same reveal and physical drawing-buffer height", () => {
  const uniforms = { progress: { value: 0 }, height: { value: 1000 } };
  for (let i = 0; i < 2; i++) {
    const shader = {
      uniforms: {},
      fragmentShader: THREE.ShaderLib.standard.fragmentShader,
    };
    patchLunarRevealShader(shader, uniforms);
    assert.equal(shader.uniforms.uLunarReveal, uniforms.progress);
    assert.equal(shader.uniforms.uLunarViewportHeight, uniforms.height);
    assert.match(shader.fragmentShader, /gl_FragCoord.y/);
    assert.match(shader.fragmentShader, /if \(emergence <= .001\) discard/);
    assert.match(shader.fragmentShader, /diffuseColor.a \*= emergence/);
    assert.ok(shader.fragmentShader.includes("#include <alphatest_fragment>"));
  }
  const bodies = readFileSync(
    new URL("../src/components/CelestialBodies.jsx", import.meta.url),
    "utf8",
  );
  assert.equal((bodies.match(/\.\.\.emergenceMaterial/g) || []).length, 2);
  assert.match(bodies, /gl.getDrawingBufferSize\(bufferSize\).y/);
  assert.match(bodies, /progress.value = 1 - assemblyRef.current.ground/);
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
  assert.match(css, /transition: opacity 1\.15s linear/);
  assert.doesNotMatch(css, /#233e5c80|#26364e65/);
  assert.match(
    read("src/components/UniverseScene.jsx"),
    /createBackgroundStarData\(compact\)/,
  );
  assert.match(
    read("src/components/UniverseScene.jsx"),
    /paused=\{paused \|\| !revealed\}/,
  );
});
