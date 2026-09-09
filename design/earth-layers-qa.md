# Earth geography / cloud separation — 2026-09-09

## Investigation

- The scene instantiates Earth once. Its opaque surface samples day/night textures at the same unshifted SphereGeometry UV; the old atmosphere shader contains no geography sampler.
- Inspected the three local 4096 × 2048 textures, including a diagnostic view of the packed map's blue channel. The source maps each contain one equirectangular world. Blue contains cloud patterns, not a second day map. The channel convention was cross-checked against the [official Three.js Earth example](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgpu_tsl_earth.html).
- Actual SphereGeometry vertices and UVs agree with the geographic conversion at Korea, Japan, China, Australia, Siberia, Greenwich and both sides of the longitude seam. Korea remains centered and upright during the existing bounded sway and flight in desktop/mobile layouts; Japan is right/east and China left/west.
- The old shader painted moving clouds directly into the terrain color with up to **88%** white mixing. Its `0.0018` UV cycles/second corresponds to **38.88° per minute**. It also used a 15% shadow offset by 1.44° longitude. This could create broad, displaced bright/dark regions that resemble an extra land layer. This is a code-confirmed compositing weakness, not a live reproduction of the user's exact reported image.

## Fix

- Keep one opaque `earth-surface` with unchanged geographic day/night UVs and the same Korea orientation.
- Move cloud color into a named, thin `earth-clouds` shell at 1.004 × Earth radius, inside the 1.025 atmosphere. Sample only the existing packed B/cloud channel, never the R/elevation or G/roughness channels. Normal alpha blending is capped at 36%, attenuated at the limb and on the dark side. Front-side rendering and a small polygon offset avoid drawing a rear cloud copy or fighting the ground depth; clouds do not pick pointer events or write depth.
- Slow relative cloud drift to `0.00008` cycles/second (**1.728°/minute**, 22.5× slower), shared by clouds and their shadow. Reduce shadow strength to 6% with a much smaller offset. Surface color is no longer mixed with moving cloud-white regions.
- Put surface/cloud/atmosphere under the same sway group. Explicitly configure map repeat 1×1, zero offset/rotation, latitude clamping, longitude seam wrapping, flipY and numeric color space. The existing custom color decode remains unchanged.
- One additional GPU draw, no new images or runtime dependencies. Existing pause/reduced-motion clocks, star coordinates, input behavior, reading content, SEO and deployment workflows are unchanged.

## Verification and limitation

- **75 automated tests pass**, including geographic anchor/UV agreement, Korea centering, Japan/China left-right checks, explicit one-map coverage, cloud channel selection, opacity/shadow bounds and one opaque geographic mesh.
- Production build and SEO validation pass: 62 pages, 58 complete articles, 17 photos.
- Mac computer-use remained locked; the owner was asked to unlock it or send a screenshot. No live WebGL shader compilation, before/after screenshot or physical-device verification was possible in this revision. The precise appearance reported by the user remains unconfirmed. If it persists, a screenshot is needed to distinguish a texture artifact from cloud appearance or another device-specific rendering issue.
