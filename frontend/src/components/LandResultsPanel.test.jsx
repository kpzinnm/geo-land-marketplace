import { fireEvent, render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import LandResultsPanel from "./LandResultsPanel";

describe("LandResultsPanel", () => {
  it("shows an empty state when no lands are found", () => {
    render(
      <LandResultsPanel
        lands={[]}
        onSelectLand={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/no lands found/i)).toBeInTheDocument();
  });

  it("renders search results", () => {
    const lands = [
      {
        id: "land-1",
        price: 250000,
        description: "Residential land",
      },
      {
        id: "land-2",
        price: 450000,
        description: "Commercial land",
      },
    ];

    render(
      <LandResultsPanel
        lands={lands}
        onSelectLand={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Residential land")).toBeInTheDocument();

    expect(screen.getByText("Commercial land")).toBeInTheDocument();
  });

  it("notifies when a land is selected", () => {
    const land = {
      id: "land-1",
      price: 250000,
      description: "Residential land",
    };

    const onSelectLand = vi.fn();

    render(
      <LandResultsPanel
        lands={[land]}
        onSelectLand={onSelectLand}
        onClose={() => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /residential land/i,
      }),
    );

    expect(onSelectLand).toHaveBeenCalledWith(land);
  });

  it("closes through a named button", () => {
    const onClose = vi.fn();
    render(<LandResultsPanel lands={[]} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close search results" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

});
