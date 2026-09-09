# Lunar arrival and Earth reveal

## Direction

The opening is a camera-led descent, not the whole Moon appearing at once or a CSS-translated floor. The observer starts slightly higher/back/left, looking into the upper-left sky. Over 7.2 seconds, a quintic rest-to-rest curve lowers the observer and settles the viewing direction toward the existing upper-right Earth composition. No roll, shake, FOV pulse, sun-disc teleport or full-screen exposure flash is added.

The ground stays in world space during the arrival. An asymmetric left ridge is part of the same deterministic terrain mesh and gives the edge an earlier reveal on wide screens. Rocks use that same height function. The existing sidelight shifts from restrained warm sunlight to its usual cool color, with intensity only 3.1→2.8; the final ground material is a more neutral regolith gray. Earth lighting/orientation, article positions and the established exploration route remain unchanged. The decorative Earth caption fades in after the camera settles, while the real hero/navigation remain available from the first HTML.

## Lifecycle and control

- One shared reference-backed clock runs at frame priority -2, before camera/light/ground updates and the existing render controller at +1. Only one completion notification updates React; there is no per-frame React animation state.
- The clock waits for the actual scene-ready signal, not a page-load timer. Texture/compile waits do not consume the landing. The existing 1.4-second sky-to-WebGL crossfade overlaps its beginning; cloud/night details still load independently after that crossfade.
- Hidden tabs stop rendering and the landing clock. Large resume deltas are capped, so resuming cannot jump to the end.
- Pinch, drag, wheel and keyboard record manual takeover. The cinematic offset decays continuously over a short handoff; normal look/travel is never gated behind the animation. Input before readiness skips the arrival behind the backdrop.
- Compass/Home/sector navigation also mark takeover. Reading panels, non-home sectors and reduced motion skip the sequence permanently. The motion-pause control also skips it. Closing a panel or returning home never replays it; a new page load can.
- Pinch-only mobile travel, one-finger free look, Korean reader, keyboard/slider, Earth-only secret focus and non-WebGL fallback remain intact.

## Rendering budget and first-visible-ground preparation

- One terrain mesh and the same 180-rock instance batch; no new texture, network request, render target or postprocessing pass.
- Mobile segments 128×104 produce 13,545 vertices instead of 40,001, about 66% fewer. Desktop keeps 220×180 segments / 40,001 vertices. This is a geometry count, not a measured FPS improvement.
- The Moon starts outside the camera frustum. Its cloned, repeat-wrapped texture is explicitly uploaded and both ground/rock buffers are submitted during the startup draws, before their first visible edge. Normal culling resumes when arrival/handoff completes.
- Geometry and cloned texture have independent disposal effects. A compact/desktop resize does not dispose a texture that is still shared by the next terrain geometry.

## Automated checks

`npm test`: 120 passing tests. Production build, `git diff --check` and SEO validation pass (62 indexable pages, 58 complete articles, 17 photos). The entry still imports only the vendor chunk statically; the landing code stays in the deferred scene. Deployment/monthly Velog workflows and article data are unchanged.

`tests/landingMotion.test.js` covers waiting/hidden/resume behavior, 30/60/120 Hz timing, one-shot completion, manual interruption, early skip, reduced-motion/panel/sector skip, unchanged final exploration pose, smooth angular changes, light bounds, deterministic terrain and render-budget/wiring regressions.

Actual Three.js perspective projections were calculated for desktop 1440×900, phone 320×568 / 390×844 / 430×932 and landscape 844×390. The entire ground begins below the viewport, enters through its lower edge, and finishes with its highest silhouette below the central sky area. In the wide-screen sample, the left ridge enters before the right ground edge. Desktop/mobile camera-path samples stay at least eight world units above terrain and safely outside Earth; Earth's center moves continuously into the upper-right. These are geometry/projection tests, not screenshots or perceptual quality measurements.

## Live-verification limitation

The Mac was locked when computer-use verification was attempted, and the owner was asked to unlock it. Cold/warm refresh videos, actual GPU upload behavior, mobile frame time and physical pinch/drag handoff have not been verified visually. Still check the full opening and interrupt it at 0/2/4/6 seconds on real desktop/mobile browsers, plus reduced motion, immediate article open, hidden-tab resume and orientation changes.
