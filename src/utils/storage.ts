import type { ColorMode } from "../theme";

export function parseStoredInt(
  key: string,
  defaultVal: number,
  min: number,
  max: number,
): number {
  try {
    const s = localStorage.getItem(key);
    if (s == null) return defaultVal;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : defaultVal;
  } catch {
    return defaultVal;
  }
}

const COLOR_MODE_STORAGE_KEY = "lat-long-color-mode";
const GPS_WARMUP_STORAGE_KEY = "lat-long-gps-warmup-seconds";
const GPS_DURATION_STORAGE_KEY = "lat-long-gps-averaging-duration-seconds";

export function getStoredColorMode(defaultVal: ColorMode): ColorMode {
  try {
    const s = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return s === "light" || s === "dark" ? (s as ColorMode) : defaultVal;
  } catch {
    return defaultVal;
  }
}

export function setStoredColorMode(mode: ColorMode): void {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function getStoredGpsWarmupSeconds(): number {
  return parseStoredInt(GPS_WARMUP_STORAGE_KEY, 30, 1, 600);
}

export function getStoredGpsAveragingDurationSeconds(): number {
  return parseStoredInt(GPS_DURATION_STORAGE_KEY, 60, 1, 600);
}

export function setStoredGpsWarmupSeconds(seconds: number): void {
  try {
    localStorage.setItem(GPS_WARMUP_STORAGE_KEY, String(seconds));
  } catch {
    // ignore
  }
}

export function setStoredGpsAveragingDurationSeconds(seconds: number): void {
  try {
    localStorage.setItem(GPS_DURATION_STORAGE_KEY, String(seconds));
  } catch {
    // ignore
  }
}

