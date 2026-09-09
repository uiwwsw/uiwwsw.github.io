import { seededRandom } from "./observatory.js";

export function createLunarCraters() {
  const random = seededRandom(1997);
  return Array.from({ length: 48 }, () => ({
    x: (random() - 0.5) * 200,
    z: random() * 170 - 72,
    radius: 3 + random() * 12,
  }));
}

export function lunarHeight(x, z, craters) {
  let h =
    Math.sin(x * 0.08 + z * 0.03) * 1.5 + Math.cos(z * 0.13 - x * 0.04) * 1.1;
  h +=
    Math.sin(x * 0.27 + z * 0.22) * 0.34 + Math.sin(x * 0.9 - z * 0.6) * 0.12;
  // An asymmetric left ridge gives the arriving floor a near/mid/far silhouette.
  // It is part of the same ground mesh, never another Moon layer.
  h += 5.2 * Math.exp(-Math.pow((x + 54) / 32, 2) - Math.pow((z + 44) / 22, 2));
  for (const crater of craters) {
    const d = Math.hypot(x - crater.x, z - crater.z) / crater.radius;
    if (d < 1.5)
      h +=
        (-Math.exp(-d * d * 3.8) * 0.42 +
          Math.exp(-Math.pow((d - 0.92) * 5.5, 2)) * 0.2) *
        crater.radius;
  }
  return h - 10;
}

export const lunarSegments = (compact) => (compact ? [128, 104] : [220, 180]);
