import { expect, it } from "vitest";
import { snapPosition } from "../snap";

it("snaps to nearby x edge", () => {
  const result = snapPosition(100, [98, 200], 4);
  expect(result).toBe(98);
});
