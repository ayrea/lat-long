import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import { useCallback, useState } from "react";
import { TopBar } from "./components/TopBar";
import { CoordinateForm } from "./components/CoordinateForm";
import { getAppTheme, type ColorMode } from "./theme";
import { loadCrs, setStoredDefaultCrs } from "./crs";
import { transformCoordinate } from "./transform";
import { projectFromBearingDistance } from "./project";
import type { Coordinate } from "./types";

const COLOR_MODE_STORAGE_KEY = "lat-long-color-mode";

function generateId(): string {
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
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleColorModeChange = useCallback((mode: ColorMode) => {
    setColorMode(mode);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  }, []);

  const handleAddCoordinate = useCallback(
    (payload: {
      crsCode: string;
      x: number;
      y: number;
      nameOverride?: string;
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
    const headers = ["Name", "CRS Code", "CRS Name", "X", "Y"];
    const rows = coordinates.map((c) => [
      c.name,
      c.crsCode,
      crsNameByCode[c.crsCode] ?? "",
      c.x,
      c.y,
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
          maxWidth: 720,
          mx: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <TopBar
          colorMode={colorMode}
          onColorModeChange={handleColorModeChange}
          hasCoordinates={coordinates.length > 0}
          onReset={handleReset}
          onExport={handleExport}
          onAddCoordinate={() => setAddDialogOpen(true)}
        />
        {error != null && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
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
        />
      </Box>
    </ThemeProvider>
  );
}
