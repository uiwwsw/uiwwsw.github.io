import { clamp, earthPosition, flightPose } from "./observatory.js";

export const SIGNAL_DISTANCE = 1.32;

export const signalStrength = (distance) =>
  clamp((distance - 1) / (SIGNAL_DISTANCE - 1));

export function advanceFlight(distance, delta) {
  if (!Number.isFinite(delta)) return distance;
  const next = clamp(distance + delta, 0, SIGNAL_DISTANCE);
  // Arriving at Earth is not enough: another deliberate forward input is needed.
  return distance < 1 && next > 1 ? 1 : next;
}

export function signalFlightPose(progress, strength, compact) {
  const pose = flightPose(progress, compact);
  const earth = earthPosition(compact);
  const signal = clamp(strength);
  return {
    position: pose.position.map(
      (value, i) => value + (earth[i] - value) * signal * 0.09,
    ),
    target: pose.target.map(
      (value, i) => value + (earth[i] - value) * signal * 0.14,
    ),
  };
}
