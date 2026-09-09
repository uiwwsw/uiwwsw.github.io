# Planet textures

Downloaded from the Three.js example asset collection:
https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets

- `earth-day.jpg`: `earth_day_4096.jpg`
- `earth-night.jpg`: `earth_night_4096.jpg`
- `earth-surface.jpg`: `earth_bump_roughness_clouds_4096.jpg` (R: elevation, G: roughness, B: clouds)
- `moon.jpg`: `moon_1024.jpg`

Earth textures are by Solar System Scope, resized/merged for the Three.js Earth example, licensed CC BY 4.0:
https://www.solarsystemscope.com/textures/
https://creativecommons.org/licenses/by/4.0/

Earth shading is an original GLSL implementation inspired by the Three.js TSL Earth example:
https://threejs.org/examples/webgpu_tsl_earth.html
The WebGL renderer preserves compatibility with the existing Three.js / React Three Fiber versions.

Rendering separation: day/night geography is sampled once at the unshifted
SphereGeometry UV. The packed map's **B channel only** drives a thin transparent
cloud shell and a faint, aligned shadow; its R/G land/elevation information must
never drift over the surface. All three maps use a single 1×1 equirectangular
mapping, repeated only at the longitude seam and clamped at the poles. Korea's
36° N / 128° E center is established by rotating the shared geographic frame,
not by offsetting or repeating the terrain maps.

The moon asset is distributed in the Three.js example collection under its repository license:
https://github.com/mrdoob/three.js/blob/dev/LICENSE
No game assets are used.
