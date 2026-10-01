import { afterEach, describe, expect, it, vi } from "vitest";

import { createLand, searchLands } from "./landApi";

describe("landApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a land successfully", async () => {
    const responseBody = {
      id: "land-1",
      price: 250000,
      description: "Residential land",
      contact: "owner@example.com",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,

      text: async () => JSON.stringify(responseBody),
    });

    const payload = {
      price: 250000,

      description: "Residential land",

      contact: "owner@example.com",

      geometry: {
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
      },
    };

    const result = await createLand(payload);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/lands",
      expect.objectContaining({
        method: "POST",

        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),

        body: JSON.stringify(payload),
      }),
    );

    expect(result).toEqual(responseBody);
  });

  it("throws an error when the backend rejects the request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,

      status: 409,

      text: async () =>
        JSON.stringify({
          message: "The land overlaps an existing land",
        }),
    });

    await expect(
      createLand({
        price: 1000,
      }),
    ).rejects.toMatchObject({
      status: 409,

      body: {
        message: "The land overlaps an existing land",
      },
    });
  });

  it("searches lands successfully", async () => {
    const responseBody = [
      {
        id: "land-1",
      },
      {
        id: "land-2",
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,

      text: async () => JSON.stringify(responseBody),
    });

    const payload = {
      longitude: -35.8811,
      latitude: -7.2306,
      radiusMeters: 1500,
    };

    const result = await searchLands(payload);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/lands/search",
      expect.objectContaining({
        method: "POST",

        body: JSON.stringify(payload),
      }),
    );

    expect(result).toEqual(responseBody);
  });
});
