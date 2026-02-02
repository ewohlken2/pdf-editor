import { describe, expect, it } from "vitest";
import { clampWidthToViewport } from "../layout";

describe("clampWidthToViewport", () => {
  it("clamps widths larger than the viewport", () => {
    const original = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });

    expect(clampWidthToViewport(1200)).toBe(800);

    Object.defineProperty(window, "innerWidth", { value: original, configurable: true });
  });

  it("keeps widths smaller than the viewport", () => {
    const original = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });

    expect(clampWidthToViewport(600)).toBe(600);

    Object.defineProperty(window, "innerWidth", { value: original, configurable: true });
  });
});
