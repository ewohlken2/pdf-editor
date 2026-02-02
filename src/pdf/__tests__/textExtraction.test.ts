import { describe, expect, it } from "vitest";
import { toTextObject } from "../textExtraction";

it("builds a text object with bbox", () => {
  const item = {
    str: "Hello",
    transform: [1, 0, 0, 1, 100, 200],
    width: 50,
    height: 12
  } as const;
  const obj = toTextObject("r1", item, 1);
  expect(obj.text).toBe("Hello");
  expect(obj.box.x).toBe(100);
  expect(obj.box.y).toBe(200 - 12);
  expect(obj.box.width).toBe(50);
});
