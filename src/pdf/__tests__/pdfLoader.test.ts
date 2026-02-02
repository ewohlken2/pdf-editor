import { describe, expect, it } from "vitest";
import { toViewportScale } from "../pdfLoader";

describe("toViewportScale", () => {
  it("scales to fit width", () => {
    expect(toViewportScale(612, 800, 306)).toBeCloseTo(0.5, 5);
  });
});
