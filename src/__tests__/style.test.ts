import { expect, it } from "vitest";
import fs from "node:fs";

it("includes selection and page styles", () => {
  const css = fs.readFileSync("src/styles.css", "utf-8");
  expect(css).toContain(".text-object.is-selected");
  expect(css).toContain(".page {");
});
