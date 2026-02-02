import { expect, it } from "vitest";
import { History } from "../history";

it("undoes last action", () => {
  const history = new History<number>(0);
  history.push(1);
  history.push(2);
  expect(history.undo()).toBe(1);
});
