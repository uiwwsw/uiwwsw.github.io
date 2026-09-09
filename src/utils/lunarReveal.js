import { clamp } from "./observatory.js";

export const LUNAR_REVEAL_EDGE = { start: -0.06, span: 0.62, feather: 0.055 };

// CPU counterpart for edge/continuity tests; height is normalized from bottom.
export function lunarRevealOpacity(height, progress) {
  if (progress >= 1) return 1;
  const { start, span, feather } = LUNAR_REVEAL_EDGE;
  const edge = start + span * clamp(progress);
  const t = clamp((height - edge + feather) / (2 * feather));
  return 1 - t * t * (3 - 2 * t);
}

// Share one screen-space edge between terrain and instanced rocks so they stay
// attached. Only the narrow advancing edge is translucent, never the whole Moon.
export function patchLunarRevealShader(shader, uniforms) {
  shader.uniforms.uLunarReveal = uniforms.progress;
  shader.uniforms.uLunarViewportHeight = uniforms.height;
  const { start, span, feather } = LUNAR_REVEAL_EDGE;
  shader.fragmentShader = `
    uniform float uLunarReveal;
    uniform float uLunarViewportHeight;
    ${shader.fragmentShader}
  `.replace(
    "#include <alphatest_fragment>",
    `
    if (uLunarReveal < 1.) {
      float edge = ${start} + ${span} * uLunarReveal;
      float height = gl_FragCoord.y / max(1., uLunarViewportHeight);
      float emergence = 1. - smoothstep(edge - ${feather}, edge + ${feather}, height);
      if (emergence <= .001) discard;
      diffuseColor.a *= emergence;
    }
    #include <alphatest_fragment>
  `,
  );
}
