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
