import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import { useCallback, useState } from "react";
import { TopBar } from "./components/TopBar";
import { CoordinateForm } from "./components/CoordinateForm";
import { TransactionList } from "./components/TransactionList";
import { getAppTheme, type ColorMode } from "./theme";

const COLOR_MODE_STORAGE_KEY = "lat-long-color-mode";
import { DEFAULT_CRS_CODE, loadCrs } from "./crs";
import { transformCoordinate } from "./transform";
import { projectFromBearingDistance } from "./project";
import type {
  Transaction,
  TransformTransaction,
  ProjectTransaction,
  Coord,
} from "./types";

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

export default function App() {
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    const s = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return s === "dark" ? "dark" : "light";
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formCrsCode, setFormCrsCode] = useState(DEFAULT_CRS_CODE);
  const [formX, setFormX] = useState("");
  const [formY, setFormY] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleColorModeChange = useCallback((mode: ColorMode) => {
    setColorMode(mode);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  }, []);

  const lastTx = transactions.length > 0 ? transactions[transactions.length - 1] : null;
  const currentCrsCode = lastTx
    ? lastTx.type === "transform"
      ? lastTx.targetCrsCode
      : lastTx.sourceCrsCode
    : formCrsCode;
  const currentCoord: Coord | null = lastTx
    ? lastTx.outputCoord
    : (() => {
      const x = parseFloat(formX);
      const y = parseFloat(formY);
      if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
      return null;
    })();

  const handleTransform = useCallback(
    async (targetCrsCode: string) => {
      setError(null);
      if (currentCoord == null) return;
      try {
        const sourceCrs = await loadCrs(currentCrsCode);
        const targetCrs = await loadCrs(targetCrsCode);
        if (!sourceCrs || !targetCrs) {
          setError("Could not load CRS definitions.");
          return;
        }
        const [outX, outY] = transformCoordinate(
          sourceCrs.proj4,
          targetCrs.proj4,
          currentCoord.x,
          currentCoord.y
        );
        const tx: TransformTransaction = {
          id: generateId(),
          type: "transform",
          sourceCrsCode: currentCrsCode,
          targetCrsCode,
          inputCoord: { ...currentCoord },
          outputCoord: { x: outX, y: outY },
        };
        setTransactions((prev) => [...prev, tx]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transform failed.");
      }
    },
    [currentCrsCode, currentCoord]
  );

  const handleProject = useCallback(
    (bearing: number, distance: number) => {
      setError(null);
      if (currentCoord == null) return;
      try {
        const { easting, northing } = projectFromBearingDistance(
          currentCoord.x,
          currentCoord.y,
          bearing,
          distance
        );
        const tx: ProjectTransaction = {
          id: generateId(),
          type: "project",
          sourceCrsCode: currentCrsCode,
          inputCoord: { ...currentCoord },
          outputCoord: { x: easting, y: northing },
          bearing,
          distance,
        };
        setTransactions((prev) => [...prev, tx]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Project failed.");
      }
    },
    [currentCrsCode, currentCoord]
  );

  const handleDeleteLast = useCallback(() => {
    setTransactions((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const handleReset = useCallback(() => {
    setTransactions([]);
    setFormCrsCode(DEFAULT_CRS_CODE);
    setFormX("");
    setFormY("");
    setError(null);
  }, []);

  const handleExport = useCallback(() => {
    const headers = [
      "Index",
      "Type",
      "Source CRS",
      "Target CRS",
      "Input X",
      "Input Y",
      "Output X",
      "Output Y",
      "Bearing",
      "Distance",
    ];
    const rows = transactions.map((tx, i) => {
      const base = [
        i + 1,
        tx.type,
        tx.sourceCrsCode,
        tx.type === "transform" ? tx.targetCrsCode : "",
        tx.inputCoord.x,
        tx.inputCoord.y,
        tx.outputCoord.x,
        tx.outputCoord.y,
      ];
      if (tx.type === "project") {
        return [...base.slice(0, 4), ...base.slice(4, 8), tx.bearing, tx.distance];
      }
      return [...base, "", ""];
    });
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
  }, [transactions]);

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
          hasTransactions={transactions.length > 0}
          onReset={handleReset}
          onExport={handleExport}
        />
        {error != null && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <CoordinateForm
          transactions={transactions}
          currentCrsCode={currentCrsCode}
          currentCoord={currentCoord}
          formCrsCode={formCrsCode}
          formX={formX}
          formY={formY}
          onFormCrsChange={setFormCrsCode}
          onFormXChange={setFormX}
          onFormYChange={setFormY}
          onTransform={handleTransform}
          onProject={handleProject}
          onDeleteLast={handleDeleteLast}
        >
          <TransactionList transactions={transactions} />
        </CoordinateForm>
      </Box>
    </ThemeProvider>
  );
}
