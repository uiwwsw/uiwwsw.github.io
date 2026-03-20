import * as THREE from 'three';

export const fontUrl = '/fonts/SUITE-Variable.ttf';
export const CRUISE_SPEED = 30;
export const MAX_SPEED = 230;
export const TUNNEL_LENGTH = 3200;
export const WRAP_RADIUS = 920;
export const WRAP_HEIGHT = 680;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function hashString(input) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createRng(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleTunnelCrossSection(articleId, wrapIndex) {
  const rng = createRng(hashString(`${articleId}:${wrapIndex}`));
  const theta = rng() * Math.PI * 2;
  const radius = 130 + Math.pow(rng(), 0.72) * (WRAP_RADIUS - 160);

  return {
    x: Math.cos(theta) * radius,
    y: (rng() - 0.5) * WRAP_HEIGHT * 1.5
  };
}

export function findFocusArticle(camera, clusterMap) {
  const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  const worldPosition = new THREE.Vector3();
  const projectedPosition = new THREE.Vector3();
  let bestArticle = null;
  let bestScore = Number.POSITIVE_INFINITY;

  clusterMap.forEach(({ article, ref }) => {
    if (!ref.current) return;

    ref.current.getWorldPosition(worldPosition);

    const direction = worldPosition.clone().sub(camera.position);
    const distance = direction.length();

    if (distance < 1) return;

    const forwardness = direction.normalize().dot(cameraForward);

    if (forwardness < -0.1) return;

    projectedPosition.copy(worldPosition).project(camera);

    if (
      projectedPosition.z < -1
      || projectedPosition.z > 1
      || projectedPosition.x < -1
      || projectedPosition.x > 1
      || projectedPosition.y < -1
      || projectedPosition.y > 1
    ) {
      return;
    }

    const score = distance - forwardness * 200;

    if (score < bestScore) {
      bestScore = score;
      bestArticle = article;
    }
  });

  return bestArticle;
}
