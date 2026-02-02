export function clampWidthToViewport(width: number): number {
  if (!Number.isFinite(width)) return 0;
  if (typeof window === "undefined" || !Number.isFinite(window.innerWidth)) {
    return width;
  }
  if (window.innerWidth <= 0) return width;
  return Math.min(width, window.innerWidth);
}
