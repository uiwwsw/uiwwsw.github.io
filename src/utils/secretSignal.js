import {
  clamp,
  earthPosition,
  flightPose,
  EARTH_RADIUS,
} from "./observatory.js";

export const SIGNAL_DISTANCE = 1.32;
export const EARTH_FOCUS_ALTITUDE = 3.8;

export const signalStrength = (distance) =>
  clamp((distance - 1) / (SIGNAL_DISTANCE - 1));

// This is a visual mode blend, not a displayed progress/hint. Ordinary travel
// never activates it; the opening portion of additional approach isolates Earth.
export function earthFocusBlend(strength) {
  const t = clamp(strength / 0.24);
  return t * t * (3 - 2 * t);
}

export function earthFocusFov(strength, compact) {
  const initial = compact ? 58 : 46;
  return initial + ((compact ? 38 : 32) - initial) * earthFocusBlend(strength);
}

export function advanceFlight(distance, delta) {
  if (!Number.isFinite(delta)) return distance;
  // The last stretch is pressure against a field, not more normal travel.
  // Stronger resistance near the signal; reverse input always remains easy.
  const effort =
    delta > 0 && distance >= 1
      ? (Math.min(delta, 0.08) * 0.4) / (1 + 2.2 * signalStrength(distance) ** 2)
      : delta;
  const next = clamp(distance + effort, 0, SIGNAL_DISTANCE);
  // Arriving at Earth is not enough: another deliberate forward input is needed.
  return distance < 1 && next > 1 ? 1 : next;
}

export function releaseSignal(distance, delta) {
  if (distance <= 1 || distance >= SIGNAL_DISTANCE) return distance;
  if (!Number.isFinite(delta) || delta <= 0) return distance;
  const remaining = (distance - 1) * Math.exp(-2.8 * delta);
  return remaining < 0.0003 ? 1 : 1 + remaining;
}

export function signalFlightPose(progress, strength, compact, koreaNormal) {
  const pose = flightPose(progress, compact);
  if (strength <= 0) return pose;
  const earth = earthPosition(compact);
  const signal = clamp(strength);
  const focus = earthFocusBlend(signal);
  const offset = pose.position.map((value, i) => value - earth[i]);
  const separation = Math.hypot(...offset);
  const initial = flightPose(0, compact).position.map(
    (value, i) => value - earth[i],
  );
  const openingDistance = Math.hypot(...initial);
  // Default agrees with the unswayed texture. The renderer supplies the actual
  // swaying geographic normal, so the close-up follows Korea, not globe center.
  const normal = koreaNormal || initial.map((value) => value / openingDistance);
  const direction = offset.map(
    (value, i) => (value / separation) * (1 - focus) + normal[i] * focus,
  );
  const length = Math.hypot(...direction);
  const altitude =
    (separation - EARTH_RADIUS) *
    (EARTH_FOCUS_ALTITUDE / (separation - EARTH_RADIUS)) ** signal;
  return {
    position: direction.map(
      (value, i) => earth[i] + (value / length) * (EARTH_RADIUS + altitude),
    ),
    target: pose.target.map(
      (value, i) =>
        value + (earth[i] + normal[i] * EARTH_RADIUS - value) * focus,
    ),
  };
}
