export interface Coord {
  x: number;
  y: number;
}

/** A single coordinate entry managed by the app. */
export interface Coordinate {
  /** Stable identifier for React keys and lookups. */
  id: string;
  /** User-visible unique name, e.g. "1", "PointA", "Point1_Transform". */
  name: string;
  /** EPSG code for the CRS, e.g. "4326". */
  crsCode: string;
  /** X / longitude / easting value (depends on CRS). */
  x: number;
  /** Y / latitude / northing value (depends on CRS). */
  y: number;
  /** Optional user note for this coordinate. */
  notes?: string;
}

export interface CRSInfo {
  code: string;
  name: string;
  kind: string;
  proj4: string;
}

export interface EpsgIndexEntry {
  code: string;
  kind: string;
  name: string;
  proj4: string;
  bbox?: number[];
  unit?: string;
  area?: string;
  accuracy?: unknown;
}
