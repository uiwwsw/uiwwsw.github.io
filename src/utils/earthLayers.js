import { ClampToEdgeWrapping, RepeatWrapping, NoColorSpace } from "three";

export const CLOUD_OPACITY = 0.36;
export const CLOUD_SHELL_SCALE = 1.004;
export const CLOUD_SHADOW_STRENGTH = 0.06;
export const CLOUD_CYCLES_PER_SECOND = 0.00008;

export function earthCloudOffset(elapsed) {
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  return (elapsed * CLOUD_CYCLES_PER_SECOND) % 1;
}

// Set explicitly on the loaded maps, before useTexture uploads them. The
// custom surface shader decodes color itself; the packed map is numeric data.
export function configureEarthTextures(textures) {
  for (const texture of textures) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    texture.center.set(0, 0);
    texture.rotation = 0;
    texture.flipY = true;
    texture.colorSpace = NoColorSpace;
    texture.updateMatrix();
    texture.needsUpdate = true;
  }
}

// Both the cloud shell and its faint ground shadow use exactly this UV frame.
// Only B is clouds; R/G contain fixed elevation and roughness/land information.
export const cloudSampling = `
  uniform sampler2D surfaceMap;
  uniform float cloudOffset;
  float cloudDensity(vec2 mapUv, vec2 shadowOffset) {
    vec2 cloudUv = vec2(fract(mapUv.x + cloudOffset + shadowOffset.x), clamp(mapUv.y + shadowOffset.y, 0.0, 1.0));
    return smoothstep(0.38, 0.96, texture2D(surfaceMap, cloudUv).b);
  }
`;
