import { clamp } from "./observatory.js";

export const createFlightInput = () => ({
  lookX: 0,
  lookY: 0,
  travelPitch: 0,
  dragged: false,
});
export function centerFlightInput(input) {
  input.lookX = 0;
  input.lookY = 0;
  input.travelPitch = 0;
}

// Lock only the gesture's intent, not its viewing axes. A diagonal/look gesture
// stays free to pan vertically without accidentally becoming forward travel.
export function createFlightGesture(input, getViewport) {
  let pointer = null;
  return {
    start(event) {
      input.dragged = false;
      input.travelPitch = 0;
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
            ? Math.abs(totalY) > Math.abs(totalX) * 1.25
              ? "vertical"
              : "free"
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
      if (pointer.axis === "free") {
        const sensitivity =
          pointer.type === "touch" ? 56 / Math.max(height, 320) : 0.055;
        input.lookY = clamp(input.lookY + dy * sensitivity, -32, 36);
      } else {
        // A small flight lean follows the finger, then returns on release.
        // Repeated forward strokes never accumulate a view pointed off-world.
        input.travelPitch = clamp(
          input.travelPitch + (dy * 14) / Math.max(height, 320),
          -5,
          5,
        );
      }
      return {
        travel:
          pointer.axis === "vertical" ? (dy * 0.3) / Math.max(height, 320) : 0,
      };
    },
    end(event) {
      if (pointer?.id === event.pointerId) {
        pointer = null;
        input.travelPitch = 0;
      }
    },
    cancel() {
      if (pointer) input.dragged = true;
      pointer = null;
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
      return { travel: clamp(dy, -180, 180) * 0.00018 };
    },
  };
}
