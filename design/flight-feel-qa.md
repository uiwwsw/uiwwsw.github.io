# Deliberate flight and a resistant signal — 2026-09-09

Historical revision (`bb87178`); current controls, hidden discovery and timings supersede this document in [flight-controls-qa.md](./flight-controls-qa.md).

## Direction

More deliberate input should mean more time among the writing, not more abrupt jumps. Keep the Moon–Earth route, registered star positions, article counts, SEO and refresh/deployment workflows unchanged.

- Wheel gain changes from `0.00045` to `0.00018` (2.5× more input for the same requested distance). Vertical touch gain changes from `1.35` to `0.30` per viewport height (4.5× more input). Horizontal touch/trackpad controls and axis locking are unchanged.
- A frame-rate-independent impulse controller caps normal travel at `0.065` route units/second. Its queue is capped at `0.09`; a burst cannot bank a whole flight. Small impulses ease out exponentially, and reversal discards forward momentum. Direct slider navigation and the existing slow automatic cruise remain available.
- Normal momentum stops at Earth. Only subsequent input presses into the field. Pressure is rate-limited to `0.22` effort units/second, buffered by at most `0.07`, and multiplied by `0.32 / (1 + 3 × signal²)`. It becomes harder near discovery.
- After a brief release grace period, incomplete signal progress recedes gently toward Earth. A completed discovery latches until reverse input or explicit exit. Reduced motion has no ordinary coast or passive recession; manual pressure and all exit controls still work.
- A pointer/Space/Enter hold on the signal button uses the same rate-limited pressure. Release, pointer cancellation, capture loss, blur, hidden document, pause and unmount stop the hold. Opening a panel or hiding the page discards queued travel.
- Existing readable labels get packing priority. Topic/article labels have a threshold dead band. Outgoing labels fade for 0.4 seconds and retire after at least 0.45 seconds before replacements are introduced, preserving the 3/5-label budget. Article points fade near the camera and viewport edge instead of abruptly clipping; nearly passed points are excluded from picking.

## Automated verification

- 66 tests pass, covering the original data, image-only posts, SEO, Korea orientation, touch axis locking and catalog growth, plus bounded impulses, reverse braking, arrival without overshoot, increasing resistance, passive pushback, sustained discovery, repeated mobile strokes, reduced motion, frame-rate independence and label retention/retirement.
- Pure-controller simulations at 60 Hz, starting at Earth:
  - Maximal sustained input: discovery after **9.08 s**.
  - Hold button, `0.022` every 100 ms: **9.08 s**.
  - 120 px wheel impulses six times/second: **15.38 s**.
  - 120 px wheel impulses ten times/second: **9.25 s**.
  - One oversized impulse stays below 8% signal strength and subsequently recedes.
  - Repeated 300 px upward strokes on an 844 px viewport, with a 0.4 s gap between strokes, can reach the signal.
- These are deterministic model timings, not measured physical-device interaction timings. Browser event delivery varies by mouse, trackpad, frame rate and device.
- Production build and SEO validation pass: 62 HTML pages, 58 complete articles, 17 photos. No runtime dependency or GPU draw call was added.

## Browser verification limitation

The computer-use tool reported that the Mac was locked and automatic unlock was unavailable. The owner was asked to unlock it. Live wheel/touch, hold-button focus behavior, visual fade quality and physical mobile feel have **not** been verified in this revision; automated tests and build checks must not be represented as live-device testing.
