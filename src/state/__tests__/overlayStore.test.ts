import { expect, it } from "vitest";
import { overlayReducer } from "../overlayStore";

it("replaces text", () => {
  const state = {
    objects: [
      {
        id: "t1",
        text: "Original",
        fontSize: 12,
        box: { x: 0, y: 0, width: 20, height: 12 },
        baseline: 12
      }
    ],
    selectedId: null
  };
  const next = overlayReducer(state, {
    type: "replaceText",
    id: "t1",
    text: "Updated"
  });
  expect(next.objects[0]?.text).toBe("Updated");
});

it("inserts a new object", () => {
  const next = overlayReducer(
    { objects: [], selectedId: null },
    {
      type: "insert",
      object: {
        id: "new",
        text: "Paste",
        fontSize: 12,
        box: { x: 10, y: 10, width: 50, height: 12 },
        baseline: 22
      }
    }
  );
  expect(next.objects).toHaveLength(1);
});
