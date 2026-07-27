import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the QAI logotype with the SHOP suffix", () => {
    render(<Logo />);
    const logo = screen.getByLabelText("Start QAI Shop");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent("START");
    expect(logo).toHaveTextContent("QAI");
    expect(logo).toHaveTextContent("SHOP");
  });
});
