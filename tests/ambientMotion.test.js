import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PerspectiveCamera, Vector3 } from "three";
import { flightPose } from "../src/utils/observatory.js";
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
  assert.equal(dustBudget(true), 480);
  assert.equal(dustBudget(false), 960);
  assert.ok(dustBudget(true) < dustBudget(false));
  for (const compact of [false, true]) {
    const field = createDustField(compact);
    assert.deepEqual(field, createDustField(compact));
    assert.equal(field.positions.length, dustBudget(compact) * 3);
    assert.equal(field.sizes.length, dustBudget(compact));
    for (let i = 0; i < field.positions.length; i++) {
      assert.ok(Number.isFinite(field.positions[i]));
      assert.ok(Math.abs(field.positions[i]) <= DUST_BOUNDS[i % 3] / 2);
      assert.ok(
        Number.isFinite(field.velocity[i]) && Math.abs(field.velocity[i]) < 1.5,
      );
    }
    assert.ok(field.sizes.every((value) => value >= 0.8 && value <= 2.7));
    assert.equal(
      field.layers.filter((value) => value === 1).length,
      dustBudget(compact) / 4,
    );
  }
});

test("distant trails are occasional, gradual and never stack or flash", () => {
  for (const time of [0, 3.49, 7, 15, 21.49])
    assert.equal(distantStreak(time).visible, false);
  assert.ok(distantStreak(4.8).visible);
  assert.ok(distantStreak(4.8).opacity > 0.6);
  for (let time = 0; time < 300; time += 0.05) {
    const state = distantStreak(time);
    assert.ok(state.opacity >= 0 && state.opacity <= 0.68);
    assert.ok(state.progress >= 0 && state.progress <= 1);
    assert.ok(
      Math.abs(state.opacity - distantStreak(time + 0.05).opacity) < 0.05,
    );
  }
  assert.equal(distantStreak(4).lane, 0);
  assert.equal(distantStreak(22).lane, 1);
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
  assert.match(component, /dustUniforms\.uOpacity\.value = 1 - focus/);
  assert.match(component, /passage\.opacity \* \(1 - focus\)/);
  const sky = readFileSync(
    new URL("../src/components/ArticleSky.jsx", import.meta.url),
    "utf8",
  );
  assert.match(
    sky,
    /advanceAmbientTime\(\s*uniforms\.uTime\.value,\s*delta,\s*paused,?\s*\)/,
  );
  assert.match(sky, /if \(inputRef\.current\.dragged \|\| focusing\) return/);
  assert.match(sky, /aria-hidden=\{focusing \|\| item\.leavingAt !== null\}/);
});

test("idle dust has visible-scale motion in both opening camera frustums", () => {
  // Projection-only regression: not a screenshot or a claim about device FPS.
  const smooth = (a, b, value) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (const compact of [true, false]) {
    const [width, height] = compact ? [390, 844] : [1440, 900];
    const camera = new PerspectiveCamera(
      compact ? 58 : 46,
      width / height,
      0.1,
      650,
    );
    camera.position.set(...flightPose(0, compact).position);
    camera.lookAt(...flightPose(0, compact).target);
    camera.updateMatrixWorld();
    const field = createDustField(compact);
    const sample = (i, time) => {
      const bounds = DUST_BOUNDS.map((v) => v * (field.layers[i] ? 0.48 : 1));
      const relative = bounds.map((bound, axis) => {
        let value =
          field.positions[i * 3 + axis] + field.velocity[i * 3 + axis] * time;
        if (axis === 1) value += Math.sin(time * 0.24 + field.phases[i]) * 0.65;
        return (
          ((((value - camera.position.getComponent(axis) + bound / 2) % bound) +
            bound) %
            bound) -
          bound / 2
        );
      });
      const edge =
        Math.max(...relative.map((v, a) => Math.abs(v / bounds[a]))) * 2;
      const alpha =
        (1 - smooth(0.65, 1, edge)) *
        smooth(4, 12, Math.hypot(...relative)) *
        (0.46 +
          field.layers[i] * 0.1 +
          0.12 * Math.sin(field.phases[i] + time * 0.4));
      const point = new Vector3(...relative)
        .add(camera.position)
        .project(camera);
      return {
        x: ((point.x + 1) * width) / 2,
        y: ((1 - point.y) * height) / 2,
        visible:
          point.z > -1 &&
          point.z < 1 &&
          Math.abs(point.x) < 1 &&
          Math.abs(point.y) < 1 &&
          alpha > 0.08,
      };
    };
    let moving = 0;
    for (let i = 0; i < field.sizes.length; i++) {
      const before = sample(i, 0),
        after = sample(i, 1);
      if (
        before.visible &&
        after.visible &&
        Math.hypot(after.x - before.x, after.y - before.y) > 2
      )
        moving++;
    }
    assert.ok(moving >= (compact ? 12 : 50), `${moving} moving dust points`);
  }
});
