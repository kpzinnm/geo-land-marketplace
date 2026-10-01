import { describe, expect, it } from "vitest";

import Circle from "ol/geom/Circle";

import { fromLonLat } from "ol/proj";

import { circleToSearchArea } from "./mapUtils";

describe("circleToSearchArea", () => {
  it("converts the circle center to longitude and latitude", () => {
    const center = fromLonLat([-35.8811, -7.2306]);

    const circle = new Circle(center, 1000);

    const result = circleToSearchArea(circle);

    expect(result.longitude).toBeCloseTo(-35.8811, 3);

    expect(result.latitude).toBeCloseTo(-7.2306, 3);

    expect(result.radiusMeters).toBeGreaterThan(0);
  });
});
