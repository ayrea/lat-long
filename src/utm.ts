/**
 * UTM zone and proj4 string helpers for converting WGS84 (lon/lat) to UTM (easting/northing).
 */

/** WGS84 proj4 string for use with transformCoordinate (lon, lat order). */
export const WGS84_PROJ4 = "+proj=longlat +datum=WGS84 +no_defs";

/**
 * UTM zone number (1–60) from longitude.
 */
export function getUtmZone(longitude: number): number {
  return Math.floor((longitude + 180) / 6) + 1;
}

/**
 * Proj4 definition for the given UTM zone and hemisphere.
 * Use with transformCoordinate(WGS84, this, lon, lat) to get [easting, northing].
 */
export function getUtmProj4String(zone: number, south: boolean): string {
  return `+proj=utm +zone=${zone} ${south ? "+south " : ""}+datum=WGS84 +units=m +no_defs`;
}
