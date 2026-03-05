import Dexie, { type EntityTable } from "dexie";
import type { Coordinate } from "./types";

export interface CoordinateRecord extends Coordinate {
  /** Preserves display order since primary key is a UUID. */
  sortOrder: number;
}

class AppDatabase extends Dexie {
  coordinates!: EntityTable<CoordinateRecord, "id">;

  constructor() {
    super("lat-long-db");
    this.version(1).stores({
      // Primary key and indexes
      coordinates: "id, sortOrder",
    });
  }
}

export const db = new AppDatabase();

