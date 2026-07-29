export function clipIntervalMs(
  start: number,
  end: number,
  windowStart: number,
  windowEnd: number,
): number {
  const clippedStart = Math.max(start, windowStart);
  const clippedEnd = Math.min(end, windowEnd);

  if (clippedEnd <= clippedStart) {
    return 0;
  }

  return clippedEnd - clippedStart;
}

export function overlapsWindow(
  start: number,
  end: number,
  windowStart: number,
  windowEnd: number,
): boolean {
  return start < windowEnd && end > windowStart;
}
