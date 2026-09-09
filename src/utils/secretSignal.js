import { clamp, earthPosition, flightPose, EARTH_RADIUS } from "./observatory.js";

export const SIGNAL_DISTANCE = 1.32;
export const SIGNAL_REBOUNDS = [0.26, 0.55, 0.8];

export const signalStrength = (distance) =>
  clamp((distance - 1) / (SIGNAL_DISTANCE - 1));

export function advanceFlight(distance, delta) {
  if (!Number.isFinite(delta)) return distance;
  // The last stretch is pressure against a field, not more normal travel.
  // Stronger resistance near the signal; reverse input always remains easy.
  const effort =
    delta > 0 && distance >= 1
      ? (Math.min(delta, 0.12) * 0.15) / (1 + 5 * signalStrength(distance) ** 2)
      : delta;
  const next = clamp(distance + effort, 0, SIGNAL_DISTANCE);
  // Arriving at Earth is not enough: another deliberate forward input is needed.
  return distance < 1 && next > 1 ? 1 : next;
}

export function releaseSignal(distance, delta) {
  if (distance <= 1 || distance >= SIGNAL_DISTANCE) return distance;
  return Math.max(
    1,
    distance - (0.035 + signalStrength(distance) * 0.04) * delta,
  );
}

export function signalFlightPose(progress, strength, compact) {
  const pose = flightPose(progress, compact);
  const earth = earthPosition(compact);
  const signal = clamp(strength);
  const separation = Math.hypot(
    ...pose.position.map((value, i) => value - earth[i]),
  );
  // Discovery really is close to Earth, without crossing the atmosphere.
  const approach = signal * Math.max(0, 1 - (EARTH_RADIUS + 5.5) / separation);
  return {
    position: pose.position.map(
      (value, i) => value + (earth[i] - value) * approach,
    ),
    target: pose.target.map(
      (value, i) => value + (earth[i] - value) * signal,
    ),
  };
}
