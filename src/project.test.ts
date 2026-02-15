/// <reference types="vitest/globals" />
import { projectFromBearingDistance } from "./project";

describe("projectFromBearingDistance", () => {
  it("projects a point in EPSG:7850 by bearing 45 and distance 100", () => {
    const { easting, northing } = projectFromBearingDistance(
      391159.523179,
      6452622.726701,
      45,
      100
    );

    expect(easting).toBeCloseTo(391230.23385711865, 6);
    expect(northing).toBeCloseTo(6452693.43737911865, 6);
  });

  it("throws for non-finite arguments", () => {
    expect(() =>
      projectFromBearingDistance(391159.523179, 6452622.726701, 45, NaN)
    ).toThrow("All arguments must be finite numbers.");

    expect(() =>
      projectFromBearingDistance(Infinity, 6452622.726701, 45, 100)
    ).toThrow("All arguments must be finite numbers.");
  });

  it("throws for negative distance", () => {
    expect(() =>
      projectFromBearingDistance(391159.523179, 6452622.726701, 45, -100)
    ).toThrow("Distance must be non-negative.");
  });
});
