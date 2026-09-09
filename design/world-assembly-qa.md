# World assembly: fixed camera, offscreen objects

## Corrected direction

The owner clarified that the **world itself** should slide into place, then requested a faster, rhythmic cinematic start. The previous camera descent and changing warm sidelight remain removed. On a fresh load, Earth starts fully beyond the right edge and the entire lunar terrain/rock group below the bottom edge. Earth slides horizontally toward its existing upper-right position; the floor follows upward on a delayed curve. Both now settle without overshoot in **1.8 seconds**, down from 5.6. This is real group translation, not a fade of stationary objects, a CSS canvas transform, a moved camera or a duplicate globe/poster.

The camera remains on the existing opening pose and FOV; its idle drift clock also waits until assembly is complete. User drag, pinch, wheel, keyboard and slider are not locked. Manual input shortens the remaining object placement with a continuous handoff. Reduced motion, motion pause, reading, non-home sectors and secret focus skip immediately. Returning home does not replay the animation.

## Beat sheet

All seconds below start at **actual 3D readiness**, after critical maps, shader warm-up and two completed draws. This is not a promise of a fixed navigation-to-visible time on a slow network. The first HTML already contains the lightweight star backdrop and usable interface; there is no added loading timer or autoplay sound.

| Time | Beat |
| --- | --- |
| 0–0.32s | The rendered sky replaces the initial backdrop with a short ease-out crossfade. Earth begins moving on the first ready frame, with no lead-in. |
| About 0.05–0.18s | The first Earth edge crosses the right border, depending on the viewport. |
| 0.18s / about 0.40–0.45s | The Moon starts its upward translation / the terrain edge becomes visible from below. |
| 1.25s | Earth reaches its exact existing position with zero terminal velocity. |
| 1.80s | Moon placement completes. Normal idle camera drift resumes; optional cloud/night texture loading can begin. |
| 1.80–2.08s | The small Earth caption fades in to finish the composition. |

The two moving objects use cubic ease-out: a brisk approach from offscreen, followed by a progressively softer finish. The old quintic rest-to-rest curve spent too much time accelerating invisibly (Earth edge about 1.55s desktop / 1.87s mobile; floor about 3.0s / 2.85s). The new curves remove that empty-feeling stretch without flashes, shaking, bounce or an abrupt stop. The decorative caption does not delay the already available navigation or hero text.

## Geometry and timing

- `worldAssemblyLayout` derives the fixed opening camera's forward/right/up basis and frustum planes for the current viewport aspect. Earth's offset places its full 1.025× atmospheric radius past the right plane with a margin. The Moon's offset places a conservative terrain-plus-rock AABB below the bottom plane. No hardcoded CSS-pixel shift is used.
- `ASSEMBLY_TIMING` stores the staggered object start times and durations together. Earth has no lead-in and a 1.25-second entry; the floor has a 0.18-second lead-in and a 1.62-second rise. Remaining offsets are monotonically clamped; final transforms are exact, with no overshoot or last-frame snap.
- Projection samples at 60 Hz: first visible Earth edge about 0.08s desktop (1440×900) / 0.13s mobile (390×844); actual terrain edge about 0.45s / 0.40s. Across all seven test viewports, Earth enters within 0.2s and the floor follows at least 0.2s later and before 0.65s at 30/60/120 Hz. These are geometry calculations, not measured browser videos or material-brightness checks.
- One frame clock runs at priority -2; the actual Earth/Moon transforms and geographic focus vector update at -1, before label picking/camera/render. Labels use the planet's current translated position for occlusion instead of its eventual resting position.
- Completed transforms are exactly the established `earthPosition(compact)` and zero introductory Moon offset. Normal Moon travel displacement stays in an inner group; initial assembly never rewrites article coordinates, geography, orientation or flight distance.

## Startup and performance

No new bitmap, texture download, shader program, postprocessing pass or render target was added. Earth remains one surface/cloud/atmosphere group; Moon remains one terrain and its 180-rock instance batch. Mobile ground remains 13,545 vertices, desktop 40,001.

Because both objects start offscreen, their meshes are submitted during the existing hidden startup draws to prepare buffers. The repeat-wrapped Moon texture is preuploaded as before; ordinary frustum culling resumes after assembly. Geometry/texture disposal remains independently scoped. Hidden-tab timing, reduced motion, lazy Three boundary, first-HTML sky, photo articles, SEO and monthly Velog/deploy workflows are preserved.

The large optional cloud/night maps now wait for **both** the sky crossfade and object assembly to finish. Shortening the crossfade therefore does not bring their download/decode/GPU uploads onto the entry beats. Their existing gradual detail blend and independent error boundary remain intact; they cannot delay the base scene or restart the intro. No page-load timeout is used to force an unready renderer onto the screen.

## Verification and limitation

`npm test`: 121 passing tests. Production build, SEO validation (62 indexable pages, 58 articles, 17 photos) and `git diff --check` pass. Three remains outside the homepage entry's static import graph.

`tests/worldAssembly.test.js` replaces the superseded landing tests. Checks include full sphere/AABB exclusion at 320×568, 390×844, 430×932, 768×1024, 1440×900, 3440×1440 and 844×390; fixed camera basis/projection; horizontal Earth and upward Moon trajectories; visible entry timing on all seven viewports at 30/60/120 Hz; immediate first-frame movement and soft endpoints; waiting/hidden/resume; interruptions/skips; exact resting transforms; resize state retention; single-object/resource/picking wiring. Startup regressions also check the shorter crossfade and the deferred enhancement gate.

The Mac was locked when computer-use verification was attempted, and the owner was asked to unlock it. Live refresh recordings and actual mobile/desktop motion quality are not visually verified. These frustum/trajectory tests establish that objects really start outside the screen and move into it, but are not a physical-device performance or perceptual-quality measurement.
