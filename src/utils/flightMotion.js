import { clamp } from "./observatory.js";
import {
  advanceFlight,
  releaseSignal,
  SIGNAL_DISTANCE,
  SIGNAL_REBOUNDS,
  signalStrength,
} from "./secretSignal.js";

export const FLIGHT_SPEED = 0.075;
export const MAX_COAST = 0.045;
export const SIGNAL_EFFORT_RATE = 0.16;

export const createFlightMotion = (distance = 0) => ({
  distance,
  pending: 0,
  pressure: 0,
  time: 0,
  lastPush: -Infinity,
  rebound: 0,
  reboundIndex: 0,
});

export function stopFlightMotion(state) {
  state.pending = 0;
  state.pressure = 0;
}

export function resetFlightMotion(state, distance, allowSignal = true) {
  stopFlightMotion(state);
  state.distance = clamp(distance, 0, allowSignal ? SIGNAL_DISTANCE : 1);
  state.lastPush = -Infinity;
  state.rebound = 0;
  state.reboundIndex = 0;
}

export function queueFlightImpulse(
  state,
  delta,
  { reducedMotion = false, allowSignal = true } = {},
) {
  if (!Number.isFinite(delta) || delta === 0) return;
  const impulse = clamp(delta, -0.12, 0.12);
  if (allowSignal && state.distance >= 1 && impulse > 0) {
    // Only fresh input after arrival can press into the field. A huge wheel
    // event has a tiny bounded buffer; OS momentum cannot bank a long journey.
    state.pending = 0;
    state.pressure = Math.min(0.032, state.pressure + impulse);
    state.lastPush = state.time;
    return;
  }
  state.pressure = 0;
  state.rebound = 0;
  if (state.pending * impulse < 0) state.pending = 0;
  if (reducedMotion || state.distance > 1) {
    state.pending = 0;
    state.distance = allowSignal
      ? advanceFlight(state.distance, impulse)
      : clamp(state.distance + impulse);
  } else {
    state.pending = clamp(state.pending + impulse, -MAX_COAST, MAX_COAST);
  }
}

export function stepFlightMotion(
  state,
  delta,
  { reducedMotion = false, allowSignal = true } = {},
) {
  if (!Number.isFinite(delta) || delta <= 0) return state.distance;
  const dt = Math.min(delta, 0.05);
  state.time += dt;
  if (state.pending) {
    const step =
      Math.sign(state.pending) *
      Math.min(
        Math.abs(state.pending) * (1 - Math.exp(-12 * dt)),
        FLIGHT_SPEED * dt,
      );
    const before = state.distance;
    state.distance = allowSignal
      ? advanceFlight(before, step)
      : clamp(before + step);
    state.pending -= step;
    if (
      Math.abs(state.pending) < 0.00001 ||
      state.distance === 0 ||
      (before < 1 && state.distance === 1) ||
      (!allowSignal && state.distance === 1)
    ) {
      state.pending = 0;
    }
  }
  if (allowSignal && state.distance >= 1 && state.distance < SIGNAL_DISTANCE) {
    if (state.time - state.lastPush > 0.25) state.pressure = 0;
    if (state.rebound > 0 && !reducedMotion) {
      // Three bounded radial recoils, not camera shake. Each is paid for again
      // by forward input; crossing the same shell does not retrigger forever.
      const recoil = Math.min(state.rebound, 0.085 * dt);
      state.distance = Math.max(1, state.distance - recoil);
      state.rebound -= recoil;
      state.pressure = 0;
    } else if (state.pressure > 0) {
      const effort = Math.min(state.pressure, SIGNAL_EFFORT_RATE * dt);
      const next = advanceFlight(state.distance, effort);
      if (state.rebound > 0) {
        // Reduced motion pays the same extra distance with deliberate input,
        // without involuntary camera displacement or a reveal shortcut.
        state.rebound = Math.max(0, state.rebound - (next - state.distance));
      } else {
        state.distance = next;
        if (signalStrength(next) >= SIGNAL_REBOUNDS[state.reboundIndex]) {
          state.rebound = 0.022 + state.reboundIndex * 0.006;
          state.reboundIndex++;
        }
      }
      state.pressure -= effort;
    } else if (!reducedMotion && state.time - state.lastPush > 0.7) {
      state.distance = releaseSignal(state.distance, dt);
    }
  }
  if (state.distance <= 1) {
    state.rebound = 0;
    state.reboundIndex = 0;
  }
  if (state.distance >= SIGNAL_DISTANCE) state.pressure = 0;
  return state.distance;
}
