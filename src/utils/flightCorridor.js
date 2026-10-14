import { flightPose } from './observatory.js';

// Reading stars form a narrow trail in front of the route. Background stars
// remain all around the observer. Registry coordinates and URLs stay intact.
export function corridorStars(articles, sector, compact) {
  return articles.map((article, index) => {
    const t = 0.16 + (index / Math.max(1, articles.length - 1)) * 0.82;
    const pose = flightPose(t, compact);
    const forward = pose.target.map((v, i) => v - pose.position[i]);
    const length = Math.hypot(...forward);
    const direction = forward.map(v => v / length);
    const right = [-direction[2], 0, direction[0]];
    const angle = index * 2.399963;
    const width = compact ? 4.1 : 8;
    const lateral = Math.sin(angle) * width;
    const vertical = Math.cos(angle) * (compact ? 5 : 4.5);
    return { ...article, position: pose.position.map((v, i) =>
      v + sector.origin[i] + direction[i] * 24 + right[i] * lateral + (i === 1 ? vertical : 0)) };
  });
}
