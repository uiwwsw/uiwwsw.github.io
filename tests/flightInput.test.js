import test from "node:test";
import assert from "node:assert/strict";
import {
  createFlightInput,
  createFlightGesture,
  centerFlightInput,
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
  assert.equal(input.lookY, 0);
  assert.equal(
    gesture.move(touch(170, 480)).travel,
    0,
    "the horizontal axis stays locked despite vertical drift",
  );
  assert.equal(input.dragged, true);
});

test("vertical touch travel is independent of left/right finger drift", () => {
  const { input, gesture } = setup();
  gesture.start(touch(180, 520));
  assert.ok(gesture.move(touch(185, 330)).travel > 0);
  assert.equal(input.lookX, 0);
  assert.ok(gesture.move(touch(260, 400)).travel < 0);
  assert.equal(input.lookX, 0);
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

test("pinch and cancelled gestures cannot leave the camera dragging", () => {
  const { input, gesture } = setup();
  gesture.start(touch(100, 100));
  gesture.start(touch(200, 100, { pointerId: 2, isPrimary: false }));
  assert.equal(gesture.move(touch(300, 100)), null);
  assert.equal(input.lookX, 0);
  gesture.start(touch(100, 100));
  gesture.cancel();
  assert.equal(gesture.move(touch(300, 100)), null);
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
