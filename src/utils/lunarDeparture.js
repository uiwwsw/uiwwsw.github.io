import { clamp, flightPose } from './observatory.js';

// One reversible timeline. These intervals are scroll positions, not timers.
export function openingEase(start, end, value) {
  const t = clamp((value - start) / (end - start));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function lunarDeparture(progress) {
  const p = clamp(progress);
  const landing = openingEase(.16, .43, p);
  const takeoff = openingEase(.55, 1, p);
  return {
    progress: p,
    logo: openingEase(0, .25, p),
    veil: 1 - openingEase(.13, .32, p),
    landing,
    takeoff,
    earth: 1 - openingEase(.54, .88, p),
    chrome: openingEase(.88, 1, p),
    cue: 1 - openingEase(.06, .18, p),
    landedCaption: openingEase(.32, .43, p) * (1 - openingEase(.51, .62, p)),
    takeoffCaption: openingEase(.59, .69, p) * (1 - openingEase(.87, 1, p)),
  };
}
export function departurePose(progress, compact = false) {
  const { landing, takeoff } = lunarDeparture(progress);
  const end = flightPose(0, compact);
  // Descend to eye height, settle, then climb into the exact flight origin.
  return {
    position: [end.position[0], 2 + (1 - landing) * 24 + takeoff * (end.position[1] - 2), end.position[2]],
    target: [end.target[0], -5 + landing * 12 + takeoff * (end.target[1] - 7), end.target[2]],
  };
}
