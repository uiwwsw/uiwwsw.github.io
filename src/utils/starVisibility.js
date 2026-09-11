import { Vector3 } from "three";
import { clamp } from "./observatory.js";

export const STAR_NEAR = [2, 12];
export const STAR_EDGE = [0.84, 1.02];
export const STAR_PICK_ALPHA = 0.12;
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function starVisibility(depth, ndcX, ndcY) {
  if (depth <= 0) return 0;
  return (
    smooth(...STAR_NEAR, depth) *
    (1 - smooth(...STAR_EDGE, Math.max(Math.abs(ndcX), Math.abs(ndcY))))
  );
}

// Same world point and camera-space depth as the point shader, not Euclidean
// distance cutoffs or a blanket screen-space exclusion over the Earth.
export function createStarProjector() {
  const view = new Vector3();
  const ndc = new Vector3();
  const ray = new Vector3();
  const toPlanet = new Vector3();
  return (item, camera, width, height, planet, radius, target) => {
    view.set(...item.position).applyMatrix4(camera.matrixWorldInverse);
    const depth = -view.z;
    ndc.copy(view).applyMatrix4(camera.projectionMatrix);
    const visibility = starVisibility(depth, ndc.x, ndc.y);
    if (
      ndc.z < -1 ||
      ndc.z > 1 ||
      !Number.isFinite(visibility) ||
      visibility < STAR_PICK_ALPHA
    )
      return null;
    ray.set(...item.position).sub(camera.position);
    const distance = ray.length();
    if (planet && radius) {
      ray.divideScalar(distance);
      toPlanet.copy(planet).sub(camera.position);
      const along = toPlanet.dot(ray);
      const crossSquared = toPlanet.lengthSq() - along * along;
      if (along > 0 && crossSquared < radius * radius) {
        const front = along - Math.sqrt(radius * radius - crossSquared);
        if (front > 0 && front < distance) return null;
      }
    }
    const result = target || { ...item };
    result.x = ((ndc.x + 1) * width) / 2;
    result.y = ((1 - ndc.y) * height) / 2;
    result.depth = depth;
    result.distance = distance;
    result.visibility = visibility;
    return result;
  };
}

const nearestFirst = (a, b) => a.distance - b.distance;

// Private, reusable per-sector scratch records. The source catalog never
// changes; packStarLabels/nearbyStars take snapshots before UI use.
export function createStarProjectionBuffer(articles, limit) {
  const records = articles.map((article) => ({ ...article }));
  const project = createStarProjector();
  const frame = { projected: [], picks: [] };
  return {
    clear() {
      frame.projected.length = 0;
      frame.picks.length = 0;
      return frame;
    },
    update(camera, width, height, planet, radius) {
      let count = 0;
      for (const record of records) {
        if (project(record, camera, width, height, planet, radius, record))
          frame.projected[count++] = record;
      }
      frame.projected.length = count;
      frame.projected.sort(nearestFirst);
      frame.picks.length = Math.min(frame.projected.length, limit);
      for (let i = 0; i < frame.picks.length; i++)
        frame.picks[i] = frame.projected[i];
      return frame;
    },
  };
}

// Fiber resets clock.elapsedTime when switching never/always after tab hiding.
// Keep UI scheduling monotonic and bounded; ambient pause must not stop picking.
export function createStarUpdateClock() {
  return { now: 0, nextLayout: 0 };
}
export function stepStarUpdateClock(state, delta) {
  if (Number.isFinite(delta) && delta > 0) state.now += Math.min(delta, 0.05);
  const layout = state.now >= state.nextLayout;
  if (layout) state.nextLayout = state.now + 0.2;
  return { now: state.now, layout };
}

export function readSkyObstacles(root, canvasRect) {
  if (!root) return [];
  return [
    ...root.querySelectorAll(
      '.site-header, .explore-heading, .journey-rail, .flight-deck, .flight-guide[data-visible="true"], .bottom-credit',
    ),
  ].flatMap((element) => {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return [];
    return [
      {
        x: rect.left - canvasRect.left,
        y: rect.top - canvasRect.top,
        width: rect.width,
        height: rect.height,
      },
    ];
  });
}
