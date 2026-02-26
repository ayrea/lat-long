import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { CoordinateForm } from "./components/CoordinateForm";
import { TopBar } from "./components/TopBar";
import type { SettingsValues } from "./components/SettingsDialog";
import { getAppTheme, type ColorMode } from "./theme";
import { loadCrs, setStoredDefaultCrs } from "./crs";
import { transformCoordinate } from "./transform";
import {
  projectFromBearingDistance,
  bearingDistanceBetween,
} from "./project";
import type { Coordinate } from "./types";

const COLOR_MODE_STORAGE_KEY = "lat-long-color-mode";
const GPS_WARMUP_STORAGE_KEY = "lat-long-gps-warmup-seconds";
const GPS_DURATION_STORAGE_KEY = "lat-long-gps-averaging-duration-seconds";

function parseStoredInt(
  key: string,
  defaultVal: number,
  min: number,
  max: number
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

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Return a name unique among existingNames; if baseName is taken, append _2, _3, etc. */
function deriveUniqueName(existingNames: Set<string>, baseName: string): string {
  let candidate = baseName.trim() || "1";
  let n = 1;
  while (existingNames.has(candidate)) {
    n += 1;
    candidate = `${baseName.trim() || "1"}_${n}`;
  }
  return candidate;
}

/** Next default name for manual add: "1", "2", ... from existing numeric-style names. */
function getNextNumericName(coordinates: Coordinate[]): string {
  const existing = new Set(coordinates.map((c) => c.name));
  let n = 0;
  for (const c of coordinates) {
    const parsed = /^\d+$/.test(c.name) ? parseInt(c.name, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > n) n = parsed;
  }
  return deriveUniqueName(existing, String(n + 1));
}

export default function App() {
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    const s = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return s === "light" ? "light" : "dark";
  });
  const [warmupSeconds, setWarmupSeconds] = useState(() =>
    parseStoredInt(GPS_WARMUP_STORAGE_KEY, 30, 1, 600)
  );
  const [averagingDurationSeconds, setAveragingDurationSeconds] = useState(
    () => parseStoredInt(GPS_DURATION_STORAGE_KEY, 60, 1, 600)
  );
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (coordinates.length === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Browsers do not allow custom beforeunload messages (they show a generic
      // "Leave site?" prompt) for security reasons. preventDefault() alone
      // triggers the dialog.
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [coordinates.length]);

  const handleSaveSettings = useCallback((settings: SettingsValues) => {
    setColorMode(settings.colorMode);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, settings.colorMode);
    setWarmupSeconds(settings.warmupSeconds);
    setAveragingDurationSeconds(settings.averagingDurationSeconds);
    localStorage.setItem(GPS_WARMUP_STORAGE_KEY, String(settings.warmupSeconds));
    localStorage.setItem(
      GPS_DURATION_STORAGE_KEY,
      String(settings.averagingDurationSeconds)
    );
  }, []);

  const handleAddCoordinate = useCallback(
    (payload: {
      crsCode: string;
      x: number;
      y: number;
      nameOverride?: string;
      notes?: string;
    }) => {
      const existing = new Set(coordinates.map((c) => c.name));
      const name =
        payload.nameOverride !== undefined
          ? deriveUniqueName(existing, payload.nameOverride)
          : getNextNumericName(coordinates);
      setStoredDefaultCrs(payload.crsCode);
      setCoordinates((prev) => [
        ...prev,
        {
          id: generateId(),
          name,
          crsCode: payload.crsCode,
          x: payload.x,
          y: payload.y,
          cardType: "manual" as const,
          ...(payload.notes != null && payload.notes !== ""
            ? { notes: payload.notes }
            : {}),
        },
      ]);
    },
    [coordinates]
  );

  const handleTransform = useCallback(
    async (coordinateId: string, targetCrsCode: string) => {
      setError(null);
      const source = coordinates.find((c) => c.id === coordinateId);
      if (!source) return;
      try {
        const [sourceCrs, targetCrs] = await Promise.all([
          loadCrs(source.crsCode),
          loadCrs(targetCrsCode),
        ]);
        if (!sourceCrs || !targetCrs) {
          setError("Could not load CRS definitions.");
          return;
        }
        const [outX, outY] = transformCoordinate(
          sourceCrs.proj4,
          targetCrs.proj4,
          source.x,
          source.y
        );
        const existing = new Set(coordinates.map((c) => c.name));
        const newName = deriveUniqueName(
          existing,
          `${source.name}_Transform`
        );
        setCoordinates((prev) => [
          ...prev,
          {
            id: generateId(),
            name: newName,
            crsCode: targetCrsCode,
            x: outX,
            y: outY,
            cardType: "transform" as const,
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transform failed.");
      }
    },
    [coordinates]
  );

  const handleProject = useCallback(
    (coordinateId: string, bearing: number, distance: number) => {
      setError(null);
      const source = coordinates.find((c) => c.id === coordinateId);
      if (!source) return;
      try {
        const { easting, northing } = projectFromBearingDistance(
          source.x,
          source.y,
          bearing,
          distance
        );
        const existing = new Set(coordinates.map((c) => c.name));
        const newName = deriveUniqueName(existing, `${source.name}_Project`);
        setCoordinates((prev) => [
          ...prev,
          {
            id: generateId(),
            name: newName,
            crsCode: source.crsCode,
            x: easting,
            y: northing,
            cardType: "project" as const,
            notes: `Projected from ${source.name}: bearing ${bearing.toFixed(1)}°, distance ${distance.toFixed(2)} units`,
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Project failed.");
      }
    },
    [coordinates]
  );

  const handleRename = useCallback(
    (coordinateId: string, newName: string) => {
      const unique = deriveUniqueName(
        new Set(coordinates.map((c) => (c.id === coordinateId ? "" : c.name))),
        newName.trim()
      );
      setCoordinates((prev) =>
        prev.map((c) =>
          c.id === coordinateId ? { ...c, name: unique } : c
        )
      );
    },
    [coordinates]
  );

  const handleDelete = useCallback((coordinateId: string) => {
    setCoordinates((prev) => prev.filter((c) => c.id !== coordinateId));
  }, []);

  const handleUpdateNote = useCallback((coordinateId: string, notes: string) => {
    setCoordinates((prev) =>
      prev.map((c) =>
        c.id === coordinateId ? { ...c, notes } : c
      )
    );
  }, []);

  const handleFindBearing = useCallback(
    (sourceCoordinateId: string, targetCoordinateId: string) => {
      setError(null);
      const source = coordinates.find((c) => c.id === sourceCoordinateId);
      const target = coordinates.find((c) => c.id === targetCoordinateId);
      if (!source || !target) return;
      try {
        const { bearingDeg, distance } = bearingDistanceBetween(
          source.x,
          source.y,
          target.x,
          target.y
        );
        const line = `Bearing to ${target.name}: ${bearingDeg.toFixed(1)}°, distance: ${distance.toFixed(2)} units`;
        const existing = (source.notes ?? "").trim();
        const newNotes = existing ? `${existing}\n${line}` : line;
        setCoordinates((prev) =>
          prev.map((c) =>
            c.id === sourceCoordinateId ? { ...c, notes: newNotes } : c
          )
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Find bearing failed.");
      }
    },
    [coordinates]
  );

  const handleReset = useCallback(() => {
    setCoordinates([]);
    setError(null);
  }, []);

  const handleExport = useCallback(async () => {
    const codes = new Set(coordinates.map((c) => c.crsCode));
    const crsNameByCode: Record<string, string> = {};
    await Promise.all(
      Array.from(codes).map(async (code) => {
        const info = await loadCrs(code);
        crsNameByCode[code] = info?.name ?? "";
      })
    );
    const headers = ["Id", "Name", "CRS Code", "CRS Name", "X", "Y", "Notes"];
    const rows = coordinates.map((c) => [
      c.id,
      c.name,
      c.crsCode,
      crsNameByCode[c.crsCode] ?? "",
      c.x,
      c.y,
      c.notes ?? "",
    ]);
    const csv =
      headers.map(escapeCsvCell).join(",") +
      "\n" +
      rows.map((r) => r.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coordinates-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [coordinates]);

  return (
    <ThemeProvider theme={getAppTheme(colorMode)}>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          overflow: "hidden",
          maxWidth: 720,
          mx: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <TopBar
            colorMode={colorMode}
            hasCoordinates={coordinates.length > 0}
            onReset={handleReset}
            onExport={handleExport}
            onAddCoordinate={() => setAddDialogOpen(true)}
            warmupSeconds={warmupSeconds}
            averagingDurationSeconds={averagingDurationSeconds}
            onSaveSettings={handleSaveSettings}
          />
        </Box>
        {error != null && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 2, flexShrink: 0 }}
          >
            {error}
          </Alert>
        )}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          <CoordinateForm
            coordinates={coordinates}
            nextSuggestedName={getNextNumericName(coordinates)}
            addDialogOpen={addDialogOpen}
            onAddDialogOpen={() => setAddDialogOpen(true)}
            onAddDialogClose={() => setAddDialogOpen(false)}
            onAddCoordinate={handleAddCoordinate}
            onTransform={handleTransform}
            onProject={handleProject}
            onRename={handleRename}
            onDelete={handleDelete}
            onUpdateNote={handleUpdateNote}
            onFindBearing={handleFindBearing}
            warmupSeconds={warmupSeconds}
            averagingDurationSeconds={averagingDurationSeconds}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
