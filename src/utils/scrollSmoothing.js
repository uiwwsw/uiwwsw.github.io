// Analytic critically damped tracking: wheel events set a target, the renderer
// samples continuous position and velocity. No React updates per display frame.
export function createScrollSmoothing(value = 0) {
  return { value, velocity: 0 };
}
export function stepScrollSmoothing(state, target, delta, immediate = false) {
  if (immediate) {
    state.value = target;
    state.velocity = 0;
    return target;
  }
  if (!Number.isFinite(delta) || delta <= 0) return state.value;
  const dt = Math.min(delta, .05);
  const omega = 24;
  const offset = state.value - target;
  const term = state.velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  state.value = target + (offset + term * dt) * decay;
  state.velocity = (state.velocity - omega * term * dt) * decay;
  if (Math.abs(state.value - target) < .0001 && Math.abs(state.velocity) < .002) {
    state.value = target;
    state.velocity = 0;
  }
  return state.value;
}
