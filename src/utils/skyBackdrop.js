import { flightPose, seededRandom } from "./observatory.js";

// A small fixed set of bright guide stars bridges the prerendered HTML and GPU.
// The rest of the sky can vary per visit without moving those first-paint stars.
function generateStars(compact, seed = 0) {
  const random = seededRandom(20260907 ^ seed);
  const count = compact ? 2800 : 6000;
  const positions = [],
    colors = [],
    sizes = [],
    phases = [];
  for (let i = 0; i < count; i++) {
    const azimuth = random() * Math.PI * 2;
    const latitude =
      i < count * 0.65 ? (random() - 0.5) * 0.22 : Math.asin(random() * 2 - 1);
    const radius = 200 + random() * 180;
    const x = Math.cos(azimuth) * Math.cos(latitude) * radius;
    positions.push(
      x,
      Math.sin(latitude) * radius + x * 0.45 + 40,
      Math.sin(azimuth) * Math.cos(latitude) * radius,
    );
    const warmth = random();
    colors.push(0.67 + warmth * 0.3, 0.73 + warmth * 0.17, 0.9 - warmth * 0.15);
    sizes.push(random() < 0.025 ? 4 + random() * 3 : 0.7 + random() * 2.1);
    phases.push(random() * 6.28);
  }
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    sizes: new Float32Array(sizes),
    phases: new Float32Array(phases),
  };
}

const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const normalize = (v) => v.map((value) => value / Math.hypot(...v));
export function createSkyPreview(compact) {
  const data = generateStars(compact);
  const pose = flightPose(0, compact);
  const forward = normalize(pose.target.map((v, i) => v - pose.position[i]));
  const right = normalize([-forward[2], 0, forward[0]]);
  const up = [
    -right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1],
  ];
  const tanV = Math.tan(((compact ? 58 : 46) * Math.PI) / 360);
  const stars = [];
  for (let i = 0; i < data.sizes.length; i++) {
    const relative = Array.from(
      data.positions.slice(i * 3, i * 3 + 3),
      (v, j) => v - pose.position[j],
    );
    const depth = dot(relative, forward);
    if (depth <= 0) continue;
    // Height-normalized coordinates preserve the camera's fixed vertical FOV
    // when the viewport is resized. The wide SVG is cropped horizontally.
    const x = dot(relative, right) / (depth * tanV);
    const y = -dot(relative, up) / (depth * tanV);
    if (Math.abs(x) > 3 || Math.abs(y) > 1) continue;
    stars.push({
      id: i,
      x: +x.toFixed(5),
      y: +y.toFixed(5),
      radius: +(data.sizes[i] * 0.0005).toFixed(5),
      opacity: +(0.35 * (0.72 + 0.28 * Math.sin(data.phases[i]))).toFixed(3),
      color: `rgb(${Array.from(data.colors.slice(i * 3, i * 3 + 3), (v) => Math.round(v * 255)).join(" ")})`,
    });
  }
  return stars.sort((a, b) => b.radius - a.radius).slice(0, 96);
}

export function createBackgroundStarData(compact, visitSeed = 0) {
  const stars = generateStars(compact, visitSeed);
  if (!visitSeed) return stars;
  const anchors = generateStars(compact);
  for (const { id } of createSkyPreview(compact)) {
    for (const key of ["positions", "colors"])
      stars[key].set(anchors[key].subarray(id * 3, id * 3 + 3), id * 3);
    for (const key of ["sizes", "phases"]) stars[key][id] = anchors[key][id];
  }
  return stars;
}
