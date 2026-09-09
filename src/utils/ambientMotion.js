import { seededRandom } from "./observatory.js";

export const DUST_BOUNDS = [110, 76, 130];
export const dustBudget = (compact) => (compact ? 480 : 960);

// Advance only visible, unpaused time. Returning from a background tab must not
// fast-forward a streak or jump the camera/clouds by the time spent away.
export function advanceAmbientTime(time, delta, paused) {
  if (paused || !Number.isFinite(delta) || delta <= 0) return time;
  return time + Math.min(delta, 0.05);
}

export function createDustField(compact) {
  const random = seededRandom(7092026);
  const count = dustBudget(compact);
  const positions = new Float32Array(count * 3);
  const velocity = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const layers = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const near = i % 4 === 0;
    layers[i] = near ? 1 : 0;
    for (let axis = 0; axis < 3; axis++)
      positions[i * 3 + axis] =
        (random() - 0.5) * DUST_BOUNDS[axis] * (near ? 0.48 : 1);
    // Separate depth layers move at different speeds, not a snowfall overlay.
    velocity.set(
      [
        (0.26 + random() * 0.4) * (near ? 2.2 : 1) * (i % 7 === 0 ? -1 : 1),
        (random() - 0.35) * 0.24 * (near ? 1.4 : 1),
        0.08 + random() * 0.22,
      ],
      i * 3,
    );
    phases[i] = random() * Math.PI * 2;
    sizes[i] = near ? 1.4 + random() * 1.3 : 0.8 + random() * 1.4;
  }
  return { positions, velocity, phases, sizes, layers };
}

export function distantStreak(time) {
  const period = 18;
  const duration = 2.6;
  const elapsed = time - 3.5;
  if (elapsed < 0) return { visible: false, progress: 0, opacity: 0, lane: 0 };
  const cycle = Math.floor(elapsed / period);
  const phase = elapsed - cycle * period;
  const progress = Math.min(1, phase / duration);
  const opacity =
    phase < duration ? Math.sin(Math.PI * progress) ** 2 * 0.68 : 0;
  return { visible: opacity > 0.001, progress, opacity, lane: cycle % 3 };
}
