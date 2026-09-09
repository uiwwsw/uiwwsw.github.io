import { clamp } from "./observatory.js";

export const LANDING_DURATION = 7.2;
const smootherstep = (value) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const createLandingMotion = () => ({
  phase: "waiting",
  elapsed: 0,
  amount: 1,
});

// One shared, visible-frame clock: never consume the approach while textures
// compile or the tab is hidden. Navigation/prefs can permanently skip it.
export function stepLandingMotion(
  state,
  delta,
  { ready = false, paused = false, skip = false, interrupted = false } = {},
) {
  if (state.phase === "done") return state.amount;
  if (skip || (interrupted && state.phase === "waiting")) {
    state.phase = "done";
    state.amount = 0;
    return 0;
  }
  if (interrupted) state.phase = "handoff";
  if (!ready || paused || !Number.isFinite(delta) || delta <= 0)
    return state.amount;
  const dt = Math.min(delta, 0.05);
  if (state.phase === "waiting") state.phase = "landing";
  if (state.phase === "handoff") {
    // Remove only the cinematic offset; user look/travel remain live throughout.
    state.amount *= Math.exp(-8 * dt);
    if (state.amount < 0.001) state.amount = 0;
  } else {
    state.elapsed = Math.min(LANDING_DURATION, state.elapsed + dt);
    state.amount = 1 - smootherstep(state.elapsed / LANDING_DURATION);
  }
  if (state.amount === 0) state.phase = "done";
  return state.amount;
}

// Camera-space storytelling, not a CSS slide or a moving Moon: descend while
// turning gently from the upper-left sky toward the established Earth framing.
// No roll, FOV pulse, camera shake or changed endpoint for normal exploration.
export function landingPose(pose, amount, compact = false) {
  const a = clamp(amount);
  const positionOffset = compact ? [-2.6, 5.5, 7] : [-4.5, 6, 7];
  const targetOffset = compact ? [-10, 53, 0] : [-18, 36, 0];
  return {
    position: pose.position.map((value, i) => value + positionOffset[i] * a),
    target: pose.target.map((value, i) => value + targetOffset[i] * a),
  };
}

export const landingLight = (amount) => ({
  warmth: clamp(amount),
  intensity: 2.8 + clamp(amount) * 0.3,
});
