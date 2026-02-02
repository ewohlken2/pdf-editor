import { expect, it } from "vitest";
import { toTextObject } from "../textExtraction";

it("builds a text object with bbox", () => {
  const item = {
    str: "Hello",
    transform: [1, 0, 0, 1, 100, 200],
    width: 50,
    height: 12
  } as const;
  const viewport = {
    rawDims: { pageWidth: 400, pageHeight: 400, pageX: 0, pageY: 20 }
  } as const;
  const obj = toTextObject("r1", item, 1, viewport);
  expect(obj.text).toBe("Hello");
  expect(obj.box.x).toBe(100);
  expect(obj.box.y).toBe(420 - 200 - 12);
  expect(obj.box.width).toBe(50);
});
