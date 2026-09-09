# Seoul surface light and attainable discovery

## Scope

Normal Moon–Earth flight, wheel/pinch gain, one-finger looking, auto-cruise, slider limits and article placement are unchanged. This revision only lowers the extra approach effort and adds a geographic light once that mode begins. The existing maximum camera magnification is retained to avoid amplifying the current geographic texture's resolution limit.

## Effort and release

- Signal distance remains 1–1.32. The continuous effort rate changes from 0.16 to 0.18 per second; forward resistance changes from `0.12 / (1 + 5s²)` to `0.4 / (1 + 2.2s²)`. The tiny 0.032 pressure buffer, 0.25s pressure expiry and normal-route momentum stop remain.
- Finger-reset grace grows from 0.7 to 0.95 seconds. This accommodates repeated pinches without involuntary reverse travel while approaching. A real stop retains exponential return to exactly the ordinary Earth boundary. Fresh input immediately interrupts that return; successful discovery stays open.
- Simulations at 60 Hz from the normal Earth boundary: maximum sustained pressure 7.70s (previously 44.43s); 120px wheel events six times/second 10.68s; equivalent continuous trackpad input 10.70s. A more leisurely 100px wheel input three times/second takes 25.43s. These are example input patterns, not universal timers or measured physical-device timings.
- Pinches use the real gesture recognizer: 100→200px spread over 0.6s, then lift/reset for 0.4 / 0.6 / 0.8s. Discovery takes 11.10 / 13.30 / 15.50s respectively.
- A lone oversized impulse still cannot discover; normal arrival consumes momentum and requires fresh forward input. A simulated decaying trackpad fling reaches only 42% of the extra route before release returns it. One wheel notch per second for two minutes remains below 20%; discovery still requires intent.

## Geographic light

- Seoul is approximately 37.5665° N, 126.978° E in the existing globe's local geographic frame. The vertex shader shares its local normal; the fragment shader evaluates the angular distance to Seoul. This keeps the light attached to the actual terrain through camera motion and globe sway without UV offsets, another globe, a marker sprite or a texture request.
- A soft 0.65° core and 2.8° regional envelope create a restrained warm center with a faint cool surrounding light. These are artistic Gaussian light widths, not administrative boundaries. The shader adds light before tone mapping and leaves map sampling/cloud orientation untouched.
- Brightness is zero through ordinary travel, then rises smoothly with approach. There is no blink, ring, progress meter, pre-discovery text or time-driven animation. Retreat dims it using the same strength function, including reduced motion.
- Focus stays at the existing Korean anchor during the initial mode transition, then smoothly shifts to Seoul between 24% and 90% of the extra approach. Both use the same live globe sway and orientation. FOV, safe final altitude (3.8 world units) and Earth radius are unchanged.

## Verification

136 tests cover the calibrated difficulty, equivalent wheel/trackpad input, real pinch-recognizer output with finger-reset gaps, 30/60/120 Hz consistency, release/reversal, quiet mode, isolated Seoul light, continuous brightness, camera alignment through sway and both layouts, one-globe rendering, startup and SEO regressions.

In-app browser screenshots verified dim/intermediate/final stages at desktop and 390×844 sizes. A temporary local-only scene harness held those stages for inspection and was removed before build/commit; it is not a production shortcut. The actual app was also exercised with UI input: the normal-boundary slider did not reveal the secret; sustained keyboard input reached the real GitHub/Velog card; the exit restored article exploration. A partial approach showed only the surface light and, after input stopped, returned to the ordinary Earth scale and article UI without revealing the card. No shader warnings or errors appeared. Responsive screenshots are not physical touchscreen or GPU-performance validation.

The initial build retained 62 indexable HTML pages, 58 complete articles and 17 photos. A concurrent remote Velog refresh was preserved before pushing; the integrated revision again passes all 136 tests and builds 63 indexable pages / 59 complete articles / 17 photos across two stable sectors. No runtime dependency, texture, render pass, extra draw batch, hosting workflow or Velog refresh workflow is added or changed.
