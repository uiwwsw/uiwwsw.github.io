import { createFlightGesture } from "./flightInput.js";

const isControl = (target) =>
  !!target.closest(
    'a, input, select, textarea, button:not(.star-label), dialog, summary, label, [data-flight-control], [contenteditable="true"]',
  );

// DOM adapter kept independent of React so capture, RAF and cancellation paths
// can be exercised together with the actual gesture recognizer.
export function bindFlightSurface({
  surface,
  input,
  onTravel,
  onManualInput,
  onLook,
  host = window,
}) {
  const gesture = createFlightGesture(input, () =>
    surface.getBoundingClientRect(),
  );
  const captured = new Set();
  let frame = null;
  const capture = (id) => {
    if (captured.has(id)) return;
    try {
      surface.setPointerCapture(id);
      captured.add(id);
    } catch {
      // The pointer may already have been cancelled by the OS.
    }
  };
  const release = (id) => {
    captured.delete(id);
    if (surface.hasPointerCapture(id)) surface.releasePointerCapture(id);
  };
  const stopFrame = () => {
    if (frame !== null) host.cancelAnimationFrame(frame);
    frame = null;
  };
  const flush = () => {
    stopFrame();
    const result = gesture.flush();
    if (result?.travel) onTravel(result.travel);
  };
  function cancel() {
    stopFrame();
    gesture.cancel();
    onLook();
    for (const id of [...captured]) release(id);
  }
  function down(event) {
    if (isControl(event.target)) {
      cancel();
      return;
    }
    if (!gesture.start(event)) return;
    const ids = gesture.pointerIds();
    if (ids.length > 1) {
      onManualInput();
      for (const id of ids) capture(id);
    }
  }
  function move(event) {
    const result = gesture.move(event);
    if (!result) return;
    capture(event.pointerId);
    onManualInput();
    if (result.kind === "look") onLook();
    else if (frame === null) frame = host.requestAnimationFrame(flush);
  }
  function up(event) {
    if (!gesture.pointerIds().includes(event.pointerId)) return;
    flush();
    gesture.end(event);
    release(event.pointerId);
  }
  function lostCapture(event) {
    // Ignore implicit capture loss on the canvas/label when transferred to us.
    if (event.target === surface && captured.has(event.pointerId)) cancel();
  }
  function click(event) {
    if (input.dragged && event.detail !== 0 && !isControl(event.target)) {
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
    else onLook();
  }
  const events = {
    pointerdown: down,
    pointermove: move,
    pointerup: up,
    pointercancel: cancel,
    lostpointercapture: lostCapture,
    click,
  };
  for (const [name, handler] of Object.entries(events))
    surface.addEventListener(name, handler, true);
  surface.addEventListener("wheel", wheel, { passive: false });
  host.addEventListener("blur", cancel);
  return () => {
    for (const [name, handler] of Object.entries(events))
      surface.removeEventListener(name, handler, true);
    surface.removeEventListener("wheel", wheel);
    host.removeEventListener("blur", cancel);
    cancel();
  };
}
