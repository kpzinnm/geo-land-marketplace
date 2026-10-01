import { fireEvent, render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import LandDetailsPanel from "./LandDetailsPanel";

describe("LandDetailsPanel", () => {
  const land = {
    id: "land-123",
    price: 250000,
    description: "Residential land near downtown",
    contact: "owner@example.com",
  };

  it("renders land information", () => {
    render(
      <LandDetailsPanel land={land} onBack={() => {}} onClose={() => {}} />,
    );

    expect(
      screen.getByText("Residential land near downtown"),
    ).toBeInTheDocument();

    expect(screen.getByText("owner@example.com")).toBeInTheDocument();

    expect(screen.getByText("land-123")).toBeInTheDocument();
  });

  it("returns to search results", () => {
    const onBack = vi.fn();

    render(<LandDetailsPanel land={land} onBack={onBack} onClose={() => {}} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /back to results/i,
      }),
    );

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("closes through a named button", () => {
    const onClose = vi.fn();
    render(<LandDetailsPanel land={land} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close land details" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

});
