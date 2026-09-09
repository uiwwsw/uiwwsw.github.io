import test from "node:test";
import assert from "node:assert/strict";
import {
  createFlightInput,
  createFlightGesture,
  centerFlightInput,
  PINCH_GAIN,
} from "../src/utils/flightInput.js";

const touch = (x, y, props = {}) => ({
  pointerId: 1,
  pointerType: "touch",
  isPrimary: true,
  button: 0,
  clientX: x,
  clientY: y,
  ...props,
});
function setup() {
  const input = createFlightInput();
  return {
    input,
    gesture: createFlightGesture(input, () => ({ width: 390, height: 844 })),
  };
}

test("a horizontal mobile swipe changes the view without advancing the flight", () => {
  const { input, gesture } = setup();
  gesture.start(touch(310, 410));
  assert.equal(gesture.move(touch(180, 414)).travel, 0);
  assert.ok(input.lookX > 20);
  assert.ok(input.lookY > 0, "looking is free on both axes");
  assert.equal(
    gesture.move(touch(170, 480)).travel,
    0,
    "a look gesture never changes into travel despite vertical drift",
  );
  assert.ok(input.lookY > 4);
  assert.equal(input.dragged, true);
});

test("vertical touch only looks, even with lateral drift", () => {
  const { input, gesture } = setup();
  gesture.start(touch(180, 520));
  assert.equal(gesture.move(touch(185, 330)).travel, 0);
  assert.ok(input.lookY < 0);
  assert.equal(gesture.move(touch(260, 400)).travel, 0);
  assert.ok(input.lookX < 0);
});

test("repeated up/down drags never request travel or travel pitch", () => {
  const { input, gesture } = setup();
  for (let stroke = 0; stroke < 20; stroke++) {
    gesture.start(touch(180, 200));
    assert.equal(gesture.move(touch(180, 500)).travel, 0);
    assert.equal(input.travelPitch, 0);
    assert.ok(input.lookY > 0);
    gesture.end(touch(180, 500));
    assert.equal(input.travelPitch, 0);
  }
  gesture.start(touch(180, 500));
  assert.equal(gesture.move(touch(180, 200)).travel, 0);
  assert.equal(input.travelPitch, 0);
  gesture.cancel();
  assert.equal(input.travelPitch, 0);
});

test("diagonal gestures look vertically without flight and pitch has generous safe bounds", () => {
  const { input, gesture } = setup();
  gesture.start(touch(100, 100));
  assert.equal(gesture.move(touch(220, 230)).travel, 0);
  assert.ok(input.lookX < 0 && input.lookY > 8);
  assert.equal(gesture.move(touch(220, 2000)).travel, 0);
  assert.equal(input.lookY, 36);
  gesture.move(touch(220, -2000));
  assert.equal(input.lookY, -32);
  centerFlightInput(input);
  assert.equal(input.lookY, 0);
});

test("pinch ratio gain is equal across orientation, phones and event rates", () => {
  const samples = [];
  for (const height of [390, 640, 844, 960]) {
    for (const events of [6, 30, 120]) {
      const gesture = createFlightGesture(createFlightInput(), () => ({
        width: 390,
        height,
      }));
      gesture.start(touch(100, 100));
      gesture.start(touch(200, 100, { pointerId: 2, isPrimary: false }));
      let total = 0;
      for (let step = 1; step <= events; step++) {
        gesture.move(touch(200 + (100 * step) / events, 100, { pointerId: 2 }));
        total += gesture.flush()?.travel || 0;
      }
      samples.push(total);
    }
  }
  for (const total of samples)
    assert.ok(Math.abs(total - Math.log(2) * PINCH_GAIN) < 1e-10);
});

test("a wheel notch and the same pixels split into trackpad events request the same distance", () => {
  const { gesture } = setup();
  const sample = (deltaY) =>
    gesture.wheel({ deltaX: 0, deltaY, deltaMode: 0 }).travel;
  assert.ok(Math.abs(sample(120) - 12 * sample(10)) < 1e-10);
  assert.equal(
    sample(54),
    gesture.wheel({ deltaX: 0, deltaY: 3, deltaMode: 1 }).travel,
  );
});

test("small taps remain clickable while gradual drags accumulate beyond the threshold", () => {
  const { input, gesture } = setup();
  gesture.start(touch(100, 100));
  assert.equal(gesture.move(touch(103, 102)), null);
  assert.equal(input.dragged, false);
  assert.equal(gesture.move(touch(106, 102)), null);
  assert.notEqual(gesture.move(touch(110, 102)), null);
  assert.equal(input.dragged, true);
  gesture.end(touch(110, 102));
  assert.equal(gesture.move(touch(190, 102)), null);
  gesture.start(touch(200, 200));
  gesture.end(touch(200, 200));
  assert.equal(
    input.dragged,
    false,
    "the next real tap must not be suppressed",
  );
});

