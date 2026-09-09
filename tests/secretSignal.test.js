import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceFlight,
  releaseSignal,
  signalStrength,
  signalFlightPose,
  SIGNAL_DISTANCE,
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

test("ordinary wheel and touch gestures press only a little into the field", () => {
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
  const touch = (x, y) => ({
    pointerId: 1,
    pointerType: "touch",
    button: 0,
    clientX: x,
    clientY: y,
  });
  gesture.start(touch(180, 350));
  const touchSignal = signalStrength(
    advanceFlight(1, gesture.move(touch(180, 600)).travel),
  );
  assert.ok(touchSignal > 0 && touchSignal < 0.1);
  gesture.end(touch(180, 600));
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
          EARTH_RADIUS + 5,
      );
      if (progress === 1) {
        const separation = Math.hypot(
          ...position.map((value, i) => value - earth[i]),
        );
        assert.ok(Math.abs(separation - (EARTH_RADIUS + 5.5)) < 1e-10);
        assert.deepEqual(target, earth);
      }
    }
  }
});
