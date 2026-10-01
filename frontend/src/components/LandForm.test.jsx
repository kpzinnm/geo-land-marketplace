import { fireEvent, render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import LandForm from "./LandForm";

describe("LandForm", () => {
  it("keeps submit disabled until a polygon exists", () => {
    render(
      <LandForm
        polygon={null}
        onSubmit={() => {}}
        onCancel={() => {}}
        loading={false}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /register land/i,
      }),
    ).toBeDisabled();
  });

  it("builds and submits the expected payload", async () => {
    const polygon = {
      type: "Polygon",

      coordinates: [
        [
          [-35.9, -7.2],
          [-35.8, -7.2],
          [-35.8, -7.1],
          [-35.9, -7.1],
          [-35.9, -7.2],
        ],
      ],
    };

    const onSubmit = vi.fn().mockResolvedValue(true);

    render(
      <LandForm
        polygon={polygon}
        onSubmit={onSubmit}
        onCancel={() => {}}
        loading={false}
      />,
    );

    fireEvent.change(screen.getByLabelText(/price/i), {
      target: {
        value: "250000",
      },
    });

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: {
        value: "Residential land",
      },
    });

    fireEvent.change(screen.getByLabelText(/contact/i), {
      target: {
        value: "owner@example.com",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /register land/i,
      }),
    );

    expect(onSubmit).toHaveBeenCalledWith({
      price: 250000,

      description: "Residential land",

      contact: "owner@example.com",

      geometry: polygon,
    });
  });

  it("shows polygon readiness and blocks actions while registering", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(<LandForm polygon={null} loading={false} onCancel={onCancel} onSubmit={onSubmit} />);
    expect(screen.getByRole("status")).toHaveTextContent("Draw the land boundary first");
    expect(screen.getByLabelText("Price")).toHaveAccessibleDescription("Total asking price in BRL");
    rerender(<LandForm polygon={{ type: "Polygon" }} loading onCancel={onCancel} onSubmit={onSubmit} />);
    expect(screen.getByRole("status")).toHaveTextContent("Land boundary ready");
    expect(screen.getByRole("button", { name: "Registering..." })).toBeDisabled();
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel).toBeDisabled();
    fireEvent.click(cancel);
    expect(onCancel).not.toHaveBeenCalled();
    rerender(<LandForm polygon={null} loading={false} onCancel={onCancel} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

});
