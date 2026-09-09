import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bindFlightSurface } from "../src/utils/flightSurface.js";
import { createFlightInput } from "../src/utils/flightInput.js";
import {
  createFlightMotion,
  queueFlightImpulse,
  stepFlightMotion,
  stopFlightMotion,
} from "../src/utils/flightMotion.js";

function emitter() {
  const listeners = new Map();
  return {
    listeners,
    closest: () => null,
    addEventListener(name, fn) {
      listeners.set(name, fn);
    },
    removeEventListener(name, fn) {
      if (listeners.get(name) === fn) listeners.delete(name);
    },
    emit(name, data = {}) {
      const event = {
        target: this,
        detail: 1,
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
        stopPropagation() {
          this.stopped = true;
        },
        ...data,
      };
      listeners.get(name)?.(event);
      return event;
    },
  };
}
function setup() {
  const surface = emitter();
  const host = emitter();
  const frames = new Map();
  const captured = new Set();
  let nextFrame = 0;
  surface.getBoundingClientRect = () => ({ width: 390, height: 844 });
  surface.setPointerCapture = (id) => captured.add(id);
  surface.hasPointerCapture = (id) => captured.has(id);
  surface.releasePointerCapture = (id) => {
    captured.delete(id);
    surface.emit("lostpointercapture", { pointerId: id });
  };
  host.requestAnimationFrame = (fn) => {
    frames.set(++nextFrame, fn);
    return nextFrame;
  };
  host.cancelAnimationFrame = (id) => frames.delete(id);
  const tick = () => {
    for (const [id, fn] of [...frames]) {
      frames.delete(id);
      fn();
    }
  };
  const input = createFlightInput();
  const motion = createFlightMotion(0.3);
  const impulses = [];
  let manual = 0;
  const cleanup = bindFlightSurface({
    surface,
    host,
    input,
    onTravel(delta) {
      impulses.push(delta);
      queueFlightImpulse(motion, delta);
    },
    onManualInput() {
      manual++;
    },
    onLook() {
      stopFlightMotion(motion);
    },
  });
  const pointer = (name, x, y, id = 1, target = surface) =>
    surface.emit(name, {
      clientX: x,
      clientY: y,
      pointerId: id,
      pointerType: "touch",
      button: 0,
      isPrimary: id === 1,
      target,
    });
  return {
    surface,
    host,
    input,
    motion,
    impulses,
    captured,
    frames,
    pointer,
    tick,
    cleanup,
    manual: () => manual,
  };
}

test("surface drag stops prior zoom coast, leaves travel unchanged and suppresses only its click", () => {
  const s = setup();
  queueFlightImpulse(s.motion, 0.04);
  const label = { closest: () => null }; // star-label intentionally isn't a control
  s.pointer("pointerdown", 200, 200, 1, label);
  assert.equal(s.captured.size, 0, "a tap isn't forcibly captured");
  s.pointer("pointermove", 200, 450, 1, label);
  assert.ok(s.input.lookY > 0);
  assert.equal(s.motion.pending, 0);
  stepFlightMotion(s.motion, 1 / 60);
  assert.equal(s.motion.distance, 0.3);
  s.pointer("pointerup", 200, 450);
  assert.equal(
    s.surface.emit("click", { target: label }).defaultPrevented,
    true,
  );
  assert.equal(
    s.surface.emit("click", { target: label, detail: 0 }).defaultPrevented,
    false,
  );
  s.pointer("pointerdown", 100, 100, 2, label);
  s.pointer("pointerup", 100, 100, 2, label);
  assert.equal(
    s.surface.emit("click", { target: label }).defaultPrevented,
    false,
  );
  assert.equal(s.impulses.length, 0);
  s.cleanup();
});

