# Capacity-based exploration regions — 2026-09-10

## Cause and rule

V1 put only the initial import in `home`. Every later post bypassed its free slots and was assigned to a year/topic region. This produced the misleading split of 58 initial posts versus one new 2026 essay, although all 59 fit within the 96-star rendering budget. A region was neither a complete category nor a full spatial batch.

V2 uses one capacity-based allocator for initial and subsequent imports: fill the first available region, then create a numbered `기록 성운` only when all existing regions have 96 reserved stars. Physical regions do not classify writing. Year and topic filters continue to use article metadata across the complete archive; the entry button now says `연도·주제로 찾기`.

## Migration and stability

- The one-time V1 migration fills vacant home slots with overflow stars, in stable numeric-alias order, up to 96. Existing home positions never change; retained overflow regions keep their IDs/origins and receive neutral labels. Empty retired regions are omitted. Fresh regions avoid all occupied origins, including legacy layouts with gaps.
- In the actual registry, all original 58 home entries are byte-for-byte equivalent as parsed objects. Only `생각을-끝까지-쓰는-일` moves from `2026-essay-1` to `home`; its ID, numeric alias `58`, article body, canonical page and metadata remain unchanged. Its local position is unchanged; its world x-coordinate moves from −81.398 to 18.602 to match the home origin. All 59 records now appear in `달 · 지구 항로`.
- Repeating the generator is idempotent. After migration, insertion, source reorder, metadata edits and deletion never relocate saved stars. Deleted posts retain their slots and aliases so returning posts do not reshuffle the sky; visible counts reflect only active articles. This means a region can show fewer than 96 active stars after deletion even though its reserved capacity is full.
- Existing navigation already falls back to home for retired/unknown sector IDs and resolves article slugs or numeric aliases independently. No URL migration script is necessary. A retained legacy sector URL still points to that same region.
- Visit-specific small offsets, label budgets, touch/keyboard input, Earth discovery, article SEO, content bodies and scheduled Velog/deployment workflows are unchanged.

## Verification

- 152 automated tests pass, including eight new allocation regressions: 58→59; fresh/incremental 96/97/192/193 boundaries; one-time V1 repair; partial migration without overfilling; reserved deleted slots/aliases; metadata-only filter changes; origin collisions after legacy removal; complete one-star-per-article output. Existing 300/1,000/3,000-star stress, picking, visit variation, input and geography tests remain green.
- Production build and SEO validation pass: 59 complete articles, 17 photos and 63 indexable pages.
- In the production-preview browser, the dropdown has only `달 · 지구 항로 · 59개`. The archive lists 59 posts and the essay filter finds all 37 essays, not only the new one.
- Opening `?sector=2026-essay-1&article=58` loads the complete `생각을 끝까지 쓰는 일` article and normalizes the URL to its original slug, without the retired sector. Closing it returns to the 59-star home route.
- At a 390×844 viewport, the single region and renamed archive button fit, the subject nebula includes all 37 essays, and browser warning/error logs are empty. This is responsive-layout validation, not physical-phone performance or touch testing.
