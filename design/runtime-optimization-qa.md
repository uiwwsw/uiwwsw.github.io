# Runtime optimization — 2026-09-11

## Scope and findings

The site already defers its Three bundle, loads only day/Moon textures before entry, caps mobile DPR and star/dust counts, bounds each region to 96 articles, and pauses hidden-tab rendering. These were retained. No dependency, image format, texture quality, pixel ratio, camera motion, shader, particle count or loading sequence was changed.

The remaining CPU work included projecting/sorting all article stars even before the exploration threshold or while reading; rebuilding metadata records and multiple arrays on every interactive frame; computing label-only Earth screen bounds every frame; and reconciling unchanged Earth/background/dust React trees whenever the parent published travel progress.

## Changes

- `createStarProjectionBuffer` owns one private projection record per eligible article, one projected array and one bounded pick array. It reuses these on every frame instead of copying catalog metadata and rebuilding filter/map/slice arrays. Filtering happens when articles or filters change. Input catalog/position arrays are never mutated.
- `createStarProjector` keeps its allocating API for general callers and tests, with an optional reusable output record for this frame loop. Visibility, camera-space depth, Earth occlusion, ordering and hit budgets are identical.
- Before 12% exploration, during article reading and while focusing Earth, candidates are cleared and projection is skipped. The independent delta-based label clock still advances and preserves the hide/resume fix. Interactive picking remains per-frame, not throttled.
- Label-only planet screen projection/radius calculation runs after the existing 5 Hz layout gate. Labels/picks snapshot private records before use, so continuing frame updates cannot alter an already-open article or retained UI snapshot.
- Earth, DeepSky, BackgroundStars and AmbientSpace use React's default shallow memoization. Their meaningful props still update on pause, responsive layout, filter-independent scene focus and seed changes. Existing frame subscriptions continue to drive all animation; no scene is frozen to save work.

## Measurement and trade-off

`node scripts/benchmark-star-projection.js` compares an allocating filter/map/sort/slice reference pipeline using the same projection math against the reused buffer. Before integrating the concurrent Velog refresh, it exercised the then-current 59 home articles with 120 precomputed normal-route cameras, 6,000 updates per sample, warmup and seven alternating-order samples per layout. One local run produced:

| Projection workload | Allocating median | Reused median |
| --- | ---: | ---: |
| Mobile-layout camera samples | 61.99 ms | 51.49 ms |
| Desktop-layout camera samples | 72.53 ms | 67.88 ms |

These are small, isolated CPU differences, not an exact old-build browser comparison or a claim about site-wide FPS, battery life, memory heap size, mobile-device speed or network loading. The primary structural gains are eliminating application-created per-frame metadata/array churn and skipping projection entirely on ineligible screens. React reconciliation savings were not assigned a timing percentage. Sorting may still allocate internally in the JavaScript engine, and the 5 Hz UI packing intentionally retains snapshot allocation.

The built lazy scene grows by about 0.16 kB gzip for the reusable buffer/memo boundaries. Entry/vendor/Three/metadata/style sizes are effectively unchanged; no new initial request is introduced. That small code-size trade-off is intentional.

## Verification

- Exact projection/pick equivalence across 41 route positions in desktop/mobile layouts, with both all-article and engineering-only catalogs.
- Frozen source arrays, record/array identity reuse, independent label/click snapshots, offscreen/clear/resume behavior, empty input and full 96-star sector budgets (36 mobile / 64 desktop).
- Existing camera order, resumed clock, star visibility, Korea orientation, Seoul signal, shader startup, particle motion, pinch/keyboard/slider endpoints, metadata/SEO and article tests remain enabled.
- In-app browser desktop and 390×844 mobile checks: normal entry, 50% route labels, real `리엑트쿼리 자동화 스크립트` body opens with correct content/links, closing resumes the same route, engineering filter shows only engineering titles, pause still allows slider movement and titles at 100%. Diagnostics report zero pick targets while reading and resume populated targets afterward; dust counts remain 960 desktop / 480 mobile. This is desktop browser automation, not physical-device battery/FPS profiling.

The optimization itself does not edit article source data, sector allocation, touch targets, SEO or workflows. Before pushing, upstream `5f53554` (the existing automatic Velog refresh) was integrated without modifying its source data. That upstream archive contains 58 articles, with `생각을 끝까지 쓰는 일` absent; its prior registry slot remains reserved. The final combined build passed all 170 tests and SEO checks for 58 full articles, 17 photos and 62 indexable pages. This data-count change comes from the upstream refresh, not from projection filtering or star removal by this optimization. Deployed assets are checked against this final combined build.
