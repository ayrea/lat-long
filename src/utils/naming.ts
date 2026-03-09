import type { Coordinate } from "../types";

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Return a name unique among existingNames; if baseName is taken, append _2, _3, etc.
 */
export function deriveUniqueName(
  existingNames: Set<string>,
  baseName: string,
): string {
  const trimmed = baseName.trim() || "1";
  let candidate = trimmed;
  let n = 1;
  while (existingNames.has(candidate)) {
    n += 1;
    candidate = `${trimmed}_${n}`;
  }
  return candidate;
}

/**
 * Next default name for manual add: "1", "2", ... from existing numeric-style names.
 */
export function getNextNumericName(coordinates: Coordinate[]): string {
  const existing = new Set(coordinates.map((c) => c.name));
  let n = 0;
  for (const c of coordinates) {
    const parsed = /^\d+$/.test(c.name) ? parseInt(c.name, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > n) n = parsed;
  }
  return deriveUniqueName(existing, String(n + 1));
}

