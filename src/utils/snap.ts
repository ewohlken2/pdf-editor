export function snapPosition(
  value: number,
  candidates: number[],
  threshold: number
) {
  for (const candidate of candidates) {
    if (Math.abs(value - candidate) <= threshold) return candidate;
  }
  return value;
}
