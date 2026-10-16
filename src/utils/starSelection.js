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
  pinnedIds = [],
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
  const pinned = new Set(pinnedIds.filter(Boolean));
  const ordered = [...candidates].sort(
    (a, b) =>
      Number(pinned.has(b.id)) - Number(pinned.has(a.id)) ||
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
      if (!pinned.has(item.id) && reserved.some((other) => overlaps(rect, other))) continue;
      if (kept.some((other) => overlaps(rect, other.rect, 14))) continue;
      if (obstacle && !pinned.has(item.id)) {
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
        !!item.labelPlacement === !!b[i].labelPlacement &&
        (item.labelPlacement && b[i].labelPlacement
          ? item.labelPlacement.x === b[i].labelPlacement.x && item.labelPlacement.y === b[i].labelPlacement.y
          : item.offsetX === b[i].offsetX && item.offsetY === b[i].offsetY) &&
        item.position === b[i].position,
    )
  );
}

// Rank in screen space, across every projected star (including distant ones).
// Retain a title under the pointer or keyboard focus so it never dodges a click.
export function pointerStarPriority(projected, pointer, pinned = []) {
  if (!pointer) return pinned.filter(Boolean);
  return [...new Set([
    ...pinned.filter(Boolean),
    ...[...projected].sort((a, b) =>
      Math.hypot(a.x - pointer.x, a.y - pointer.y) -
      Math.hypot(b.x - pointer.x, b.y - pointer.y)
    ).map(item => item.id),
  ])];
}


// Keep a visit's chosen side and vertical offset when a label leaves/re-enters.
// Copy only geometry, never mutable projection records or fading timestamps.
export function createStarLabelMemory() {
  const placements = new Map();
  return {
    remember(labels) {
      for (const item of labels) {
        if (item.leavingAt == null) placements.set(item.id, {
          offsetX: item.offsetX, offsetY: item.offsetY,
        });
      }
    },
    apply(item) {
      return { ...item, ...placements.get(item.id) };
    },
    clear() { placements.clear(); },
  };
}

// Protect the title the user is approaching before the pointer reaches its
// button. A larger exit radius avoids flicker at the edge of this intent area.
export function approachingStarLabel(labels, pointer, currentId, compact = false) {
  const distance = item => {
    const r = item.rect;
    if (!r || item.leavingAt != null) return Infinity;
    return Math.hypot(
      Math.max(r.x - pointer.x, 0, pointer.x - r.x - r.width),
      Math.max(r.y - pointer.y, 0, pointer.y - r.y - r.height),
    );
  };
  const current = labels.find(item => item.id === currentId);
  if (current && distance(current) <= (compact ? 56 : 88)) return current.id;
  const nearest = labels.map(item => ({id:item.id,distance:distance(item)}))
    .sort((a,b) => a.distance-b.distance)[0];
  return nearest && nearest.distance <= (compact ? 28 : 48) ? nearest.id : null;
}
