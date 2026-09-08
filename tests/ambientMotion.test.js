import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  advanceAmbientTime,
  createDustField,
  dustBudget,
  DUST_BOUNDS,
  distantStreak,
} from "../src/utils/ambientMotion.js";

test("ambient time advances while idle and freezes without fast-forwarding on resume", () => {
  let time = 0;
  for (let frame = 0; frame < 600; frame++)
    time = advanceAmbientTime(time, 1 / 60, false);
  assert.ok(Math.abs(time - 10) < 1e-10);
  const frozen = time;
  for (let frame = 0; frame < 600; frame++)
    time = advanceAmbientTime(time, 1 / 60, true);
  assert.equal(time, frozen);
  assert.equal(advanceAmbientTime(time, 600, false), time + 0.05);
  for (const delta of [0, -1, NaN, Infinity])
    assert.equal(advanceAmbientTime(time, delta, false), time);
});

test("decorative dust is deterministic, bounded and smaller on mobile", () => {
  assert.ok(dustBudget(true) < dustBudget(false));
  for (const compact of [false, true]) {
    const field = createDustField(compact);
    assert.deepEqual(field, createDustField(compact));
    assert.equal(field.positions.length, dustBudget(compact) * 3);
    assert.equal(field.sizes.length, dustBudget(compact));
    for (let i = 0; i < field.positions.length; i++) {
      assert.ok(Number.isFinite(field.positions[i]));
      assert.ok(Math.abs(field.positions[i]) <= DUST_BOUNDS[i % 3] / 2);
      assert.ok(field.velocity[i] > 0 && field.velocity[i] < 0.6);
    }
    assert.ok(field.sizes.every((value) => value >= 0.8 && value <= 2.5));
  }
});

test("distant trails are occasional, gradual and never stack or flash", () => {
  for (const time of [0, 6.9, 10, 20, 35.9])
    assert.equal(distantStreak(time).visible, false);
  assert.ok(distantStreak(8.4).visible);
  assert.ok(distantStreak(8.4).opacity > 0.5);
  for (let time = 0; time < 300; time += 0.05) {
    const state = distantStreak(time);
    assert.ok(state.opacity >= 0 && state.opacity <= 0.58);
    assert.ok(state.progress >= 0 && state.progress <= 1);
    assert.ok(
      Math.abs(state.opacity - distantStreak(time + 0.05).opacity) < 0.04,
    );
  }
  assert.equal(distantStreak(8).lane, 0);
  assert.equal(distantStreak(37).lane, 1);
});

test("reduced-motion clock cannot reveal a timed trail", () => {
  let time = 0;
  for (let i = 0; i < 10000; i++) time = advanceAmbientTime(time, 1 / 30, true);
  assert.equal(time, 0);
  assert.equal(distantStreak(time).visible, false);
});

test("decorative motion does not mutate article coordinates or intercept picking", () => {
  const component = readFileSync(
    new URL("../src/components/AmbientSpace.jsx", import.meta.url),
    "utf8",
  );
  assert.ok(!component.includes("setState"));
  assert.ok(!component.includes("article.position"));
  assert.match(component, /raycast=\{ignoreRaycast\}/);
  const sky = readFileSync(
    new URL("../src/components/ArticleSky.jsx", import.meta.url),
    "utf8",
  );
  assert.match(
    sky,
    /advanceAmbientTime\(\s*uniforms\.uTime\.value,\s*delta,\s*paused,?\s*\)/,
  );
});
