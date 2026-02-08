/**
 * Project a new point from (easting, northing) by bearing and distance.
 * Bearing is in degrees from North, clockwise. Distance is in same units as the CRS (e.g. metres).
 * @returns New easting and northing.
 */
export function projectFromBearingDistance(
  easting: number,
  northing: number,
  bearingDeg: number,
  distance: number
): { easting: number; northing: number } {
  if (
    typeof easting !== "number" ||
    typeof northing !== "number" ||
    typeof bearingDeg !== "number" ||
    typeof distance !== "number" ||
    !Number.isFinite(easting) ||
    !Number.isFinite(northing) ||
    !Number.isFinite(bearingDeg) ||
    !Number.isFinite(distance)
  ) {
    throw new Error("All arguments must be finite numbers.");
  }
  if (distance < 0) {
    throw new Error("Distance must be non-negative.");
  }
  const rad = (bearingDeg * Math.PI) / 180;
  const eastingNew = easting + distance * Math.sin(rad);
  const northingNew = northing + distance * Math.cos(rad);
  return { easting: eastingNew, northing: northingNew };
}
