export interface Coord {
  x: number;
  y: number;
}

/** A project that groups coordinate cards. */
export interface Project {
  projectId: string;
  projectName: string;
  notes?: string;
  createdDateTime: string;
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

/** A photo attached to a coordinate card. */
export interface CoordinatePhoto {
  /** UUID used for internal tracking. */
  id: string;
  /** Parent coordinate. */
  coordinateId: string;
  /** Parent project; for bulk-delete on project/coord deletion. */
  projectId: string;
  /** Original file name. */
  fileName: string;
  /** MIME type, e.g. image/jpeg. */
  mimeType: string;
  /** Image data; stored natively in IndexedDB. */
  blob: Blob;
  /** When the photo was added. */
  createdDateTime: string;
  /** Preserves display order. */
  sortOrder: number;
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
