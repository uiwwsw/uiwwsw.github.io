import { clamp } from "./observatory.js";
import { geographicSurfacePoint } from "./earthOrientation.js";

// Approximate city center, in the same geographic frame as the single Earth
// surface. This is an artistic regional light, not a political boundary map.
export const SEOUL = { latitude: 37.5665, longitude: 126.978 };
export const seoulSurfacePoint = () =>
  geographicSurfacePoint(SEOUL.latitude, SEOUL.longitude);

const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

// No clue during ordinary travel. No timed pulse, ring, label or new geometry:
// the existing surface responds continuously to approach and to release.
export const seoulGlowStrength = (strength) =>
  smooth((strength - 0.035) / 0.965);
export const seoulFocusBlend = (strength) => smooth((strength - 0.24) / 0.66);

export const SEOUL_GLOW_WIDTH = {
  core: 1 - Math.cos((0.65 * Math.PI) / 180),
  region: 1 - Math.cos((2.8 * Math.PI) / 180),
};

// CPU counterpart tests the exact spatial envelope used by the fragment shader.
export function seoulGlowEnvelope(alignment) {
  const distance = Math.max(0, 1 - clamp(alignment, -1, 1));
  return {
    core: Math.exp((-3 * distance) / SEOUL_GLOW_WIDTH.core),
    region: Math.exp((-3 * distance) / SEOUL_GLOW_WIDTH.region),
  };
}

export const seoulGlowShader = `
  uniform float signalGlow;
  uniform vec3 seoulDirection;
  varying vec3 vLocalNormal;
  vec3 seoulLight() {
    if (signalGlow <= 0.) return vec3(0.);
    float distance = max(0., 1. - dot(normalize(vLocalNormal), seoulDirection));
    float core = exp(-3. * distance / ${SEOUL_GLOW_WIDTH.core.toFixed(10)});
    float region = exp(-3. * distance / ${SEOUL_GLOW_WIDTH.region.toFixed(10)});
    return signalGlow * (vec3(1., .72, .38) * core * .85
      + vec3(.3, .57, .7) * region * .18);
  }
`;
