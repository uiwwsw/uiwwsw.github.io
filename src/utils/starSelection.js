export const pickBudget = (compact) => (compact ? 36 : 64);
export function nearbyStars(candidates, x, y, compact) {
  const radius = compact ? 24 : 15;
  return candidates
    .map((item) => ({
      ...item,
      pointerDistance: Math.hypot(item.x - x, item.y - y),
    }))
    .filter((item) => item.pointerDistance <= radius)
    .sort(
      (a, b) =>
        a.pointerDistance - b.pointerDistance || a.distance - b.distance,
    )
    .slice(0, 8);
}
export function packStarLabels(candidates, width, height, compact, obstacle) {
  const labelWidth = compact ? 156 : 198;
  const labelHeight = compact ? 72 : 82;
  const kept = [];
  for (const item of candidates) {
    const x = item.x + 10;
    const y = item.y;
    if (obstacle) {
      const closestX = Math.max(x, Math.min(obstacle.x, x + labelWidth));
      const closestY = Math.max(y, Math.min(obstacle.y, y + labelHeight));
      if (
        Math.hypot(closestX - obstacle.x, closestY - obstacle.y) <
        obstacle.radius + 20
      )
        continue;
    }
    if (
      x < width * 0.06 ||
      x + labelWidth > width * 0.93 ||
      y < height * 0.2 ||
      y + labelHeight > height - (compact ? 185 : 160)
    )
      continue;
    if (x < (compact ? width : 490) && y < height * (compact ? 0.42 : 0.46))
      continue;
    if (
      kept.some(
        (other) =>
          Math.abs(other.x - item.x) < labelWidth + 14 &&
          Math.abs(other.y - y) < labelHeight + 12,
      )
    )
      continue;
    kept.push(item);
    if (kept.length === (compact ? 3 : 5)) break;
  }
  return kept;
}
