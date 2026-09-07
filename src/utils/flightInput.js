import { clamp } from "./observatory.js";

export const createFlightInput = () => ({ lookX: 0, lookY: 0, dragged: false });
export function centerFlightInput(input) {
  input.lookX = 0;
  input.lookY = 0;
}

// One gesture owns both axes. Lock touch gestures after a small tap tolerance,
// so a horizontal swipe never also advances the flight because of finger jitter.
export function createFlightGesture(input, getViewport) {
  let pointer = null;
  return {
    start(event) {
      input.dragged = false;
      if (event.isPrimary === false) {
        pointer = null;
        input.dragged = true;
        return false;
      }
      if (event.button !== 0) return false;
      pointer = {
        id: event.pointerId,
        type: event.pointerType,
        originX: event.clientX,
        originY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        axis: null,
      };
      return true;
    },
    move(event) {
      if (!pointer || pointer.id !== event.pointerId) return null;
      const totalX = event.clientX - pointer.originX;
      const totalY = event.clientY - pointer.originY;
      if (!pointer.axis) {
        if (Math.hypot(totalX, totalY) < 8) return null;
        pointer.axis =
          pointer.type === "touch"
            ? Math.abs(totalX) > Math.abs(totalY)
              ? "horizontal"
              : "vertical"
            : "free";
      }
      input.dragged = true;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const { width, height } = getViewport();
      if (pointer.axis !== "vertical") {
        const sensitivity =
          pointer.type === "touch" ? 72 / Math.max(width, 320) : 0.055;
        input.lookX = clamp(input.lookX - dx * sensitivity, -52, 52);
      }
      if (pointer.axis === "free")
        input.lookY = clamp(input.lookY + dy * 0.04, -16, 20);
      return {
        travel:
          pointer.axis === "vertical"
            ? (-dy * 1.35) / Math.max(height, 320)
            : 0,
      };
    },
    end(event) {
      if (pointer?.id === event.pointerId) pointer = null;
    },
    cancel() {
      if (pointer) input.dragged = true;
      pointer = null;
    },
    wheel(event) {
      const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 700 : 1;
      const dx = event.deltaX * unit;
      const dy = event.deltaY * unit;
      if (Math.abs(dx) > Math.abs(dy)) {
        input.lookX = clamp(input.lookX - clamp(dx, -180, 180) * 0.07, -52, 52);
        return { travel: 0 };
      }
      return { travel: clamp(dy, -180, 180) * 0.00045 };
    },
  };
}
