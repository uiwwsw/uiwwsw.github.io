import {
  clamp,
  earthPosition,
  EARTH_RADIUS,
  flightPose,
} from "./observatory.js";

// Seconds from the real scene-ready signal, not from navigation. Travel starts
// briskly while still offscreen and decelerates to zero velocity on arrival.
// A long rest-to-rest ease used to hide the first Earth edge for almost 2s.
export const ASSEMBLY_TIMING = {
  earth: { start: 0, duration: 1.25 },
  ground: { start: 0.18, duration: 1.62 },
};
export const ASSEMBLY_DURATION =
  ASSEMBLY_TIMING.ground.start + ASSEMBLY_TIMING.ground.duration;
const remainingOffset = (elapsed, { start, duration }) =>
  (1 - clamp((elapsed - start) / duration)) ** 3;

const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const normalize = (v) => v.map((value) => value / Math.hypot(...v));
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// Calibrate against the fixed opening frustum, never against a moving camera.
// The entire atmosphere sphere starts past the right plane; terrain AND rocks
// start below the bottom plane. Pixel offsets would fail on wide/tall screens.
export function worldAssemblyLayout(compact, aspect = 1) {
  const pose = flightPose(0, compact);
  const forward = normalize(pose.target.map((v, i) => v - pose.position[i]));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const tanV = Math.tan(((compact ? 58 : 46) * Math.PI) / 360);
  const tanH = tanV * (Number.isFinite(aspect) && aspect > 0 ? aspect : 1);
  const baseEarth = earthPosition(compact);
  const relative = baseEarth.map((v, i) => v - pose.position[i]);
  const depth = dot(relative, forward);
  const radius = EARTH_RADIUS * 1.025;
  const margin = Math.max(8, depth * 0.12);
  const shift = Math.max(
    0,
    depth * tanH + radius * Math.hypot(1, tanH) + margin - dot(relative, right),
  );
  let lowestPlaneClearance = -Infinity;
  // A conservative ground/rock AABB, including the portion behind the camera.
  for (const x of [-132, 132])
    for (const z of [-82, 142]) {
      const p = [x, 4, z].map((v, i) => v - pose.position[i]);
      lowestPlaneClearance = Math.max(
        lowestPlaneClearance,
        dot(p, up) + dot(p, forward) * tanV,
      );
    }
  const drop = (lowestPlaneClearance + 12) / (up[1] + forward[1] * tanV);
  return {
    baseEarth,
    earthOffset: right.map((v) => v * shift),
    groundOffset: -drop,
  };
}

export const createWorldAssembly = (compact = false) => ({
  phase: "waiting",
  elapsed: 0,
  earth: 1,
  ground: 1,
  layout: worldAssemblyLayout(compact),
});

export function stepWorldAssembly(
  state,
  delta,
  { ready = false, paused = false, skip = false, interrupted = false } = {},
) {
  if (state.phase === "done") return;
  if (skip || (interrupted && state.phase === "waiting")) {
    state.phase = "done";
    state.earth = state.ground = 0;
    return;
  }
  if (interrupted) state.phase = "handoff";
  if (!ready || paused || !Number.isFinite(delta) || delta <= 0) return;
  const dt = Math.min(delta, 0.05);
  if (state.phase === "waiting") state.phase = "assembling";
  if (state.phase === "handoff") {
    for (const key of ["earth", "ground"]) {
      state[key] *= Math.exp(-8 * dt);
      if (state[key] < 0.001) state[key] = 0;
    }
  } else {
    state.elapsed = Math.min(ASSEMBLY_DURATION, state.elapsed + dt);
    for (const key of ["earth", "ground"])
      state[key] = Math.min(
        state[key],
        remainingOffset(state.elapsed, ASSEMBLY_TIMING[key]),
      );
  }
  if (state.elapsed === ASSEMBLY_DURATION) state.earth = state.ground = 0;
  if (state.earth === 0 && state.ground === 0) {
    if (state.phase === "assembling") state.elapsed = ASSEMBLY_DURATION;
    state.phase = "done";
  }
}

export const assemblyEarthPosition = ({ baseEarth, earthOffset }, amount) =>
  baseEarth.map((v, i) => v + earthOffset[i] * clamp(amount));
export const assemblyGroundY = ({ groundOffset }, amount) =>
  clamp(amount) === 0 ? 0 : groundOffset * clamp(amount);
