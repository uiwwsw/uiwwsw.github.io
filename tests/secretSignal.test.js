import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceFlight,
  releaseSignal,
  signalStrength,
  signalFlightPose,
  SIGNAL_DISTANCE,
  EARTH_FOCUS_ALTITUDE,
  earthFocusBlend,
  earthFocusFov,
} from "../src/utils/secretSignal.js";
import {
  earthPosition,
  EARTH_RADIUS,
  flightPose,
} from "../src/utils/observatory.js";
import {
  createFlightGesture,
  createFlightInput,
} from "../src/utils/flightInput.js";

test("the signal stays hidden through normal travel and needs further input after arrival", () => {
  for (const distance of [0, 0.5, 0.99, 1])
    assert.equal(signalStrength(distance), 0);
  assert.equal(advanceFlight(0.99, 10), 1);
  assert.ok(signalStrength(advanceFlight(1, 0.08)) > 0);
  assert.ok(
    advanceFlight(1, 10) < 1.04,
    "one oversized impulse cannot reveal it",
  );
  assert.equal(signalStrength(SIGNAL_DISTANCE), 1);
});

test("signal progress is bounded, reversible and can be rediscovered", () => {
  assert.equal(advanceFlight(0, -1), 0);
  assert.equal(advanceFlight(SIGNAL_DISTANCE, 100), SIGNAL_DISTANCE);
  assert.equal(advanceFlight(0.5, NaN), 0.5);
  assert.ok(signalStrength(advanceFlight(SIGNAL_DISTANCE, -0.08)) < 1);
  assert.equal(signalStrength(advanceFlight(SIGNAL_DISTANCE, -1)), 0);
  let distance = 1;
  for (let i = 0; i < 100; i++) distance = advanceFlight(distance, 0.11);
  assert.equal(signalStrength(distance), 1);
});

test("ordinary wheel and pinch press only a little into the field; dragging never does", () => {
  const gesture = createFlightGesture(createFlightInput(), () => ({
    width: 390,
    height: 844,
  }));
  let distance = 1;
  for (let i = 0; i < 4; i++)
    distance = advanceFlight(
      distance,
      gesture.wheel({ deltaX: 0, deltaY: 180, deltaMode: 0 }).travel,
    );
  assert.ok(signalStrength(distance) > 0 && signalStrength(distance) < 0.15);
  const touch = (x, y, pointerId = 1) => ({
    pointerId,
    pointerType: "touch",
    button: 0,
    clientX: x,
    clientY: y,
  });
  gesture.start(touch(180, 350));
  assert.equal(gesture.move(touch(180, 600)).travel, 0);
  gesture.start(touch(280, 600, 2));
  gesture.move(touch(310, 600, 2));
  const touchSignal = signalStrength(advanceFlight(1, gesture.flush().travel));
  assert.ok(touchSignal > 0 && touchSignal < 0.1);
  gesture.end(touch(180, 600));
  gesture.end(touch(310, 600, 2));
  gesture.start(touch(300, 450));
  assert.equal(
    signalStrength(advanceFlight(1, gesture.move(touch(100, 450)).travel)),
    0,
  );
});

test("resistance grows toward the signal and release pushes back without losing a discovery", () => {
  const early = advanceFlight(1.02, 0.03) - 1.02;
  const late = advanceFlight(1.3, 0.03) - 1.3;
  assert.ok(late < early / 3);
  assert.ok(releaseSignal(1.2, 1) < 1.2);
  assert.equal(releaseSignal(1.001, 10), 1);
  assert.equal(releaseSignal(0.8, 1), 0.8);
  assert.equal(releaseSignal(SIGNAL_DISTANCE, 100), SIGNAL_DISTANCE);
});

test("the extra approach preserves the main route and stays safely outside Earth", () => {
  for (const compact of [false, true]) {
    for (let step = 0; step <= 10; step++) {
      const progress = step / 10;
      assert.deepEqual(
        signalFlightPose(progress, 0, compact),
        flightPose(progress, compact),
      );
      const { position, target } = signalFlightPose(1, progress, compact);
      const earth = earthPosition(compact);
      assert.ok([...position, ...target].every(Number.isFinite));
      assert.ok(
        Math.hypot(...position.map((value, i) => value - earth[i])) >
          EARTH_RADIUS + EARTH_FOCUS_ALTITUDE - 1e-10,
      );
      if (progress === 1) {
        const separation = Math.hypot(
          ...position.map((value, i) => value - earth[i]),
        );
        assert.ok(
          Math.abs(separation - (EARTH_RADIUS + EARTH_FOCUS_ALTITUDE)) < 1e-10,
        );
        assert.ok(
          Math.abs(
            Math.hypot(...target.map((value, i) => value - earth[i])) -
              EARTH_RADIUS,
          ) < 1e-10,
        );
      }
    }
  }
});

test("Earth-only presentation engages only beyond normal flight and reverses continuously", () => {
  assert.equal(earthFocusBlend(0), 0);
  assert.equal(earthFocusBlend(0.24), 1);
  assert.equal(earthFocusBlend(1), 1);
  for (const compact of [false, true]) {
    assert.equal(earthFocusFov(0, compact), compact ? 58 : 46);
    assert.equal(earthFocusFov(1, compact), compact ? 38 : 32);
    const initial = flightPose(1, compact);
    const tiny = signalFlightPose(1, 0.00001, compact);
    assert.ok(
      Math.hypot(...tiny.position.map((v, i) => v - initial.position[i])) <
        0.002,
    );
    let separation = Infinity;
    for (let step = 0; step <= 100; step++) {
      const pose = signalFlightPose(1, step / 100, compact);
      const distance = Math.hypot(
        ...pose.position.map((v, i) => v - earthPosition(compact)[i]),
      );
      assert.ok(distance <= separation + 1e-10);
      separation = distance;
    }
  }
});

test("release recovery is frame-rate independent and ends exactly at the first Earth scale", () => {
  const values = [30, 60, 120].map((fps) => {
    let distance = 1.31;
    for (let i = 0; i < fps; i++) distance = releaseSignal(distance, 1 / fps);
    return distance;
  });
  assert.ok(Math.max(...values) - Math.min(...values) < 1e-10);
  assert.equal(releaseSignal(1.31, 4), 1);
  for (const dt of [0, -1, NaN, Infinity])
    assert.equal(releaseSignal(1.2, dt), 1.2);
});
