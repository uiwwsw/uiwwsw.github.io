import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  Texture,
  RepeatWrapping,
  ClampToEdgeWrapping,
  NoColorSpace,
  SRGBColorSpace,
} from "three";
import {
  CLOUD_OPACITY,
  CLOUD_SHELL_SCALE,
  CLOUD_SHADOW_STRENGTH,
  CLOUD_CYCLES_PER_SECOND,
  cloudSampling,
  configureEarthTextures,
  earthCloudOffset,
} from "../src/utils/earthLayers.js";

test("all Earth maps cover the globe once with the same north/east UV frame", () => {
  const maps = Array.from({ length: 3 }, () => new Texture());
  for (const map of maps) {
    map.repeat.set(2, 2);
    map.offset.set(0.5, 0.25);
    map.center.set(0.5, 0.5);
    map.rotation = Math.PI;
    map.flipY = false;
    map.colorSpace = SRGBColorSpace;
  }
  configureEarthTextures(maps);
  for (const map of maps) {
    assert.deepEqual(map.repeat.toArray(), [1, 1]);
    assert.deepEqual(map.offset.toArray(), [0, 0]);
    assert.equal(map.rotation, 0);
    assert.equal(map.flipY, true);
    assert.equal(map.wrapS, RepeatWrapping);
    assert.equal(map.wrapT, ClampToEdgeWrapping);
    assert.equal(map.colorSpace, NoColorSpace);
    assert.deepEqual(
      map.matrix.elements.map((value) => value || 0),
      [1, 0, 0, 0, 1, 0, 0, 0, 1],
    );
    map.dispose();
  }
});

test("cloud motion is slow and wrapped, not a second rapidly moving terrain map", () => {
  assert.ok(CLOUD_CYCLES_PER_SECOND < 0.0018 / 20);
  assert.ok(earthCloudOffset(60) * 360 < 2);
  for (let t = 0; t <= 86400; t += 13) {
    assert.ok(earthCloudOffset(t) >= 0 && earthCloudOffset(t) < 1);
  }
  for (const t of [0, -1, NaN, Infinity]) assert.equal(earthCloudOffset(t), 0);
  assert.match(cloudSampling, /texture2D\(surfaceMap, cloudUv\)\.b/);
  assert.ok(!/texture2D\([^)]*\)\.[rg]/.test(cloudSampling));
  assert.match(cloudSampling, /fract\(mapUv\.x \+ cloudOffset/);
  assert.match(cloudSampling, /clamp\(mapUv\.y/);
});

test("clouds cannot replace most terrain color and stay below the atmosphere shell", () => {
  assert.ok(CLOUD_OPACITY > 0 && CLOUD_OPACITY <= 0.4);
  assert.ok(CLOUD_SHADOW_STRENGTH > 0 && CLOUD_SHADOW_STRENGTH <= 0.06);
  assert.ok(CLOUD_SHELL_SCALE > 1 && CLOUD_SHELL_SCALE < 1.025);
});

test("one opaque Earth draws geography, the cloud shader draws no geographic color map", () => {
  const source = readFileSync(
    new URL("../src/components/CelestialBodies.jsx", import.meta.url),
    "utf8",
  );
  const ground = source.split("const earthFragment = `")[1].split("`;", 1)[0];
  const cloud = source.split("const cloudFragment = `")[1].split("`;", 1)[0];
  assert.equal((source.match(/name="earth-surface"/g) || []).length, 1);
  assert.equal((source.match(/name="earth-clouds"/g) || []).length, 1);
  assert.match(ground, /texture2D\(dayMap, vUv\)/);
  assert.match(ground, /texture2D\(nightMap, vUv\)/);
  assert.ok(!ground.includes("cloudUv"));
  assert.ok(!ground.includes("cloud * 0.88"));
  assert.ok(!cloud.includes("dayMap") && !cloud.includes("nightMap"));
  assert.match(source, /blending=\{THREE.NormalBlending\}/);
  const scene = readFileSync(
    new URL("../src/components/UniverseScene.jsx", import.meta.url),
    "utf8",
  );
  assert.equal((scene.match(/<Earth\s/g) || []).length, 1);
});
