import test from "node:test";
import assert from "node:assert/strict";
import {
  createFlightGesture,
  createFlightInput,
} from "../src/utils/flightInput.js";
import {
  createFlightMotion,
  queueFlightImpulse,
  resetFlightMotion,
  stepFlightMotion,
  stopFlightMotion,
  FLIGHT_SPEED,
  MAX_COAST,
} from "../src/utils/flightMotion.js";
import { SIGNAL_DISTANCE, signalStrength } from "../src/utils/secretSignal.js";
import {
  packStarLabels,
  transitionStarLabels,
} from "../src/utils/starSelection.js";

const run = (state, seconds, options = {}, fps = 60) => {
  for (let i = 0; i < seconds * fps; i++)
    stepFlightMotion(state, 1 / fps, options);
};
const wheel = (deltaY = 100, deltaMode = 0) =>
  createFlightGesture(createFlightInput(), () => ({
    width: 390,
    height: 844,
  })).wheel({ deltaX: 0, deltaY, deltaMode }).travel;

test("a wheel notch gives a small, smooth impulse instead of an immediate jump", () => {
  const state = createFlightMotion();
  queueFlightImpulse(state, wheel());
  assert.equal(state.distance, 0);
  for (let i = 0; i < 120; i++) {
    const before = state.distance;
    stepFlightMotion(state, 1 / 60);
    assert.ok(state.distance - before <= FLIGHT_SPEED / 60 + 1e-10);
  }
  assert.ok(state.distance > 0.017 && state.distance < 0.019);
  assert.equal(
    wheel(3, 1),
    wheel(54, 0),
    "line and pixel input use the same scale",
  );
  assert.ok(wheel(10000) < 0.033, "large trackpad deltas are capped");
});

test("bursty trackpad momentum cannot bank an entire trip, and reverse input brakes", () => {
  const state = createFlightMotion(0.4);
  for (let i = 0; i < 100; i++) queueFlightImpulse(state, wheel(180));
  assert.equal(state.pending, MAX_COAST);
  run(state, 0.5);
  assert.ok(state.distance <= 0.4 + FLIGHT_SPEED * 0.5 + 1e-10);
  const before = state.distance;
  queueFlightImpulse(state, -wheel());
  run(state, 0.5);
  assert.ok(state.distance < before);
  stopFlightMotion(state);
  const stopped = state.distance;
  run(state, 1);
  assert.equal(state.distance, stopped);
});

test("arrival consumes normal momentum and a lone hard push cannot find the secret", () => {
  const state = createFlightMotion(0.99);
  queueFlightImpulse(state, 999);
  run(state, 2);
  assert.equal(state.distance, 1);
  assert.equal(state.pending, 0);
  queueFlightImpulse(state, 999);
  run(state, 0.4);
  assert.ok(
    signalStrength(state.distance) > 0 && signalStrength(state.distance) < 0.08,
  );
  run(state, 4);
  assert.equal(state.distance, 1);
});

test("even maximal sustained effort takes time, then a discovered signal stays open", () => {
  const state = createFlightMotion(1);
  let revealedAt;
  for (let i = 0; i < 60 * 15; i++) {
    queueFlightImpulse(state, 999);
    stepFlightMotion(state, 1 / 60);
    if (state.distance === SIGNAL_DISTANCE) {
      revealedAt = (i + 1) / 60;
      break;
    }
  }
  assert.ok(revealedAt > 7 && revealedAt < 9, `reveal after ${revealedAt}s`);
  run(state, 20);
  assert.equal(state.distance, SIGNAL_DISTANCE);
  queueFlightImpulse(state, -0.03);
  assert.ok(state.distance < SIGNAL_DISTANCE, "reverse is never resisted");
});

test("repeated mobile pinches discover within 11–16 seconds, including finger-reset gaps", () => {
  for (const gapFrames of [24, 36, 48]) {
    const state = createFlightMotion(1);
    const gesture = createFlightGesture(createFlightInput(), () => ({
      width: 390,
      height: 844,
    }));
    const finger = (x, id = 1) => ({
      pointerId: id,
      pointerType: "touch",
      button: 0,
      clientX: x,
      clientY: 300,
    });
    let revealedAt;
    for (let frame = 0; frame < 60 * 20; frame++) {
      const phase = frame % (36 + gapFrames);
      // A 100→200px spread over 0.6s, then 0.4–0.8s to lift and reposition.
      if (phase === 0) {
        gesture.start(finger(100));
        gesture.start(finger(200, 2));
      }
      if (phase < 36) {
        gesture.move(finger(200 + (100 * (phase + 1)) / 36, 2));
        queueFlightImpulse(state, gesture.flush()?.travel || 0);
      }
      if (phase === 36) {
        gesture.end(finger(100));
        gesture.end(finger(300, 2));
      }
      stepFlightMotion(state, 1 / 60);
      if (state.distance === SIGNAL_DISTANCE) {
        revealedAt = (frame + 1) / 60;
        break;
      }
    }
    assert.equal(state.distance, SIGNAL_DISTANCE);
    assert.ok(
      revealedAt > 10 && revealedAt < 16,
      `${gapFrames / 60}s gap: ${revealedAt}s`,
    );
  }
});

