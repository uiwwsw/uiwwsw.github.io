// Run with node scripts/benchmark-star-projection.js. CPU microbenchmark only:
// this excludes GPU rendering, React, DOM layout, network and device FPS.
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { PerspectiveCamera, Vector3 } from "three";
import {
  createStarProjectionBuffer,
  createStarProjector,
} from "../src/utils/starVisibility.js";
import {
  EARTH_RADIUS,
  earthPosition,
  flightPose,
} from "../src/utils/observatory.js";

const catalog = JSON.parse(
  readFileSync(new URL("../src/data/velog-index.json", import.meta.url)),
);
const articles = catalog.articles.filter((a) => a.sectorId === "home");
const iterations = 6000;
const rounds = 7;
const median = (values) =>
  values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
let checksum = 0;
for (const compact of [true, false]) {
  const [width, height, limit] = compact ? [390, 844, 36] : [1440, 900, 64];
  const cameras = Array.from({ length: 120 }, (_, i) => {
    const camera = new PerspectiveCamera(
      compact ? 58 : 46,
      width / height,
      0.1,
      650,
    );
    const pose = flightPose(0.13 + (0.87 * i) / 119, compact);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    camera.updateMatrixWorld();
    return camera;
  });
  const earth = new Vector3(...earthPosition(compact));
  const project = createStarProjector();
  const buffer = createStarProjectionBuffer(articles, limit);
  const allocating = (camera) =>
    articles
      .filter(() => true)
      .map((item) => project(item, camera, width, height, earth, EARTH_RADIUS))
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  const reusable = (camera) =>
    buffer.update(camera, width, height, earth, EARTH_RADIUS).picks;
  const measure = (run) => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++)
      checksum += run(cameras[i % cameras.length]).length;
    return performance.now() - start;
  };
  // Warm both paths, then alternate measurement order to reduce order bias.
  measure(allocating);
  measure(reusable);
  const before = [],
    after = [];
  for (let i = 0; i < rounds; i++) {
    if (i % 2) {
      after.push(measure(reusable));
      before.push(measure(allocating));
    } else {
      before.push(measure(allocating));
      after.push(measure(reusable));
    }
  }
  const oldMs = median(before),
    newMs = median(after);
  console.log(
    JSON.stringify({
      layout: compact ? "mobile" : "desktop",
      articles: articles.length,
      iterations,
      rounds,
      allocatingMs: +oldMs.toFixed(2),
      reusableMs: +newMs.toFixed(2),
      speedup: +(oldMs / newMs).toFixed(2),
    }),
  );
}
if (!checksum) throw new Error("Benchmark must exercise visible stars");
