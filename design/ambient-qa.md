# Living ambient space — 2026-09-09

## Direction

The camera does not need to move for the scene to feel alive. Add motion at separate depths while keeping the lunar composition, Korea-facing Earth and real article coordinates intact:

- Advected procedural nebula noise with local, slow luminance changes. The existing two FBM samples are reused; no extra full-screen render pass or animated bitmap is introduced.
- Independent low-frequency background star shimmer and tiny diffraction rays on brighter stars. Article stars vary only in luminosity, not their saved/pickable positions.
- One world-aligned GPU dust volume: 360 particles on desktop, 180 at the mobile breakpoint. Particles drift at varied velocities, use perspective size attenuation, fade before wrapping and do not intercept pointer events. This is decorative atmosphere, not extra writing.
- A single brief distant light trail after 7 seconds of active time, then approximately every 29 seconds. Smooth opacity envelope, no stacked trails or screen flash. It is depth-tested behind Earth.
- Moving cloud shadows, a subtle atmospheric rim modulation and a faint polar color curtain. Land orientation and its bounded sway are unchanged.

These are artistic/game-like atmosphere effects, not a claim of physically accurate vacuum twinkling, lunar weather, or meteor behavior.

## Controls and budget

- All effect clocks honor the existing pause/reduced-motion/panel state. Pause preserves the camera's current idle offset instead of drifting back toward zero.
- A hidden document pauses travel/effects and sets the canvas frame loop to `never`; visible documents resume without elapsed-time catch-up. Frame delta is clamped to 50 ms.
- No new image/video downloads, dependencies, postprocessing targets or per-particle React state. Dust adds one draw; the rare trail adds one while visible.
- DEV-only `?ambient=1` exposes the ambient clock, status, particle count and trail visibility alongside the existing FPS/draw counters. Production does not display this diagnostic overlay.

## Verification

- 55 tests pass, including deterministic/bounded dust, idle clock advancement, pause/resume and invalid/large delta handling, gradual periodic trail timing and reduced-motion suppression. Existing tests still cover Korea orientation, article coordinates, touch/keyboard controls, scaling to 3,000 posts and SEO.
- Desktop in-app browser: observed 58–60 FPS, 12 draws at rest / 13 during the trail, no shader errors. Idle screenshots at approximately 8 and 70 seconds show different nebula/cloud states with the camera still at the Moon. The first distant trail was visible in the 8-second sample.
- Pause: ambient clock remained exactly `71.40s` across separated observations; resume advanced it. Opening the archive changed it to `paused`.
- Mobile viewport 390 × 844: 180 dust particles, 60 FPS observed on the desktop host, no horizontal overflow. This is responsive emulation, not a physical-phone performance guarantee.
- `?motion=reduce&ambient=1`: ambient clock stayed at `0.00s`, trail remained absent and motion control was disabled/pressed. Keyboard slider movement still worked.
- `?webgl=off&article=서울역`: zero canvases, six photo elements, functional reading panel, and no horizontal overflow. Static SEO article pages are unaffected.

Performance varies by device/GPU. Existing DPR limits remain in place; the implementation does not promise a frame rate on every phone.