test("sustained approach never rebounds; only release returns to the entry orbit", () => {
  const state = createFlightMotion(1);
  let backwardFrames = 0;
  for (let frame = 0; frame < 60 * 4; frame++) {
    queueFlightImpulse(state, 0.03);
    const before = state.distance;
    stepFlightMotion(state, 1 / 60);
    if (state.distance < before) backwardFrames++;
  }
  assert.equal(backwardFrames, 0);
  assert.ok(state.distance > 1 && state.distance < SIGNAL_DISTANCE);
  run(state, 0.85);
  const held = state.distance;
  run(state, 0.2);
  assert.ok(state.distance < held);
  run(state, 3);
  assert.equal(state.distance, 1);
});

test("a new forward gesture immediately interrupts the return instead of a forced bounce", () => {
  const state = createFlightMotion(1.25);
  run(state, 0.4);
  assert.ok(state.distance < 1.25 && state.distance > 1);
  for (let frame = 0; frame < 180; frame++) {
    const before = state.distance;
    queueFlightImpulse(state, 0.01);
    stepFlightMotion(state, 1 / 60);
    assert.ok(state.distance > before);
  }
});

test("casual scrolling and a trackpad fling cannot accidentally complete discovery", () => {
  const casual = createFlightMotion(1);
  for (let frame = 0; frame < 60 * 120; frame++) {
    if (frame % 60 === 0) queueFlightImpulse(casual, wheel());
    stepFlightMotion(casual, 1 / 60);
  }
  assert.ok(signalStrength(casual.distance) < 0.2);
  const fling = createFlightMotion(0.99);
  for (let frame = 0; frame < 60 * 6; frame++) {
    queueFlightImpulse(fling, wheel(400 * Math.exp(-frame / 30)));
    stepFlightMotion(fling, 1 / 60);
  }
  assert.ok(signalStrength(fling.distance) < 0.5);
  run(fling, 10);
  assert.equal(fling.distance, 1);
});

test("reduced motion still requires sustained effort without involuntary recoil", () => {
  const options = { reducedMotion: true };
  const state = createFlightMotion(1);
  let revealedAt;
  for (let frame = 0; frame < 60 * 70; frame++) {
    queueFlightImpulse(state, 0.03, options);
    const before = state.distance;
    stepFlightMotion(state, 1 / 60, options);
    assert.ok(state.distance >= before);
    if (state.distance === SIGNAL_DISTANCE) {
      revealedAt = (frame + 1) / 60;
      break;
    }
  }
  assert.ok(
    revealedAt > 7 && revealedAt < 9,
    `quiet discovery after ${revealedAt}s`,
  );
});

test("secret effort remains consistent at 30, 60 and 120 Hz", () => {
  const timings = [30, 60, 120].map((fps) => {
    const state = createFlightMotion(1);
    for (let frame = 0; frame < fps * 70; frame++) {
      queueFlightImpulse(state, 0.16 / fps);
      stepFlightMotion(state, 1 / fps);
      if (state.distance === SIGNAL_DISTANCE) return (frame + 1) / fps;
    }
    assert.fail("unreachable at " + fps);
  });
  assert.ok(Math.max(...timings) - Math.min(...timings) < 0.4, String(timings));
});

test("deliberate wheel and equivalent trackpad input reveal in 10–12 seconds", () => {
  const times = [6, 30, 60, 120].map((eventsPerSecond) => {
    const state = createFlightMotion(1);
    for (let frame = 0; frame < 120 * 16; frame++) {
      if (frame % (120 / eventsPerSecond) === 0)
        queueFlightImpulse(state, wheel(720 / eventsPerSecond));
      stepFlightMotion(state, 1 / 120);
      if (state.distance === SIGNAL_DISTANCE) return (frame + 1) / 120;
    }
    assert.fail(`unreachable with ${eventsPerSecond} events/s`);
  });
  assert.ok(
    times.every((time) => time > 10 && time < 12),
    String(times),
  );
  assert.ok(Math.max(...times) - Math.min(...times) < 0.15, String(times));
});

