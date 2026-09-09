# Release-only return, Korea close-up and readable idle motion — 2026-09-09

Historical record: the difficulty/grace and absence of a surface clue below are superseded by [Seoul signal QA](seoul-signal-qa.md). Release-only return, normal flight and the single geographic globe are preserved.

## Interaction

- Ordinary Moon–Earth wheel/touch gain, short bounded coast and mobile downward-forward direction are unchanged. Automatic cruise and direct slider travel still stop at the normal Earth boundary.
- Additional manual input enters a visually different Earth-focused approach. The former three fixed rebound shells and their extra-effort debt are removed entirely: sustained input produces **zero backwards frames**.
- The hidden pressure budget remains 0.16/second with a 0.032 buffer. Increasing resistance is now `0.12 / (1 + 5 × strength²)`; discovery remains deliberately difficult without forced interruptions.
- Input can pause for 0.7 seconds to reset a finger. After a real stop, unfinished distance returns exponentially (`exp(-2.8 × dt)`) to exactly 1, restoring the same camera pose/FOV/sky mode as the ordinary Earth boundary. Fresh forward input immediately stops this return. A successful discovery stays open.
- Reduced motion uses the same approach difficulty, but resets on release without animating the zoom-out. Hidden tabs and open panels do not advance the model/ambient clocks; pointer cancellation, keyboard exits and non-WebGL discovery are preserved.
- No extra pre-discovery text, percentage, marker, button or hint was added.

## Korea-focused presentation

- A smooth visual blend completes in the first 24% of additional approach, fading article points/labels, background stars, dust, light trails, nebula color and nonessential exploration chrome. Article picking and faded label keyboard access are disabled; the archive, travel slider, exit controls and complete reading fallback remain available. The writing HUD is inert and hidden from assistive technology only during WebGL focus mode.
- Camera position smoothly follows the Korean surface normal; its target is **36° N, 128° E on the actual swaying globe**, not the Earth center. Earth publishes the same local sway and world orientation used by its single surface mesh into a shared vector ref. There is no second globe, texture remapping or separate rotation clock.
- Camera FOV narrows from 46° to 32° on desktop, 58° to 38° on mobile. Altitude decreases exponentially to 3.8 world units above the radius-12.3 surface, keeping the view safely outside the atmosphere. The existing 4096×2048 map is retained; no extra geographic imagery is downloaded. Free-look offsets and decorative camera drift fade out during focus and return when it ends.

## Critical ambient review

The previous dust count alone was misleading: a very large volume, low speed and distant points left little visible displacement inside a narrow portrait frustum. Adding thousands of uniform points would increase overdraw and compete with the actual article stars.

- Counts rise only one third: 360 → 480 mobile, 720 → 960 desktop, still a single GPU point batch.
- The shared volume shrinks from 150×100×180 to 110×76×130. One quarter of the particles occupy a 0.48-scale near volume, with faster transverse movement and mixed vertical directions. This produces perspective layers rather than uniform snowfall. Points fade near the observer and at wrap boundaries; maximum point size decreases from 7 to 5.5 pixels before DPR.
- The single noninteractive distant trail appears first after 3.5 seconds, then every 18 seconds, lasting 2.6 seconds. A softly enveloped head makes it more legible; there are no overlapping trails, flashes or additional article stars.
- All decorative movement is suppressed by existing reduced-motion/pause/hidden-page rules. During Earth focus, dust and trails fade completely so they cannot run over the Korean close-up.

## Verification

- 90 tests pass. New regressions cover uninterrupted approach, release-only return, interrupting a return, exact ordinary-scale recovery, frame-rate independence, reduced-motion reset, texture-aligned Korean targeting through both sway extremes/layouts, and visible-scale idle particle projection.
- Deterministic simulations starting at the ordinary Earth boundary: maximal effort reveals at **44.43 s**, 120 px wheel input six times/second at **54.85 s**, repeated 300 px/0.6 s downward strokes with 0.4 s gaps at **66.45 s**. All three produce zero backwards frames while approaching.
- After stopping at incomplete distances 1.05/1.20/1.319, return completes in **2.52/3.02/3.18 s**, including release grace. The final target/pose exactly matches ordinary progress 1.
- CPU projection estimates at the opening camera find 19 mobile / 77 desktop dust points inside the frustum above the test alpha threshold, with median displacement about 8.3 / 10.8 pixels per second. These figures exclude UI/planet occlusion and are not screenshots or measured GPU FPS. The regression requires conservative minimum moving counts, not these exact samples.
- Production build and SEO checks pass: 62 indexable pages, 58 complete articles and 17 photos. No runtime dependency, texture, extra point batch or deployment/Velog workflow changed.

The Mac remained locked when computer-use verification was attempted. The owner was asked to unlock it. Live visual composition, physical mobile input and GPU performance remain unverified; the geometric/model checks above are not substitutes for claiming live-device validation.
