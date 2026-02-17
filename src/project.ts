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

/**
 * Compute bearing and distance from one projected point to another.
 * Bearing is in degrees from North, clockwise (0–360). Distance is in same units as the CRS.
 * @returns Bearing in degrees and distance.
 */
export function bearingDistanceBetween(
  fromEasting: number,
  fromNorthing: number,
  toEasting: number,
  toNorthing: number
): { bearingDeg: number; distance: number } {
  if (
    typeof fromEasting !== "number" ||
    typeof fromNorthing !== "number" ||
    typeof toEasting !== "number" ||
    typeof toNorthing !== "number" ||
    !Number.isFinite(fromEasting) ||
    !Number.isFinite(fromNorthing) ||
    !Number.isFinite(toEasting) ||
    !Number.isFinite(toNorthing)
  ) {
    throw new Error("All arguments must be finite numbers.");
  }
  const dE = toEasting - fromEasting;
  const dN = toNorthing - fromNorthing;
  const distance = Math.sqrt(dE * dE + dN * dN);
  let bearingDeg = (Math.atan2(dE, dN) * 180) / Math.PI;
  if (bearingDeg < 0) bearingDeg += 360;
  return { bearingDeg, distance };
}
