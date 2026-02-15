/// <reference types="vitest/globals" />
import { getAllCrsList, loadCrs } from "./crs";
import { transformCoordinate } from "./transform";

describe("transformCoordinate", () => {
  it("transforms WGS84 (EPSG:4326) to MGA Zone 50 (EPSG:7850) with expected easting/northing", async () => {
    await getAllCrsList();
    const wgs84 = await loadCrs("4326");
    const mga50 = await loadCrs("7850");

    expect(wgs84).not.toBeNull();
    expect(mga50).not.toBeNull();
    if (!wgs84 || !mga50) return;

    const [x, y] = transformCoordinate(
      wgs84.proj4,
      mga50.proj4,
      115.84702, // longitude (WGS84)
      -32.057381 // latitude (WGS84)
    );

    expect(x).toBeCloseTo(391159.5231786624, 6);
    expect(y).toBeCloseTo(6452622.726700513, 6);
  });
});
