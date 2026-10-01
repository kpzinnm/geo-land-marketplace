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

  it("transitions from no area to ready to searching and blocks cancellation", () => {
    const onCancel = vi.fn();
    const onSearch = vi.fn();
    const props = { onCancel, onSearch };
    const { rerender } = render(<SearchPanel {...props} searchArea={null} loading={false} />);
    expect(screen.getByRole("status")).toHaveTextContent("Draw a search area");
    expect(screen.getByText("—")).toBeInTheDocument();
    const searchArea = { radiusMeters: 500 };
    rerender(<SearchPanel {...props} searchArea={searchArea} loading={false} />);
    expect(screen.getByRole("status")).toHaveTextContent("Search area ready");
    expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
    rerender(<SearchPanel {...props} searchArea={searchArea} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Searching lands...");
    expect(screen.getByRole("button", { name: "Searching..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).not.toHaveBeenCalled();
    rerender(<SearchPanel {...props} searchArea={searchArea} loading={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it.each([[0, "0 lands found"], [1, "1 land found"], [2, "2 lands found"]])("renders completed result count %i", (resultCount, text) => {
    render(<SearchPanel searchArea={null} resultCount={resultCount} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

});
