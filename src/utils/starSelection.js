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
  reservedRects,
) {
  const labelWidth = compact ? 156 : 198;
  const labelHeight = compact ? 72 : 82;
  const kept = [];
  const reserved = reservedRects || [
    { x: 0, y: 0, width, height: height * 0.2 },
    {
      x: 0,
      y: 0,
      width: compact ? width : 490,
      height: height * (compact ? 0.42 : 0.46),
    },
    {
      x: 0,
      y: height - (compact ? 185 : 160),
      width,
      height: compact ? 185 : 160,
    },
  ];
  const overlaps = (a, b, gap = 8) =>
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y;
  // Keep a readable title in place while it is still valid. Tiny camera changes
  // must not constantly replace labels with whichever star became nearer.
  const priority = new Map(
    [...new Set(previousIds)].map((id, index) => [id, index]),
  );
  const ordered = [...candidates].sort(
    (a, b) =>
      (priority.get(a.id) ?? Infinity) - (priority.get(b.id) ?? Infinity),
  );
  for (const item of ordered) {
    const placements = [
      ...(Number.isFinite(item.offsetX) ? [[item.offsetX, item.offsetY]] : []),
      [12, 0],
      [-labelWidth - 12, 0],
      [12, -labelHeight],
      [-labelWidth - 12, -labelHeight],
    ];
    for (const [offsetX, offsetY] of placements) {
      const rect = {
        x: item.x + offsetX,
        y: item.y + offsetY,
        width: labelWidth,
        height: labelHeight,
      };
      if (
        rect.x < 12 ||
        rect.x + labelWidth > width - 12 ||
        rect.y < 12 ||
        rect.y + labelHeight > height - 12
      )
        continue;
      if (reserved.some((other) => overlaps(rect, other))) continue;
      if (kept.some((other) => overlaps(rect, other.rect, 14))) continue;
      if (obstacle) {
        const closestX = Math.max(
          rect.x,
          Math.min(obstacle.x, rect.x + labelWidth),
        );
        const closestY = Math.max(
          rect.y,
          Math.min(obstacle.y, rect.y + labelHeight),
        );
        if (
          Math.hypot(closestX - obstacle.x, closestY - obstacle.y) <
          obstacle.radius + 12
        )
          continue;
      }
      kept.push({ ...item, offsetX, offsetY, rect });
      break;
    }
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
      const current = wanted.get(item.id);
      wanted.delete(item.id);
      return [{ ...current, leavingAt: null }];
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

export function sameStarLabels(a, b) {
  return (
    a.length === b.length &&
    a.every(
      (item, i) =>
        item.id === b[i].id &&
        item.leavingAt === b[i].leavingAt &&
        item.offsetX === b[i].offsetX &&
        item.offsetY === b[i].offsetY &&
        item.position === b[i].position,
    )
  );
}
