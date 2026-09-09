# First-action guidance

## Intent and interaction

Replace the small, permanently printed footer gesture text with a short, visually distinct invitation. The actual world and its 1.8-second opening stay unchanged. Guidance becomes visible only after the scene is ready and assembly completes; its 0.25-second opacity / 0.35-second position transition adds no page-load timer or control lock.

- Desktop: **스크롤을 내려, 별 사이로**, with a moving mouse-wheel glyph and secondary drag / arrow-key / star-click instructions.
- Touch: **두 손가락을 벌려 다가가 보세요**, with two fingertip glyphs spreading apart and secondary drag-to-look / tap-star-to-read instructions. One-finger dragging is never described as zoom.
- Initial input mode uses `(pointer: coarse)` rather than the mobile layout breakpoint, so landscape tablets still get pinch guidance. Actual touch/mouse pointer-down events update the copy on hybrid devices. The existing hero's English subtitle uses the same mode.
- Actual wheel, drag, pinch or keyboard flight input dismisses the guide through the existing input callback. Slider use, automatic journey, article selection, nearby-star selection and sector/topic navigation dismiss it too. Hover, a blank-sky tap and unrelated controls do not silently count as learning the gesture.
- Dismissal is in-memory per page visit. Returning home, closing a panel and returning to a tab do not reset it. **조작 안내** above the travel slider explicitly reopens/closes it; this button does not set flight distance or start cruise. There is no storage permission dependency.
- Reading panels, data/WebGL failure, hidden tabs and any secret-approach signal suppress the cue. The help button is absent during secret approach. Guidance has no pressure indicator, destination tease or hidden-route instruction.

## Presentation and access

The cue normally occupies the footer-credit strip below the flight deck. Its absolute positioning reserves no new flow height and does not move the hero when it appears. Credits yield their space on narrow screens. Short landscape uses the strip below the header; very short landscape uses a 16px single-line footer cue. Secondary instructions remain available to assistive technology in both compact modes. Safe-area bottom offsets are respected.

The guide has no clickable surface, canvas, raster image, blur filter or input listener. `pointer-events: none` lets gestures and star picking pass through. SVG wheel/spread motion runs three 2.4-second cycles, then stops. Pause and reduced motion use static symbols; hidden guidance runs no icon animation.

The visible guide is a named note. Hidden guidance is `aria-hidden` and inert, without hidden tab stops. The existing deck gains one ordinary keyboard-accessible button with `aria-controls`, `aria-expanded`, a visible focus outline and the guide text as its description while open. Its 44px hit area extends upward, away from the travel slider. No modal, focus stealing or unsolicited repeated live announcement is added.

## Verification and limitations

`npm test`: 127 passing tests. Coverage includes visibility gating, dismissal/reopening, reduced-motion and finite animation rules, pointer-transparent CSS, actual input wiring, SSR markup for all eight visible/touch/quiet combinations, and initially hidden guidance with a disabled help control. The new component reuses the existing SSR test renderer to avoid competing test-server ports. Existing pinch capture/cancellation, keyboard, Earth geography, secret effort, photo articles and startup tests remain passing.

Production build and SEO validation pass: 62 indexable pages, 58 complete articles, 17 photos. No new dependency or GPU resource is added; the lazy Three import boundary and deployment/monthly refresh workflows are unchanged.

Computer-use inspection was attempted, but the Mac was locked and the owner was asked to unlock it. Physical-device layout, font wrapping, gesture playback and screen-reader announcements have not been visually/manually verified. The responsive CSS and SSR/input tests are not a substitute for device screenshots or interaction QA.
