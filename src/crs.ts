import type { CRSInfo, EpsgIndexEntry } from "./types";

export const DEFAULT_CRS_CODE = "4326";

/** Default label for initial display before full list is loaded. */
export const DEFAULT_CRS_LABEL = "WGS 84 (EPSG:4326)";

export interface CRSOption {
  code: string;
  name: string;
  label: string;
}

/** Some entries in all.json have proj4: null; we only use entries with proj4. */
type AllJson = Record<string, EpsgIndexEntry & { proj4?: string | null }>;

let allCrsListCache: CRSOption[] | null = null;
let allCrsByCodeCache: Record<string, EpsgIndexEntry> | null = null;

const crsLoaderMap: Record<string, () => Promise<{ default: EpsgIndexEntry }>> = {
  "4326": () => import("epsg-index/s/4326.json"),
  "3857": () => import("epsg-index/s/3857.json"),
  "27700": () => import("epsg-index/s/27700.json"),
  "32630": () => import("epsg-index/s/32630.json"),
  "32631": () => import("epsg-index/s/32631.json"),
  "32730": () => import("epsg-index/s/32730.json"),
  "2154": () => import("epsg-index/s/2154.json"),
  "25832": () => import("epsg-index/s/25832.json"),
  "4979": () => import("epsg-index/s/4979.json"),
};

function toCRSInfo(entry: EpsgIndexEntry): CRSInfo {
  return {
    code: entry.code,
    name: entry.name,
    kind: entry.kind,
    proj4: entry.proj4,
  };
}

/**
 * Load full CRS list from epsg-index (all.json). Cached after first load.
 * Use for dropdown options; call when dropdown opens (e.g. onOpen).
 */
export function getAllCrsList(): Promise<CRSOption[]> {
  if (allCrsListCache != null) {
    return Promise.resolve(allCrsListCache);
  }
  return import("epsg-index/all.json").then((mod: unknown) => {
    const all = (mod as { default: AllJson }).default;
    const byCode: Record<string, EpsgIndexEntry> = {};
    const list: CRSOption[] = [];
    for (const code of Object.keys(all)) {
      const entry = all[code];
      if (!entry?.code || !entry?.name || !entry.proj4) continue;
      byCode[entry.code] = {
        code: entry.code,
        name: entry.name,
        kind: entry.kind,
        proj4: entry.proj4,
      };
      list.push({
        code: entry.code,
        name: entry.name,
        label: `${entry.name} (EPSG:${entry.code})`,
      });
    }
    allCrsByCodeCache = byCode;
    allCrsListCache = list;
    return list;
  });
}

/** Load CRS definition by code. Uses all.json cache when loaded; otherwise fallback to static loaders for initial 9 codes. */
export async function loadCrs(code: string): Promise<CRSInfo | null> {
  if (allCrsByCodeCache != null) {
    const entry = allCrsByCodeCache[code];
    if (entry) return toCRSInfo(entry);
    return null;
  }
  const loader = crsLoaderMap[code];
  if (!loader) return null;
  const mod = await loader();
  return toCRSInfo(mod.default);
}

/** Whether the CRS is projected (e.g. UTM, Lambert) rather than geographic (lat/lon). */
export function isProjectedCrs(crs: CRSInfo): boolean {
  return crs.kind.includes("PROJCRS");
}

/** Axis labels for display (e.g. Longitude/Latitude vs Easting/Northing). */
export function getAxisLabels(crs: CRSInfo): { first: string; second: string } {
  if (isProjectedCrs(crs)) {
    return { first: "Easting", second: "Northing" };
  }
  return { first: "Longitude", second: "Latitude" };
}

const DEFAULT_CRS_STORAGE_KEY = "lat-long-default-crs";

/** Read persisted default CRS code; returns DEFAULT_CRS_CODE if missing or invalid. */
export function getStoredDefaultCrs(): string {
  if (typeof localStorage === "undefined") return DEFAULT_CRS_CODE;
  const s = localStorage.getItem(DEFAULT_CRS_STORAGE_KEY);
  return s && s.trim() ? s.trim() : DEFAULT_CRS_CODE;
}

/** Persist default CRS code for next session and manual adds. */
export function setStoredDefaultCrs(code: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEFAULT_CRS_STORAGE_KEY, code);
}