test("pinch accepts a non-primary second finger without changing the look", () => {
  const { input, gesture } = setup();
  gesture.start(touch(100, 100));
  gesture.start(touch(200, 100, { pointerId: 2, isPrimary: false }));
  assert.equal(gesture.move(touch(80, 100)).travel, 0);
  assert.ok(gesture.flush().travel > 0);
  assert.equal(input.lookX, 0);
  assert.equal(input.lookY, 0);
  gesture.cancel();
  assert.equal(gesture.move(touch(300, 100)), null);
  assert.equal(gesture.flush(), null);
});

test("spreading approaches and closing retreats symmetrically on both axes", () => {
  for (const vertical of [false, true]) {
    const { gesture } = setup();
    const second = (distance) =>
      touch(vertical ? 100 : 100 + distance, vertical ? 100 + distance : 100, {
        pointerId: 2,
      });
    gesture.start(touch(100, 100));
    gesture.start(second(120));
    gesture.move(second(160));
    const forward = gesture.flush().travel;
    gesture.move(second(120));
    const backward = gesture.flush().travel;
    assert.ok(forward > 0 && backward < 0);
    assert.ok(Math.abs(forward + backward) < 1e-10);
  }
});

test("two fingers moving together do not zoom or rotate, including sequential events", () => {
  const { input, gesture } = setup();
  gesture.start(touch(100, 100));
  gesture.start(touch(200, 100, { pointerId: 2 }));
  for (let offset = 10; offset <= 100; offset += 10) {
    gesture.move(touch(100 + offset, 100 + offset));
    gesture.move(touch(200 + offset, 100 + offset, { pointerId: 2 }));
    assert.equal(gesture.flush()?.travel || 0, 0);
  }
  assert.equal(input.lookX, 0);
  assert.equal(input.lookY, 0);
});

test("pinch-to-drag and finger replacement rebase without jumps or unwanted taps", () => {
  const { input, gesture } = setup();
  gesture.start(touch(100, 100));
  gesture.start(touch(200, 100, { pointerId: 2 }));
  gesture.move(touch(230, 100, { pointerId: 2 }));
  assert.ok(gesture.flush().travel > 0);
  gesture.end(touch(100, 100));
  assert.equal(gesture.move(touch(232, 100, { pointerId: 2 })), null);
  assert.equal(input.lookX, 0);
  assert.equal(gesture.move(touch(250, 100, { pointerId: 2 })).kind, "look");
  const look = input.lookX;
  gesture.start(touch(80, 100, { pointerId: 3, isPrimary: false }));
  assert.equal(gesture.flush(), null);
  assert.equal(input.lookX, look);
  gesture.end(touch(250, 100, { pointerId: 2 }));
  gesture.end(touch(80, 100, { pointerId: 3 }));
  assert.equal(input.dragged, true);
  gesture.start(touch(150, 150, { pointerId: 4 }));
  assert.equal(input.dragged, false);
});

test("a third finger pauses pinch and safely rebases whichever pair remains", () => {
  const { input, gesture } = setup();
  gesture.start(touch(100, 100));
  gesture.start(touch(200, 100, { pointerId: 2 }));
  gesture.start(touch(300, 100, { pointerId: 3 }));
  gesture.move(touch(400, 100, { pointerId: 3 }));
  assert.equal(gesture.flush(), null);
  gesture.end(touch(200, 100, { pointerId: 2 }));
  assert.equal(gesture.flush(), null);
  gesture.move(touch(440, 100, { pointerId: 3 }));
  assert.ok(gesture.flush().travel > 0);
  assert.equal(input.lookX, 0);
});

test("tiny spans, initial jitter and extreme pinch samples cannot cause runaway zoom", () => {
  const { gesture } = setup();
  gesture.start(touch(100, 100));
  gesture.start(touch(101, 100, { pointerId: 2 }));
  gesture.move(touch(120, 100, { pointerId: 2 }));
  assert.equal(gesture.flush(), null);
  gesture.move(touch(200, 100, { pointerId: 2 }));
  assert.equal(gesture.flush(), null);
  gesture.move(touch(202, 100, { pointerId: 2 }));
  assert.equal(gesture.flush(), null);
  gesture.move(touch(10000, 100, { pointerId: 2 }));
  assert.equal(gesture.flush().travel, 0.35 * PINCH_GAIN);
  assert.equal(gesture.flush().travel, 0);
});

test("desktop dragging still moves both look axes and trackpad sideways scroll pans", () => {
  const { input, gesture } = setup();
  gesture.start(touch(100, 100, { pointerType: "mouse" }));
  assert.equal(gesture.move(touch(200, 180)).travel, 0);
  assert.ok(input.lookX < 0 && input.lookY > 0);
  const before = input.lookX;
  assert.equal(
    gesture.wheel({ deltaX: 120, deltaY: 4, deltaMode: 0 }).travel,
    0,
  );
  assert.ok(input.lookX < before);
  assert.ok(gesture.wheel({ deltaX: 3, deltaY: 60, deltaMode: 0 }).travel > 0);
});

test("look bounds and centering work even before leaving the Moon", () => {
  const { input, gesture } = setup();
  gesture.start(touch(0, 100));
  gesture.move(touch(-10000, 100));
  assert.equal(input.lookX, 52);
  centerFlightInput(input);
  assert.equal(input.lookX, 0);
  assert.equal(input.lookY, 0);
});
