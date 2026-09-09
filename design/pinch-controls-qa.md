# Mobile pinch controls

## Interaction contract

- One touch pointer: look horizontally/vertically after the existing 8 px tap tolerance. No vertical travel or travel-pitch impulse. Starting to look clears queued travel and stops automatic cruise.
- Two touch pointers: spread to travel forward, close to reverse. Look targets stay fixed during pinch. Secondary (non-primary) touch pointers are accepted.
- Zoom uses Euclidean span, not horizontal separation: portrait, landscape and diagonal pinches work. Gain is `0.18 * log(new / previous)`; 2× spread requests 0.12477 route units before the existing integrator's speed/coast caps. Per-frame log changes are bounded to ±0.35. Spans below 40 px rebase without motion and initial jitter below 4 px is ignored.
- One RAF samples all pointer moves together. Moving both fingers in parallel within a frame must not create alternating forward/reverse impulses from intermediate pointer positions.
- 1→2, 2→1 and replacement fingers rebase their position/distance; a third finger suspends pinch until two remain. A remaining finger can resume looking after 8 px, without applying the previous pinch displacement as pan.
- Pinch/drag suppress synthesized star clicks, but not keyboard activation or the next genuine tap. Only recognized drags capture a single pointer; pinch captures both, and releases each independently.
- Pointer cancellation, unexpected capture loss, window blur and effect cleanup discard pending RAF input and release all captures. Normal pointer-up flushes the last queued span once before rebasing.

## Scope and compatibility

The custom gesture owns `touch-action: none` only on the sky/canvas and star labels. The main element uses `auto`; intro text passes pointer events through, but its journey button stays interactive. The reading dialog keeps `pan-y pinch-zoom`; controls and secret links remain excluded from flight gestures. No viewport zoom restriction was added. Ctrl-wheel still belongs to browser zoom, and ordinary desktop wheel/keyboard/slider controls are unchanged.

This follows the browser's [touch-action ownership model](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) and [Pointer Events pinch pattern](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures), with frame batching and explicit pointer-count transitions added.

The pinch-only control remains unchanged. The later [Seoul signal revision](seoul-signal-qa.md) makes the secret more attainable: repeated forward pinches (100→200 px over 0.6 s, lift/reset for 0.4–0.8 s) reveal in about 11–16 seconds in simulations. Pausing beyond the 0.95-second grace still returns to the entry orbit. Merely dragging up/down cannot enter the secret.

## Verification

- `npm test`: 109 passing tests. `npm run build` and SEO validation pass: 62 indexable pages, 58 complete articles, 17 photos. `git diff --check` passes; deployment and monthly Velog workflows are unchanged.
- Pure gesture tests cover both axes, viewport sizes, 6/30/120 event samples, reversal symmetry, two-finger translation, small spans, noise, oversized samples, third fingers, finger replacement, tap suppression and desktop controls.
- DOM-adapter tests use the real recognizer with mock events, pointer capture and RAF to cover gesture delivery, batching, queued-coast cancellation, synthesized clicks, control exclusion, cancel/blur/capture-loss/unmount cleanup and final release flush.
- Motion tests send real pinch-recognizer output into the flight integrator and verify secret reachability. Existing release recovery, reduced-motion and frame-rate tests remain enabled.
- CSS/wiring assertions guard scene-only gesture ownership and retained native reading zoom.

The Mac was locked when computer-use verification was attempted. These are automated event/physics checks, not physical iOS/Android usability measurements. Still verify on a real device: spread/close, up/down look, pinch→one-finger look, star-label gestures, rotation, browser chrome interruptions, article scrolling and native article zoom.
