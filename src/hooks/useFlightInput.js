import { useEffect } from "react";
import { createFlightGesture } from "../utils/flightInput.js";

function isControl(target) {
  return !!target.closest(
    'a, input, select, textarea, button:not(.star-label), dialog, summary, label, [contenteditable="true"]',
  );
}

export function useFlightInput({
  surfaceRef,
  inputRef,
  enabled,
  onTravel,
  onManualInput,
}) {
  useEffect(() => {
    if (!enabled) return;
    const surface = surfaceRef.current;
    const gesture = createFlightGesture(inputRef.current, () =>
      surface.getBoundingClientRect(),
    );
    let captured = null;
    const release = () => {
      if (captured !== null && surface.hasPointerCapture(captured))
        surface.releasePointerCapture(captured);
      captured = null;
    };
    function down(event) {
      inputRef.current.dragged = false;
      if (isControl(event.target)) return;
      if (!gesture.start(event)) release();
    }
    function move(event) {
      const result = gesture.move(event);
      if (!result) return;
      // Capture only after a drag is recognized; taps still reach stars and links.
      if (captured === null) {
        surface.setPointerCapture(event.pointerId);
        captured = event.pointerId;
      }
      onManualInput();
      if (result.travel) onTravel(result.travel);
    }
    function up(event) {
      gesture.end(event);
      release();
    }
    function cancel() {
      gesture.cancel();
      release();
    }
    function lostCapture(event) {
      // Touch browsers implicitly capture on the original canvas/label. Ignore
      // its capture loss when ownership intentionally transfers to the surface.
      if (event.target === surface && event.pointerId === captured) cancel();
    }
    function click(event) {
      if (inputRef.current.dragged && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    function wheel(event) {
      if (event.ctrlKey || isControl(event.target)) return;
      event.preventDefault();
      const result = gesture.wheel(event);
      onManualInput();
      if (result.travel) onTravel(result.travel);
    }
    // Capture on the whole surface also sees gestures begun over text and Html labels.
    surface.addEventListener("pointerdown", down, true);
    surface.addEventListener("pointermove", move, true);
    surface.addEventListener("pointerup", up, true);
    surface.addEventListener("pointercancel", cancel, true);
    surface.addEventListener("lostpointercapture", lostCapture, true);
    surface.addEventListener("click", click, true);
    surface.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("blur", cancel);
    return () => {
      surface.removeEventListener("pointerdown", down, true);
      surface.removeEventListener("pointermove", move, true);
      surface.removeEventListener("pointerup", up, true);
      surface.removeEventListener("pointercancel", cancel, true);
      surface.removeEventListener("lostpointercapture", lostCapture, true);
      surface.removeEventListener("click", click, true);
      surface.removeEventListener("wheel", wheel);
      window.removeEventListener("blur", cancel);
      gesture.cancel();
      release();
    };
  }, [surfaceRef, inputRef, enabled, onTravel, onManualInput]);
}
