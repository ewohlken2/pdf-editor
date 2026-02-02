import { render, screen } from "@testing-library/react";
import App from "../App";

test("renders PDF Editor header", () => {
  render(<App />);
  expect(screen.getByText("PDF Editor")).toBeInTheDocument();
});
