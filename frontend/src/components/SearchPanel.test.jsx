import { fireEvent, render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import SearchPanel from "./SearchPanel";

describe("SearchPanel", () => {
  it("shows the current radius in meters", () => {
    render(
      <SearchPanel
        searchArea={{
          longitude: -35.88,
          latitude: -7.23,
          radiusMeters: 750,
        }}
        loading={false}
        resultCount={null}
        onSearch={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText("750 m")).toBeInTheDocument();
  });

  it("shows the current radius in kilometers", () => {
    render(
      <SearchPanel
        searchArea={{
          longitude: -35.88,
          latitude: -7.23,
          radiusMeters: 1500,
        }}
        loading={false}
        resultCount={null}
        onSearch={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText("1.50 km")).toBeInTheDocument();
  });

  it("calls onSearch when the user starts the search", () => {
    const onSearch = vi.fn();

    render(
      <SearchPanel
        searchArea={{
          longitude: -35.88,
          latitude: -7.23,
          radiusMeters: 1000,
        }}
        loading={false}
        resultCount={null}
        onSearch={onSearch}
        onCancel={() => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /^search$/i,
      }),
    );

    expect(onSearch).toHaveBeenCalledOnce();
  });

  it("disables the search button without a search area", () => {
    render(
      <SearchPanel
        searchArea={null}
        loading={false}
        resultCount={null}
        onSearch={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /^search$/i,
      }),
    ).toBeDisabled();
  });
});
