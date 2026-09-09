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
export function packStarLabels(
  candidates,
  width,
  height,
  compact,
  obstacle,
  previousIds = [],
) {
  const labelWidth = compact ? 156 : 198;
  const labelHeight = compact ? 72 : 82;
  const kept = [];
  // Keep a readable title in place while it is still valid. Tiny camera changes
  // must not constantly replace labels with whichever star became nearer.
  const priority = new Map(previousIds.map((id, index) => [id, index]));
  const ordered = [...candidates].sort(
    (a, b) =>
      (priority.get(a.id) ?? Infinity) - (priority.get(b.id) ?? Infinity),
  );
  for (const item of ordered) {
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

export const LABEL_FADE_SECONDS = 0.45;
export function transitionStarLabels(
  previous,
  desired,
  now,
  immediate = false,
) {
  if (immediate) return desired.map((item) => ({ ...item, leavingAt: null }));
  const wanted = new Map(desired.map((item) => [item.id, item]));
  const result = previous.flatMap((item) => {
    if (wanted.has(item.id)) {
      wanted.delete(item.id);
      return [{ ...item, leavingAt: null }];
    }
    const leavingAt = item.leavingAt ?? now;
    return now - leavingAt < LABEL_FADE_SECONDS ? [{ ...item, leavingAt }] : [];
  });
  // Finish retiring labels before adding replacements. The HTML budget stays
  // fixed and crossing a packing boundary cannot create overlapping titles.
  if (!result.some((item) => item.leavingAt !== null)) {
    result.push(
      ...[...wanted.values()].map((item) => ({ ...item, leavingAt: null })),
    );
  }
  return result;
}
