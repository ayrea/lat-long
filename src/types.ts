export interface Coord {
  x: number;
  y: number;
}

/** How the coordinate card was created; used for display (chip) and tracking. */
export type CardType = "manual" | "project" | "transform";

/** A single coordinate entry managed by the app. */
export interface Coordinate {
  /** UUID used for internal tracking and React keys; distinct from the user-visible name. */
  id: string;
  /** User-visible unique name, e.g. "1", "PointA", "Point1_Transform". */
  name: string;
  /** EPSG code for the CRS, e.g. "4326". */
  crsCode: string;
  /** X / longitude / easting value (depends on CRS). */
  x: number;
  /** Y / latitude / northing value (depends on CRS). */
  y: number;
  /** How this card was created: manual entry, Project action, or Transform action. */
  cardType: CardType;
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
