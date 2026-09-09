# Continuous sky and grounded world assembly

## Confirmed causes

The 1.8-second revision combined a bright blue CSS/SVG placeholder with a much darker GPU nebula, replaced in just 0.32 seconds using a front-loaded opacity curve. The entire lunar terrain and rocks also moved upward by roughly 54–72 world units. Speeding that translation up made the Moon read as a rising slab. Source inspection and the before/after browser states confirmed these differences.

## Beat sheet

All times start at **actual 3D readiness**, after critical textures, shader compilation and two successful draws. Navigation-to-ready still depends on the device and network. There is no extra loader timer; the first HTML already contains the usable interface and dark sky.

| Time             | Layer and motion                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–1.15s          | Linear sky handoff. The first background uses the same dark base and diagonal haze direction, with anchors projected from the actual GPU starfield.             |
| 0.12–2.12s       | Earth enters from fully beyond the right edge. Quintic easing gives zero starting/ending velocity and acceleration, without a full-speed launch or bounce.      |
| About 0.65–0.98s | First Earth edge enters, depending on viewport (projection calculations).                                                                                       |
| 0.65–2.60s       | The Moon emerges bottom-to-horizon through a soft edge. Terrain and rocks share the same mask, with at most 3.2 world units of physical settlement.             |
| About 0.97–1.00s | First sampled terrain pixels exceed 5% reveal opacity (projection plus mask calculations).                                                                      |
| 2.60s            | Exact resting transforms, normal idle camera drift and optional cloud/night detail loading resume. The existing caption and input guide finish the composition. |

Camera position, tilt and FOV remain fixed during the opening. There is one Earth and one lunar terrain/rock group. The new floor treatment replaces the large translation, not lunar geometry or user-controlled flight. Input remains live and shortens the intro through the existing continuous handoff. Reduced motion, reading, motion pause, non-home navigation and secret focus skip immediately; returning home does not replay.

## Background continuity

`skyBackdrop.js` is a pure, non-Three generator shared by GPU stars and the first-HTML preview. Each responsive SVG contains 96 selected star anchors with matching camera projection and color; their opacity follows the initial shimmer phase. CSS selects one layout before hydration. The preview is a lightweight approximation, not a duplicate planet or an exact raster of the animated nebula. The old blue wash is removed. Bright star anchors no longer get replaced by unrelated random points.

Deep-sky, background-star and dust clocks wait for renderer readiness, so cold-load waiting does not consume initial motion. `transitionend` removes the preview only when the canvas is fully opaque. The no-transition reduced-motion path also follows React's explicit preference, so the DEV reduced-motion fixture cannot remove the backdrop ahead of canvas opacity. The lazy Three boundary and nonblocking service-worker response path remain intact.

## Ground continuity and rendering

Terrain and instanced rocks share `uLunarReveal` and the physical drawing-buffer height. A 0.11-viewport-high feather advances from below the bottom edge to above the lunar horizon. Fragments ahead of it are discarded; only its narrow edge blends, rather than making the entire floor transparent. The maximum physical offset is 3.2 units and falls quadratically with the remaining amount, so visible terrain becomes anchored early. Completion restores exactly zero intro offset; the normal travel transform stays in the inner group.

Both existing standard materials receive the same compile-time shader patch and stable program cache key. Materials/buffers are warmed before reveal, including the repeat-wrapped lunar texture. Keeping this material configuration stable avoids a new shader compilation at settlement. No bitmap, network texture, render target, postprocessing pass, dependency or draw batch is added. The terrain still uses 13,545 mobile / 40,001 desktop vertices and one 180-rock instance batch. The two existing lunar materials now blend their emergence edge.

## Automated verification

131 tests pass: Earth offscreen bounds; complete initial ground suppression; capped floor displacement; fixed camera; monotonic trajectories/reveal; 30/60/120 Hz timing across seven viewports; exact resting transforms; interruption/skip/hidden-tab behavior; matching HTML/GPU star projections; shared shader uniforms; readiness, reduced motion, guidance, pinch, geography, discovery, photo articles and SEO regressions.

Build/SEO checks retain 62 indexable pages, 58 complete articles and 17 photos. The preview budget assertion now checks 96 stars per responsive SVG, without a bitmap request. The homepage static import closure excludes Three. Deployment and monthly Velog refresh workflows are unchanged.

## Browser QA

The Browser skill connected to the in-app browser successfully. Desktop before/after states and successive modified-intro frames were inspected, including the partially revealed floor. Production-preview first paint and 390×844 / 844×390 responsive openings were also inspected. Keyboard Up moved travel from 0 to 1 and dismissed the guide; Home returned to 0 without replaying assembly. The DEV reduced-motion fixture displayed an opaque canvas with a 0s transition after removing the preview. The non-WebGL fixture opened the readable 58-article archive. No shader errors or warnings appeared in the inspected local browser log. Screenshots establish actual rendering, but the timing figures above are calculations, not device frame-time measurements. Viewport resizing does not emulate a physical phone's touch hardware or performance, and no full device-performance profile is claimed.
