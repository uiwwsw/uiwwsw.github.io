# Stable refresh and denser ambient dust — 2026-09-09

## Code-confirmed causes

The previous `build-seo.js` inserted a standalone `.static-fallback.reading-site` inside `#root`, including a differently arranged header, title and article list. `main.jsx` then replaced it using `createRoot`. A normal JavaScript-enabled load could therefore first paint a reading page and then replace it with the immersive interface. This is a directly observed mismatch in the generated HTML and startup code, not a measured CLS value.

The canvas also rendered background layers while Earth/Moon textures were still inside Suspense, and its ready callback ran on mount rather than after full-scene frames. The homepage loaded a separate, unused font-family stylesheet and used late font swapping.

## Changes

- Prerender the actual React App at build time with the existing Vite SSR loader. Hydrate that same markup in place; do not maintain a second imitation landing layout.
- Embed only article count and the latest essay's ID/slug/title. The full metadata catalog and bodies remain lazy-loaded. The snapshot stays bounded with 3,000 posts, and an early featured-link click retains its working static URL.
- Keep the full non-JavaScript reading layout inside `<noscript>`, with its reading stylesheet. Homepage styling comes from the same responsive app CSS used after hydration.
- Defer browser-only media, document visibility, query restoration and WebGL until after a deterministic initial render. Do not rewrite share-link parameters before restoring them.
- Preload the one font actually used; `font-display: optional` prevents a late swap. Remove the unused alternate-family stylesheet and unused TTF/stylesheet precache downloads. Reserve numeric width in the navigation count.
- Keep the entire canvas transparent while textures load and the first two complete frames render. Reveal it with a 0.7 s opacity transition (no layout movement); reduced-motion CSS suppresses that transition.
- Double dust from 180/360 to 360/720 on mobile/desktop. Same deterministic distribution, GPU point batch, draw-call count, point-size limits, clocks and reduced-motion behavior. No new image assets or runtime dependencies.

## Verification

- 69 automated tests pass. New checks cover bounded boot snapshots, the actual App rendering deterministically without `window` or `document`, a real hero/header/deck in first HTML, zero premature canvas/dialog elements, hydration and font/scene reveal guards. Existing flight resistance, gesture locking, ambient pause, article data and SEO tests remain passing.
- Production build passes. SEO checks verify the prerendered homepage, count, snapshot, non-JS fallback and its stylesheet, along with all 62 indexable pages, 58 complete articles and 17 photographs.
- Static article pages, Velog source data, stable star registry and deployment/monthly refresh workflows are unchanged.

## Live verification limitation

The Mac remained locked when computer-use inspection was attempted; the owner was asked to unlock it. This revision has **not** been live-tested for cold/warm refresh, hydration console warnings, CLS, visual transitions, physical-phone FPS or GPU load. The automated source/build checks are not substitutes for those measurements. No claim of zero CLS or a measured frame rate is made.
