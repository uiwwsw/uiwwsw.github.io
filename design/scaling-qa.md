# Favicon and archive scaling QA — 2026-09-08

## Automated checks

- 36 Node tests: original 18 regression tests plus body/index integrity, stable registry, 300/1,000/3,000-star fixtures, bounded picking/labels, Earth label exclusion, body LRU/retry/cancellation, 3,000-post collector pagination, duplicate/cyclic cursor handling, and icon dimensions.
- Every generated body matches its real article ID and original sentences. SHA-256 filenames match their content. No full bodies or scraper cache validators enter the metadata index.
- Existing stars and legacy numeric aliases remain stable through source renumbering, additions and deletions. Every active sector holds at most 96 articles. All articles remain reachable through the archive and sector navigation.
- Vite production build succeeds. Current 58-post metadata chunk: 37.48 kB / 21.20 kB gzip, versus the previous full-content chunk of approximately 200 kB / 86 kB gzip. This is a content-loading comparison, not the entire site size; the Three.js bundle and planet textures remain separate costs.

## Browser checks

Tested in the local Chromium-based in-app browser, at 1280 × 720 and 390 × 844 viewport sizes. These are desktop-hosted mobile layout tests, not measurements on a physical phone.

- 300 articles: topic nebula click approaches individual stars, sector selection changes the batch without graphics errors.
- 1,000 articles, narrow viewport: 96 active stars, 25 pick candidates, two visible labels in the sampled view. A tap over adjacent stars opens a two-story chooser; selecting one opens its body. Searching across regions and selecting 2026 finds the real article “인격이라는 소설에 대해” with its correct body.
- 3,000 articles, distant 2030 sector: background remains visible after the sector warp. Near-view samples showed 96 active stars, 4 total scene draw calls, 21 mobile / 55 desktop pick candidates. The browser's one-second rendering counter reported about 60 FPS in these sampled views. This is a smoke-test observation, not a sustained benchmark or phone performance guarantee.
- Horizontal dragging changes the view without opening a story or changing travel progress; the compass recenters it. Touch direction-lock behavior is additionally covered by unit tests.
- With WebGL disabled, the 3,000-item archive shows 24 rows and 125 pages. “다음” opens page 2, moves focus to the result list, and keeps 24 DOM rows. Search, year selection and real article reading work without a canvas; no horizontal page overflow at 390 px.
- The original extra-zoom secret still reveals the GitHub/Velog links after reaching Earth.
- No console errors or warnings in the final 3,000-star run. Hot-module replacement while editing the Canvas can intentionally dispose its WebGL context; checks above were run after a fresh navigation.
- SVG-derived favicon inspected at 32 and 180 px; PNG headers and ICO frames checked automatically.

## Deliberate limits

- Only the selected region is rendered. Every article keeps a star, but thousands of stars are not all interactive simultaneously.
- Metadata remains one small searchable index. At much larger scales, shard it by year and load region indexes separately.
- Body memory cache is bounded to 12; offline access to every unread article is not promised.
- Collector validation and continuation use mocked API pages in tests. A live full scrape was not run for this visual/scaling change; the checked-in real archive was preserved. Conditional HTTP reuse depends on Velog's response headers.