test("reduced motion keeps manual access and resets on release without zoom-out animation", () => {
  const options = { reducedMotion: true };
  const state = createFlightMotion();
  queueFlightImpulse(state, wheel(), options);
  assert.equal(state.distance, wheel());
  run(state, 2, options);
  assert.equal(state.distance, wheel());
  resetFlightMotion(state, 1.2);
  run(state, 5, options);
  assert.equal(state.distance, 1);
  queueFlightImpulse(state, 0.05, options);
  run(state, 0.3, options);
  assert.ok(state.distance > 1);
  run(state, 0.7, options);
  assert.equal(state.distance, 1);
});

test("flight pace is frame-rate independent and hidden-tab-sized deltas do not jump", () => {
  const distances = [30, 60, 120].map((fps) => {
    const state = createFlightMotion(0.2);
    queueFlightImpulse(state, 0.09);
    run(state, 1, {}, fps);
    return state.distance;
  });
  assert.ok(Math.max(...distances) - Math.min(...distances) < 0.001);
  const state = createFlightMotion(0.2);
  queueFlightImpulse(state, 0.09);
  stepFlightMotion(state, 50);
  assert.ok(state.distance <= 0.2 + FLIGHT_SPEED * 0.05);
  const before = state.distance;
  stepFlightMotion(state, NaN);
  queueFlightImpulse(state, Infinity);
  assert.equal(state.distance, before);
});

test("normal cruise feels consistent for wheel bursts and continuous trackpad delivery", () => {
  const distances = [6, 30, 60, 120].map((eventsPerSecond) => {
    const state = createFlightMotion(0.1);
    for (let frame = 0; frame < 120 * 6; frame++) {
      if (frame % (120 / eventsPerSecond) === 0)
        queueFlightImpulse(state, wheel(360 / eventsPerSecond));
      stepFlightMotion(state, 1 / 120);
    }
    run(state, 2);
    return state.distance;
  });
  assert.ok(
    Math.max(...distances) - Math.min(...distances) < 0.001,
    String(distances),
  );
  assert.ok(Math.abs(distances[0] - (0.1 + 6 * 360 * 0.00018)) < 0.001);
});

test("pausing flushes hidden pressure; reverse and an explicit reset always escape", () => {
  const state = createFlightMotion(1.1);
  queueFlightImpulse(state, 0.1);
  stopFlightMotion(state);
  run(state, 0.5);
  assert.equal(state.distance, 1.1);
  queueFlightImpulse(state, -0.03);
  assert.ok(state.distance < 1.1);
  resetFlightMotion(state, 0.2);
  run(state, 10);
  assert.equal(state.distance, 0.2);
});

test("programmatic travel clears inertia and non-home sectors cannot enter the signal", () => {
  const state = createFlightMotion(0.5);
  queueFlightImpulse(state, 0.09);
  resetFlightMotion(state, 0.25);
  run(state, 2);
  assert.equal(state.distance, 0.25);
  resetFlightMotion(state, 1);
  for (let i = 0; i < 300; i++) {
    queueFlightImpulse(state, 0.1, { allowSignal: false });
    stepFlightMotion(state, 1 / 60, { allowSignal: false });
  }
  assert.equal(state.distance, 1);
});

test("readable labels retain priority instead of reshuffling with nearest-star order", () => {
  const a = { id: "reading", x: 600, y: 300 };
  const b = { id: "new-nearest", x: 620, y: 300 };
  assert.deepEqual(
    packStarLabels([b, a], 1280, 720, false, undefined, [a.id]).map(
      (item) => item.id,
    ),
    [a.id],
  );
  assert.deepEqual(
    packStarLabels([b], 1280, 720, false, undefined, [a.id]).map(
      (item) => item.id,
    ),
    [b.id],
  );
});

test("labels fade out before replacements and never exceed the existing DOM budget", () => {
  const old = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const desired = [{ id: "a" }, { id: "d" }, { id: "e" }];
  const initial = transitionStarLabels([], old, 0);
  const fading = transitionStarLabels(initial, desired, 1);
  assert.equal(fading.length, 3);
  assert.equal(fading[1].leavingAt, 1);
  assert.deepEqual(transitionStarLabels(fading, desired, 1.2), fading);
  assert.deepEqual(
    transitionStarLabels(fading, desired, 1.5).map((item) => item.id),
    ["a", "d", "e"],
  );
  assert.deepEqual(transitionStarLabels(fading, [], 1.1, true), []);
  assert.equal(
    transitionStarLabels(fading, old, 1.2)[1].leavingAt,
    null,
    "reversing can retain a fading label",
  );
});
