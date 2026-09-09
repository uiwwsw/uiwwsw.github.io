# Same universe, a different night

## Visit lifetime

`main.jsx` chooses one random 32-bit seed before rendering React, outside StrictMode. New navigation and reload create a fresh value; browser history-back reuses the value attached to that history entry, including when the document is reconstructed rather than restored from bfcache. The URL-sync effect preserves existing history state. Reading, closing panels, search, filters, sector changes, pause, resize and returning to the Moon do not choose another seed.

There is no cookie, local/session storage, URL parameter, interval or tracking request. Random generation/history restrictions are caught so browsing remains available; if history persistence is blocked, the in-document visit remains stable but restoration across a document reload cannot be promised. A neutral seed of zero remains available to SSR and deterministic tests.

## Restrained visual variation

- **Background:** 96 bright anchors per responsive layout retain exact original positions, colors, sizes and shimmer phases. These are the stars in the first HTML, so they cannot jump at hydration or canvas reveal. All other 2,704 / 5,904 background points are seeded per visit while preserving the same overall galactic-band distribution. The initial sky HTML/CSS and its 1.15-second handoff are unchanged; no prerendered variant trees or inline mutation script is needed.
- **Writing:** runtime-only coordinates vary within 3.2 world units of each saved coordinate. Candidates stay inside the existing sector volume. Pair clearance is at least 2 units, or the original distance where the baseline was already tighter. Earth clearance cannot become worse than the original position or the radius-plus-3 margin in either layout. Existing label packing still excludes the headline/planet and keeps the DOM budget. When no candidate passes 24 bounded attempts, the baseline position is retained. This is not an arbitrary full-sky shuffle.
- **Dust and meteors:** existing particle counts/batches remain. Positions, velocity magnitudes/direction and phases vary per visit. The one meteor begins after 3.5–7.5 seconds of active motion, recurs every 16–24 seconds and uses a seeded lane/direction. Its existing 2.6-second soft envelope and no-overlap behavior remain; reduced motion, pause and hidden-tab freezing remain intact.
- **Unchanged:** Moon/Earth placement and introduction, Korean geography, Seoul discovery glow/difficulty, normal wheel/pinch controls, article IDs/URLs/body hashes, chronological archives, sector membership, canonical metadata, and deployment/Velog workflows.

## Verification

144 tests pass. New regressions cover reload/back lifetime, invalid/blocked history and crypto fallback, immutable catalog metadata, stable placement independent of source order, changing seeds, bounded displacement, neighbor and planet clearance, 3,000 addressable stars, fixed first-paint anchors, seeded particle budgets, single soft meteor schedules, and URL-sync/React wiring. Actual SSR output with a nonzero client seed matches the default first-paint HTML exactly.

On this machine, a standalone Node sample with 59 / 300 / 1,000 / 3,000 articles took approximately 1.6 / 4.0 / 11.8 / 37.9 ms to arrange once. These are CPU observations, not mobile frame-time measurements or a universal performance guarantee. The 59-article sample moved every star with a mean displacement of 2.0 units; limited fallback is allowed for other seeds/catalogs. Work is sector-bounded and never runs per animation frame.

Browser QA: two reloads produced different visit values and visibly different background/writing layouts at the same 55% route position with ambient motion paused. Opening and closing the real “어른이” article retained the first visit value. The production-preview first paint and completed 3D scene were checked without hydration/shader warnings. Navigating to the static writing archive and using browser Back restored the exact same visit value. Mobile-sized rendering is checked at 390×844; this does not emulate physical touch hardware or claim mobile GPU performance.

Production build/SEO validation retains 63 indexable pages, 59 complete articles and 17 photos. No new dependency, texture, draw batch or first-HTML star count is added. Entry gzip grows by approximately 0.84 kB; the scene by approximately 0.17 kB in this build.