test("two-pointer capture and one RAF batch prevent zoom from pure two-finger panning", () => {
  const s = setup();
  s.pointer("pointerdown", 100, 200);
  s.pointer("pointerdown", 200, 200, 2);
  assert.deepEqual([...s.captured], [1, 2]);
  s.surface.emit("lostpointercapture", {
    target: { closest: () => null },
    pointerId: 1,
  });
  s.pointer("pointermove", 120, 230);
  s.pointer("pointermove", 220, 230, 2);
  assert.equal(s.frames.size, 1);
  s.tick();
  assert.deepEqual(s.impulses, []);
  s.pointer("pointermove", 110, 230);
  s.pointer("pointermove", 240, 230, 2);
  s.tick();
  assert.equal(s.impulses.length, 1);
  assert.ok(s.impulses[0] > 0);
  assert.equal(s.input.lookX, 0);
  assert.equal(s.input.lookY, 0);
  s.pointer("pointerup", 110, 230);
  assert.deepEqual(
    [...s.captured],
    [2],
    "ending one pointer must not cancel the remaining finger",
  );
  s.pointer("pointermove", 240, 231, 2);
  assert.equal(s.input.lookY, 0);
  s.pointer("pointermove", 240, 251, 2);
  assert.ok(s.input.lookY > 0);
  s.pointer("pointerup", 240, 251, 2);
  assert.equal(s.captured.size, 0);
  s.cleanup();
});

test("release flushes the last pinch sample once, never as a late zoom or article click", () => {
  const s = setup();
  s.pointer("pointerdown", 100, 200);
  s.pointer("pointerdown", 200, 200, 2);
  s.pointer("pointermove", 230, 200, 2);
  s.pointer("pointerup", 230, 200, 2);
  assert.equal(s.impulses.length, 1);
  assert.equal(s.frames.size, 0);
  s.tick();
  assert.equal(s.impulses.length, 1);
  s.pointer("pointerup", 100, 200);
  assert.equal(s.surface.emit("click").defaultPrevented, true);
  s.cleanup();
});

test("OS cancellation, focus loss, unexpected capture loss and unmount discard pending pinch", () => {
  for (const reason of [
    "pointercancel",
    "blur",
    "lostpointercapture",
    "unmount",
  ]) {
    const s = setup();
    s.pointer("pointerdown", 100, 200);
    s.pointer("pointerdown", 200, 200, 2);
    s.pointer("pointermove", 230, 200, 2);
    queueFlightImpulse(s.motion, 0.04);
    if (reason === "unmount") s.cleanup();
    else if (reason === "blur") s.host.emit("blur");
    else s.surface.emit(reason, { pointerId: 2 });
    assert.equal(s.frames.size, 0, reason);
    assert.equal(s.captured.size, 0, reason);
    assert.equal(s.motion.pending, 0, reason);
    s.tick();
    s.pointer("pointermove", 330, 200, 2);
    assert.deepEqual(s.impulses, [], reason);
    s.cleanup();
    assert.equal(s.surface.listeners.size, 0);
    assert.equal(s.host.listeners.size, 0);
  }
});

test("controls, native browser zoom and desktop wheel keep their own behavior", () => {
  const s = setup();
  const control = { closest: () => ({}) };
  s.pointer("pointerdown", 100, 100, 1, control);
  s.pointer("pointermove", 100, 300, 1, control);
  assert.equal(s.input.lookY, 0);
  const wheel = { deltaX: 0, deltaY: 100, deltaMode: 0 };
  assert.equal(
    s.surface.emit("wheel", { ...wheel, target: control }).defaultPrevented,
    false,
  );
  assert.equal(
    s.surface.emit("wheel", { ...wheel, ctrlKey: true }).defaultPrevented,
    false,
  );
  assert.equal(s.manual(), 0);
  assert.equal(s.surface.emit("wheel", wheel).defaultPrevented, true);
  assert.deepEqual(s.impulses, [0.018000000000000002]);
  s.input.dragged = true;
  assert.equal(
    s.surface.emit("click", { target: control }).defaultPrevented,
    false,
  );
  s.cleanup();
});

test("custom pinch is scoped to the sky; reading and controls retain native zoom", () => {
  const css = readFileSync(
    new URL("../src/index.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /\.observatory\s*\{\s*touch-action: auto/);
  assert.match(css, /\.universe-canvas\s*\{[^}]*touch-action: none/);
  assert.match(css, /\.star-label\s*\{\s*touch-action: none/);
  assert.match(css, /\.panel\s*\{\s*touch-action: pan-y pinch-zoom/);
  assert.match(css, /\.intro\s*\{\s*pointer-events: none/);
  assert.match(css, /\.journey-button\s*\{\s*pointer-events: auto/);
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /두 손가락을 벌리면 다가가고 오므리면 멀어집니다/);
  assert.match(app, /onLook: stopTravel/);
  assert.doesNotMatch(app, /아래로 끌어 다가가기|가로·대각선 · 시선/);
  const html = readFileSync(
    new URL("../src/index.html", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
});
