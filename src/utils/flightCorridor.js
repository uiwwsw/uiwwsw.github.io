import { flightPose, seededRandom, clamp } from './observatory.js';
import { starSeed, giveStarsPersonality } from './starPersonality.js';

// Irregular pockets and open space inside a forward-facing reading corridor.
// Deterministic for this visit: no moving targets, rings, or per-frame reshuffle.
export function corridorStars(articles, sector, compact, visitSeed = 0) {
  const clusterRandom = seededRandom(starSeed(sector.id || 'home', visitSeed));
  const pockets = Array.from({length: 4}, () => [
    (clusterRandom() - .5) * 1.2, (clusterRandom() - .5) * 1.2,
  ]);
  const placed = [];
  return giveStarsPersonality(articles, visitSeed).map((article, index) => {
    const random = seededRandom(starSeed(article.id, visitSeed));
    const t = clamp(.16 + index / Math.max(1, articles.length - 1) * .82 + (random() - .5) * .025);
    const pose = flightPose(t, compact);
    const forward = pose.target.map((v, i) => v - pose.position[i]);
    const length = Math.hypot(...forward);
    const direction = forward.map(v => v / length);
    const right = [-direction[2], 0, direction[0]];
    let position;
    let bestClearance = -1;
    for (let attempt = 0; attempt < 16; attempt++) {
      const pocket = pockets[Math.floor(random() * pockets.length)];
      const loose = random() < .35;
      const x = loose ? random() * 2 - 1 : clamp(pocket[0] + (random() - .5) * .9, -1, 1);
      const y = loose ? random() * 2 - 1 : clamp(pocket[1] + (random() - .5) * .9, -1, 1);
      const depth = 22 + random() * 5;
      const candidate = pose.position.map((v, i) => v + sector.origin[i] + direction[i] * depth + right[i] * x * (compact ? 3.7 : 8) + (i === 1 ? y * 4.5 : 0));
      const clearance = placed.reduce((min, p) => Math.min(min, Math.hypot(...p.map((v,i) => v - candidate[i]))), Infinity);
      if (clearance > bestClearance) { position = candidate; bestClearance = clearance; }
      if (clearance >= 3.2) break;
    }
    placed.push(position);
    return { ...article, position };
  });
}
