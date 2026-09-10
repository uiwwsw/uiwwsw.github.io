# Slider endpoints — 2026-09-10

## Cause and reproduction

The previous change enlarged the native thumb to 44px, but still painted a track across the entire input width. A native range thumb's center travels from half the thumb width to the input width minus half the thumb width, leaving a visible 22px rail mismatch at each end. The Moon/Earth markers were separate flex siblings, with another 10px gap, outside the actual input hit area.

At 390×844, the old input spanned x=42.30–339.70, while the Moon and Earth markers were centered at x=29.80 and x=356.20. Starting at 50%, clicking either marker left the value at 50%. Even at a numeric endpoint, the visible handle could not meet the marker.

## Fix

- One full-width, 52px-high native range input now covers the entire control, including both endpoint markers and outer padding.
- A pointer-transparent decorative rail is inset by half the shared `--flight-thumb-size: 44px` on both sides. Its endpoints, progress fill and thumb center share exactly the same travel interval.
- The native tracks are transparent, so a second full-width line cannot extend past the actual travel range. WebKit and Firefox tracks are explicitly styled; the input's margin, border and padding are zeroed.
- Both endpoint markers live on the decorative rail, underneath the input. A marker tap goes to the real range input instead of an inactive sibling. The thumb covers the marker when it reaches that endpoint.
- Native pointer capture, keyboard/assistive input, 0.1% steps, focus outline and accessible value text remain unchanged. No custom touch-coordinate handler, endpoint snap threshold, extra listener, dependency or animation is added. Canvas gestures still exclude this control; slider travel still stops at the ordinary Earth boundary.

## Verification

- At 390×844, input x=27.30–362.70 and rail x=49.30–340.70 match the 44px native thumb travel. Clicking the actual Moon/Earth endpoints returns exactly 0/100. Dragging from x=49 to x=341 and back, 18px above the visible line inside the enlarged thumb, also returns exactly 100/0. Keyboard End/Home return exactly 100/0. Screenshots show the handle meeting each rail endpoint.
- At 1280×720, input x=495–785 and rail x=517–763 match the same geometry. Endpoint/middle clicks return exactly 0/100/50. Browser warning/error logs were empty.
- At 320×568, rail x=44.39–275.61 remains usable; endpoint clicks return exactly 0/100 on this smaller mobile layout too.
- Regression coverage checks the shared thumb/radius CSS contract, both engine track styles, the full-width input and marker nesting, native keyboard/accessibility semantics, and the absence of a competing pointer implementation.
- Browser interaction used in-app pointer automation at mobile/desktop viewport sizes, not a physical phone or an independent Firefox run. All application tests, build and SEO checks are run before commit; deployed artifacts are verified against the tested local build.

Article data, star placement, flight/pinch gains, idle guidance and deployment/monthly-refresh workflows are unchanged.
