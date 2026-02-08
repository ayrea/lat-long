export type TransactionType = "transform" | "project";

export interface Coord {
  x: number;
  y: number;
}

export interface TransactionBase {
  id: string;
  type: TransactionType;
  sourceCrsCode: string;
  inputCoord: Coord;
  outputCoord: Coord;
}

export interface TransformTransaction extends TransactionBase {
  type: "transform";
  targetCrsCode: string;
}

export interface ProjectTransaction extends TransactionBase {
  type: "project";
  bearing: number;
  distance: number;
}

export type Transaction = TransformTransaction | ProjectTransaction;

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
