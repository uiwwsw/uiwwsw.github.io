# Progressive first paint and startup dependency repair — 2026-09-09

The progressive-loading infrastructure below is retained. This report records the original 1.4-second visual handoff; the current fixed-camera object entrance uses a **0.32-second crossfade and 1.8-second assembly**, and optional detail loading now waits for both. Current timings and offscreen resource warm-up follow [world-assembly-qa.md](./world-assembly-qa.md).

## Confirmed code/build causes

- The canvas stayed at opacity zero until all four Earth/Moon maps loaded, including the 1,508,389-byte packed cloud map. The previously correct SSR interface therefore sat above a mostly empty dark background before a relatively fast 0.7-second scene reveal.
- The generated entry module statically imported JSX/CommonJS/preload helpers from the `three` chunk. Despite `React.lazy`, the initial UI's static dependency graph therefore included the entire 3D runtime. This is verified in the built imports, not inferred from a Lighthouse score.
- Service-worker network responses awaited `CacheStorage.put` before being returned to the page, making cache storage/body buffering part of the critical response path. Cache write failure also risked treating a successful fetch as a failed navigation.

## Changes

1. **First HTML is already a sky.** A deterministic, decorative 96-point inline SVG and CSS nebula-colored background are prerendered inside the same App. It needs no image request, WebGL or layout replacement. There is no fake globe that could overlap or mismatch the Korea-oriented Earth. The header, hero, real featured URL and reading fallback remain unchanged.
2. **Only base textures gate the scene.** Day (473,093 bytes) plus Moon (238,093 bytes) total **711,186 bytes**, versus **2,486,636 bytes** for all four maps: about 71.4% fewer texture bytes on this readiness gate, not a 71.4% claim about overall page load time. Same-origin image preloads use matching anonymous CORS mode. Cloud/night requests wait until the visual handoff ends.
3. **Repair the lazy dependency boundary.** Explicit vendor placement for React/JSX, CommonJS and Vite preload helpers removes Three from the homepage's static import closure. A manifest regression check fails builds if that dependency returns. The homepage alone gets low-priority modulepreloads for the scene and Three; static article pages still load neither scripts nor these preloads. Preloading does not execute the scene before hydration.
4. **Warm before displaying.** A render controller waits for critical geometry/assets, calls `compileAsync`, and does not force pending shader programs to render. It then draws two complete frames behind the invisible canvas before signaling readiness. The same controller continues the normal render after camera/uniform updates. It has no arbitrary spinner/minimum wait, ignores late results after disposal, and falls back on compile/render errors.
5. **One continuous handoff.** The base scene crossfades over the existing sky with a 1.4-second ease-in/ease-out opacity curve, without transform/blur or an intermediate blank layer. `transitionend` removes the temporary backdrop and enables optional details. Reduced motion has an explicit no-transition path; a scene failure restores the readable backdrop/fallback.
6. **Details enhance, never block.** Clouds and night lights have an independent Suspense/error boundary. Same-type texture placeholders are masked by zero night/cloud/shadow strength until real maps arrive, then strengths ease in. No second terrain, UV remapping, new geographic asset or shader-variant recompile is introduced. Optional texture failure leaves the base globe usable.
7. **Stream responses immediately.** Cache writes attach to `FetchEvent.waitUntil`; responses return without waiting for cache open/put. Cloning happens before the first await so the browser can safely consume the original stream. Cache errors do not replace a successful response. Warm-cache and offline document behavior are preserved.

## Verification

- **98 tests pass**, covering cold/cached readiness, pending shaders, complete-frame ordering, error/disposal behavior, initial SSR sky, critical/optional texture separation, reduced-motion handoff wiring, nonblocking cache writes and offline fallback. All existing Korean-content, photo, geography, interaction, discovery and scaling tests remain passing.
- Production build and SEO validation pass: 62 indexable pages, 58 complete articles and 17 photographs. The manifest confirms the entry imports only the vendor chunk; the scene remains a dynamic entry. Optional cloud/night files are absent from HTML image preloads.
- Built static JS dependency bytes (excluding CSS/HTML and dynamic downloads): previously approximately 988 KB raw / 273 KB gzip including Three; now approximately 185 KB raw / 63 KB gzip for entry + vendor. The 3D runtime is still downloaded for the interactive scene; these are dependency-graph sizes, **not measured execution time or total bandwidth savings**.
- Final homepage HTML is about 25 KB raw / 7.6 KB gzip including the inline sky, real SSR interface and no-JS fallback. No new runtime dependency or bitmap was added. The SVG disappears after handoff; the existing GPU scene/draw budgets remain intact.
- GitHub Pages deployment and monthly Velog refresh workflows, article data/URLs, first-paint font behavior and navigation restoration are unchanged.

## Live QA limitation

The Mac was locked when computer-use inspection was attempted; the owner was asked to unlock it. Cold/warm refresh appearance, actual shader-driver behavior, transition events on physical iOS/Android devices, CLS, LCP and GPU timings have **not** been measured here. The automated readiness/cache tests and build graph support the implementation, not a claim of zero flash or a guaranteed device performance gain.
