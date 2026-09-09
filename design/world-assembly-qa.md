# World assembly: fixed camera, offscreen objects

## Corrected direction

The owner clarified that the **world itself** should slide into place. The previous camera descent and changing warm sidelight have been removed. On a fresh load, Earth starts fully beyond the right edge and the entire lunar terrain/rock group below the bottom edge. Earth slides horizontally toward its existing upper-right position; the floor follows upward on a delayed curve. Both settle without overshoot in 5.6 seconds. This is real group translation, not a fade of stationary objects, a CSS canvas transform, a moved camera or a duplicate globe/poster.

The camera remains on the existing opening pose and FOV; its idle drift clock also waits until assembly is complete. User drag, pinch, wheel, keyboard and slider are not locked. Manual input shortens the remaining object placement with a continuous handoff. Reduced motion, motion pause, reading, non-home sectors and secret focus skip immediately. Returning home does not replay the animation.

## Geometry and timing

- `worldAssemblyLayout` derives the fixed opening camera's forward/right/up basis and frustum planes for the current viewport aspect. Earth's offset places its full 1.025× atmospheric radius past the right plane with a margin. The Moon's offset places a conservative terrain-plus-rock AABB below the bottom plane. No hardcoded CSS-pixel shift is used.
- Earth has a 0.2-second lead-in / 4.4-second smooth entry. The floor starts its 4.75-second rise after 0.85 seconds. Both use monotonic, clamped quintic easing with no bounce. Entry curves start after the scene-ready signal, not page load; the existing 1.4-second sky crossfade therefore completes before the first visible planet edge in the desktop/mobile projection samples.
- Projection samples: first visible Earth edge at about 1.55s desktop / 1.87s mobile; actual terrain edge about 3.0s / 2.85s. These are geometry calculations, not measured browser videos.
- One frame clock runs at priority -2; the actual Earth/Moon transforms and geographic focus vector update at -1, before label picking/camera/render. Labels use the planet's current translated position for occlusion instead of its eventual resting position.
- Completed transforms are exactly the established `earthPosition(compact)` and zero introductory Moon offset. Normal Moon travel displacement stays in an inner group; initial assembly never rewrites article coordinates, geography, orientation or flight distance.

## Startup and performance

No new bitmap, texture download, shader program, postprocessing pass or render target was added. Earth remains one surface/cloud/atmosphere group; Moon remains one terrain and its 180-rock instance batch. Mobile ground remains 13,545 vertices, desktop 40,001.

Because both objects start offscreen, their meshes are submitted during the existing hidden startup draws to prepare buffers. The repeat-wrapped Moon texture is preuploaded as before; ordinary frustum culling resumes after assembly. Geometry/texture disposal remains independently scoped. Hidden-tab timing, reduced motion, lazy Three boundary, first-HTML sky, photo articles, SEO and monthly Velog/deploy workflows are preserved.

## Verification and limitation

`npm test`: 120 passing tests. Production build, SEO validation (62 indexable pages, 58 articles, 17 photos) and `git diff --check` pass. Three remains outside the homepage entry's static import graph.

`tests/worldAssembly.test.js` replaces the superseded landing tests. Checks include full sphere/AABB exclusion at 320×568, 390×844, 430×932, 768×1024, 1440×900, 3440×1440 and 844×390; fixed camera basis/projection; horizontal Earth and upward Moon trajectories; staged entry; 30/60/120 Hz timing; waiting/hidden/resume; interruptions/skips; exact resting transforms; resize state retention; single-object/resource/picking wiring.

The Mac was locked when computer-use verification was attempted, and the owner was asked to unlock it. Live refresh recordings and actual mobile/desktop motion quality are not visually verified. These frustum/trajectory tests establish that objects really start outside the screen and move into it, but are not a physical-device performance or perceptual-quality measurement.
