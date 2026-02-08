import proj4 from "proj4";

/**
 * Transform a coordinate from one CRS to another using proj4 strings.
 * @returns [x, y] in target CRS, or throws on invalid input or transform failure.
 */
export function transformCoordinate(
  fromProj4: string,
  toProj4: string,
  x: number,
  y: number
): [number, number] {
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    throw new Error("Invalid coordinates: x and y must be finite numbers.");
  }
  const result = proj4(fromProj4, toProj4, [x, y]);
  return [result[0], result[1]];
}
