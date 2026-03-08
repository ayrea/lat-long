import Dexie, { type EntityTable } from "dexie";
import type { Coordinate, Project } from "./types";

export interface ProjectRecord extends Project {
  /** Preserves display order since primary key is projectId. */
  sortOrder: number;
}

export interface CoordinateRecord extends Coordinate {
  /** Preserves display order since primary key is a UUID. */
  sortOrder: number;
  /** Parent project; coordinates are scoped to a project. */
  projectId: string;
}

class AppDatabase extends Dexie {
  projects!: EntityTable<ProjectRecord, "projectId">;
  coordinates!: EntityTable<CoordinateRecord, "id">;

  constructor() {
    super("lat-long-db");
    this.version(1).stores({
      coordinates: "id, sortOrder",
    });
    this.version(2).stores({
      coordinates: "id, sortOrder, projectId",
      projects: "projectId, sortOrder",
    });
  }
}

export const db = new AppDatabase();

