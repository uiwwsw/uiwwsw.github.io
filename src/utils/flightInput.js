import { clamp } from "./observatory.js";

export const createFlightInput = () => ({
  looking: false,
  lookX: 0,
  lookY: 0,
  travelPitch: 0,
  dragged: false,
  interacted: false,
});
export function centerFlightInput(input) {
  input.interacted = true;
  input.lookX = 0;
  input.lookY = 0;
  input.travelPitch = 0;
}

export const PINCH_GAIN = 0.18;
const MIN_PINCH_SPAN = 40;

// Vertical touch swipes travel throughout the journey; horizontal swipes look.
// Two-finger pinch remains an optional travel input, sampled once per frame
// so two fingers translating together cannot generate alternating zoom impulses.
export function createFlightGesture(input, getViewport) {
  const pointers = new Map();
  let pinch = null;
  const span = () => {
    const [a, b] = pointers.values();
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const rebase = () => {
    pinch = null;
    for (const point of pointers.values()) {
      point.originX = point.x;
      point.originY = point.y;
      point.looking = false;
      point.mode = null;
    }
    if (pointers.size === 2) {
      const distance = span();
      pinch = { distance, active: false };
    }
  };
  return {
    pointerIds: () => [...pointers.keys()],
    start(event) {
      if (event.button !== 0) return false;
      if (pointers.has(event.pointerId)) return false;
      // Secondary touch is essential for pinch; secondary mouse/pen is not.
      if (
        event.pointerType !== "touch" &&
        (event.isPrimary === false || pointers.size)
      )
        return false;
      if (
        [...pointers.values()].some((point) => point.type !== event.pointerType)
      )
        return false;
      if (!pointers.size) input.dragged = false;
      input.travelPitch = 0;
      input.looking = true;
      pointers.set(event.pointerId, {
        id: event.pointerId,
        type: event.pointerType,
        originX: event.clientX,
        originY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        looking: false,
      });
      if (pointers.size > 1) input.dragged = true;
      rebase();
      return true;
    },
    move(event) {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return null;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (dx === 0 && dy === 0) return null;
      if (pointers.size > 1) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        return { travel: 0, kind: "pinch" };
      }
      const totalX = event.clientX - pointer.originX;
      const totalY = event.clientY - pointer.originY;
      if (!pointer.looking) {
        if (Math.hypot(totalX, totalY) < 8) return null;
        pointer.looking = true;
        pointer.mode = pointer.type === "touch" && Math.abs(totalY) >= Math.abs(totalX)
          ? "travel" : "look";
      }
      input.dragged = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      // Lock the intent for this stroke, including when crossing the opening boundary.
      // Vertical scrolling needs no layout read and must never change the view.
      if (pointer.mode === "travel") return { travel: -dy * 0.0006, kind: "travel" };
      const touch = pointer.type === "touch";
      const { width, height } = touch ? getViewport() : { width: 0, height: 0 };
      input.lookX = clamp(
        input.lookX - dx * (touch ? 72 / Math.max(width, 320) : 0.055),
        -52,
        52,
      );
      input.lookY = clamp(
        input.lookY + dy * (touch ? 56 / Math.max(height, 320) : 0.055),
        -32,
        36,
      );
      return { travel: 0, kind: "look" };
    },
    flush() {
      if (pointers.size !== 2 || !pinch) return null;
      const distance = span();
      if (distance < MIN_PINCH_SPAN || pinch.distance < MIN_PINCH_SPAN) {
        pinch = { distance, active: false };
        return null;
      }
      if (!pinch.active && Math.abs(distance - pinch.distance) < 4) return null;
      pinch.active = true;
      // Ratio gain is orientation/viewport independent and symmetric on reversal.
      // Bound malformed/low-frequency jumps; the flight integrator also caps speed.
      const travel =
        clamp(Math.log(distance / pinch.distance), -0.35, 0.35) * PINCH_GAIN;
      pinch.distance = distance;
      return { travel, kind: "pinch" };
    },
    end(event) {
      if (!pointers.delete(event.pointerId)) return;
      rebase();
      input.looking = pointers.size > 0;
      input.travelPitch = 0;
    },
    cancel() {
      if (pointers.size) input.dragged = true;
      pointers.clear();
      input.looking = false;
      pinch = null;
      input.travelPitch = 0;
    },
    wheel(event) {
      const unit =
        event.deltaMode === 1
          ? 18
          : event.deltaMode === 2
            ? Math.max(getViewport().height, 320)
            : 1;
      const dx = event.deltaX * unit;
      const dy = event.deltaY * unit;
      if (Math.abs(dx) > Math.abs(dy)) {
        input.lookX = clamp(input.lookX - clamp(dx, -180, 180) * 0.07, -52, 52);
        return { travel: 0 };
      }
      return { travel: -clamp(dy, -180, 180) * 0.00018 };
    },
  };
}

export function elasticLook(value, limit) {
  const magnitude = Math.abs(value);
  return Math.sign(value) * (Math.min(magnitude, limit) +
    (magnitude > limit ? 2 * (1 - Math.exp(-(magnitude - limit) / 8)) : 0));
}
const LOOK_LIMITS = [["lookX", 9], ["lookY", 6]];
export function relaxFlightLook(input, dt) {
  if (input.looking) return;
  const decay = Math.exp(-12 * dt);
  for (const [axis, limit] of LOOK_LIMITS) {
    const rest = clamp(input[axis], -limit, limit);
    input[axis] = rest + (input[axis] - rest) * decay;
  }
}
