import { fireEvent, render, screen, within } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import LandResultsPanel from "./LandResultsPanel";

const lands = [
  {
    id: "land-1",
    price: 450000,
    description: "Commercial land",
    contact: "commercial@example.com",
  },
  {
    id: "land-2",
    price: 250000,
    description: "Residential land",
    contact: "residential@example.com",
  },
];

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
    const onSelectLand = vi.fn();

    render(
      <LandResultsPanel
        lands={[lands[0]]}
        onSelectLand={onSelectLand}
        onClose={() => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /commercial land/i,
      }),
    );

    expect(onSelectLand).toHaveBeenCalledWith(lands[0]);
  });

  it("notifies when a land is hovered", () => {
    const onHoverLand = vi.fn();

    render(
      <LandResultsPanel
        lands={[lands[0]]}
        onSelectLand={() => {}}
        onHoverLand={onHoverLand}
        onClose={() => {}}
      />,
    );

    const card = screen.getByRole("button", {
      name: /commercial land/i,
    });

    fireEvent.mouseEnter(card);

    expect(onHoverLand).toHaveBeenLastCalledWith(lands[0]);

    fireEvent.mouseLeave(card);

    expect(onHoverLand).toHaveBeenLastCalledWith(null);
  });

  it("notifies hover through keyboard focus", () => {
    const onHoverLand = vi.fn();

    render(
      <LandResultsPanel
        lands={[lands[0]]}
        onSelectLand={() => {}}
        onHoverLand={onHoverLand}
        onClose={() => {}}
      />,
    );

    const card = screen.getByRole("button", {
      name: /commercial land/i,
    });

    fireEvent.focus(card);

    expect(onHoverLand).toHaveBeenLastCalledWith(lands[0]);

    fireEvent.blur(card);

    expect(onHoverLand).toHaveBeenLastCalledWith(null);
  });

  it("clears hover before selecting a land", () => {
    const onHoverLand = vi.fn();

    const onSelectLand = vi.fn();

    render(
      <LandResultsPanel
        lands={[lands[0]]}
        onSelectLand={onSelectLand}
        onHoverLand={onHoverLand}
        onClose={() => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /commercial land/i,
      }),
    );

    expect(onHoverLand).toHaveBeenCalledWith(null);

    expect(onSelectLand).toHaveBeenCalledWith(lands[0]);
  });

  it("requests fitting all results", () => {
    const onFitResults = vi.fn();

    render(
      <LandResultsPanel
        lands={lands}
        onSelectLand={() => {}}
        onFitResults={onFitResults}
        onClose={() => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /fit results/i,
      }),
    );

    expect(onFitResults).toHaveBeenCalledOnce();
  });

  it("sorts results by lowest price", () => {
    render(
      <LandResultsPanel
        lands={lands}
        onSelectLand={() => {}}
        onClose={() => {}}
      />,
    );

    fireEvent.change(
      screen.getByRole("combobox", {
        name: /sort results/i,
      }),
      {
        target: {
          value: "price-asc",
        },
      },
    );

    const resultButtons = screen
      .getAllByRole("button")
      .filter((button) => within(button).queryByText(/land$/));

    expect(resultButtons[0]).toHaveTextContent("Residential land");

    expect(resultButtons[1]).toHaveTextContent("Commercial land");
  });

  it("sorts results by highest price", () => {
    render(
      <LandResultsPanel
        lands={lands}
        onSelectLand={() => {}}
        onClose={() => {}}
      />,
    );

    fireEvent.change(
      screen.getByRole("combobox", {
        name: /sort results/i,
      }),
      {
        target: {
          value: "price-desc",
        },
      },
    );

    const resultButtons = screen
      .getAllByRole("button")
      .filter((button) => within(button).queryByText(/land$/));

    expect(resultButtons[0]).toHaveTextContent("Commercial land");

    expect(resultButtons[1]).toHaveTextContent("Residential land");
  });

  it("closes through a named button", () => {
    const onClose = vi.fn();

    render(<LandResultsPanel lands={[]} onClose={onClose} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close search results",
      }),
    );

    expect(onClose).toHaveBeenCalledOnce();
  });
});
