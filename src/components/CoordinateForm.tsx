import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import {
  getAllCrsList,
  DEFAULT_CRS_CODE,
  DEFAULT_CRS_LABEL,
  loadCrs,
  getAxisLabels,
  isProjectedCrs,
} from "../crs";
import type { CRSOption } from "../crs";
import { CoordinateCard } from "./CoordinateCard";
import { TransactionList } from "./TransactionList";
import { VirtualizedListbox } from "./VirtualizedListbox";
import type { Coord, CRSInfo, Transaction } from "../types";

const FALLBACK_LABELS = { first: "X", second: "Y" } as const;

interface CoordinateFormProps {
  transactions: Transaction[];
  currentCrsCode: string;
  currentCoord: Coord | null;
  formCrsCode: string;
  formX: string;
  formY: string;
  onFormCrsChange: (code: string) => void;
  onFormXChange: (value: string) => void;
  onFormYChange: (value: string) => void;
  onTransform: (targetCrsCode: string) => void;
  onProject: (bearing: number, distance: number) => void;
  onDeleteLast: () => void;
}

export type AxisLabels = { first: string; second: string };

function LocationIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function optionForCode(code: string, options: CRSOption[]): CRSOption {
  const found = options.find((o) => o.code === code);
  if (found) return found;
  return {
    code,
    name: "",
    label: code === DEFAULT_CRS_CODE ? DEFAULT_CRS_LABEL : `EPSG:${code}`,
  };
}

export function CoordinateForm({
  transactions,
  currentCrsCode,
  currentCoord,
  formCrsCode,
  formX,
  formY,
  onFormCrsChange,
  onFormXChange,
  onFormYChange,
  onTransform,
  onProject,
  onDeleteLast,
}: CoordinateFormProps) {
  const [crsInfo, setCrsInfo] = useState<CRSInfo | null>(null);
  const [crsOptions, setCrsOptions] = useState<CRSOption[] | null>(null);
  const [crsLoading, setCrsLoading] = useState(false);
  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  const [targetCrsCode, setTargetCrsCode] = useState(DEFAULT_CRS_CODE);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [bearing, setBearing] = useState("");
  const [distance, setDistance] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoUnavailable, setGeoUnavailable] = useState(false);
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);
  const [geoSbOpen, setGeoSbOpen] = useState(false);
  const [crsLabelsByCode, setCrsLabelsByCode] = useState<
    Record<string, AxisLabels>
  >({});

  const hasTransactions = transactions.length > 0;
  const isWgs84Form =
    !hasTransactions && formCrsCode === DEFAULT_CRS_CODE;
  const geoAvailable =
    typeof navigator !== "undefined" && !!navigator.geolocation;
  const geoButtonDisabled =
    !geoAvailable ||
    geoUnavailable ||
    geoLoading ||
    geoPermissionDenied;

  useEffect(() => {
    if (!isWgs84Form || !geoAvailable) return;
    const permissions =
      typeof navigator !== "undefined" &&
      "permissions" in navigator &&
      (navigator as { permissions?: { query: (p: { name: string }) => Promise<{ state: string }> } }).permissions;
    if (!permissions) return;
    permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "denied") setGeoPermissionDenied(true);
      })
      .catch(() => { });
  }, [isWgs84Form, geoAvailable]);

  const handleUseCurrentPosition = () => {
    if (!navigator.geolocation || geoButtonDisabled) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onFormXChange(String(position.coords.longitude));
        onFormYChange(String(position.coords.latitude));
        setGeoLoading(false);
      },
      () => {
        setGeoUnavailable(true);
        setGeoLoading(false);
        setGeoSbOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  const coord = hasTransactions
    ? currentCoord
    : (() => {
      const x = parseFloat(formX);
      const y = parseFloat(formY);
      if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
      return null;
    })();
  const crsCodeForActions = hasTransactions ? currentCrsCode : formCrsCode;

  const loadCrsOptions = () => {
    if (crsOptions !== null) return;
    setCrsLoading(true);
    getAllCrsList().then((list) => {
      setCrsOptions(list);
      setCrsLoading(false);
    });
  };

  useEffect(() => {
    loadCrs(crsCodeForActions).then(setCrsInfo);
  }, [crsCodeForActions]);

  useEffect(() => {
    const codes = new Set<string>();
    for (const tx of transactions) {
      codes.add(tx.sourceCrsCode);
      if (tx.type === "transform") codes.add(tx.targetCrsCode);
    }
    if (codes.size === 0) {
      setCrsLabelsByCode({});
      return;
    }
    let cancelled = false;
    Promise.all(
      Array.from(codes).map(async (code) => {
        const info = await loadCrs(code);
        if (cancelled || !info) return [code, null] as const;
        return [code, getAxisLabels(info)] as const;
      })
    ).then((entries) => {
      if (cancelled) return;
      const next: Record<string, AxisLabels> = {};
      for (const [code, labels] of entries) {
        if (labels) next[code] = labels;
      }
      setCrsLabelsByCode((prev) => ({ ...prev, ...next }));
    });
    return () => {
      cancelled = true;
    };
  }, [transactions]);

  const labels = crsInfo ? getAxisLabels(crsInfo) : FALLBACK_LABELS;
  const canProject =
    crsInfo != null && isProjectedCrs(crsInfo) && coord != null;

  const options = crsOptions ?? [];
  const formCrsValue = optionForCode(formCrsCode, options);
  const targetOptions = options.filter((o) => o.code !== crsCodeForActions);
  const targetCrsValue = optionForCode(targetCrsCode, targetOptions);

  const handleOpenTransform = () => {
    const firstOther = targetOptions[0];
    const fallback =
      crsCodeForActions === DEFAULT_CRS_CODE ? "3857" : DEFAULT_CRS_CODE;
    setTargetCrsCode(firstOther ? firstOther.code : fallback);
    setTransformDialogOpen(true);
  };
  const handleTransformConfirm = () => {
    onTransform(targetCrsCode);
    setTransformDialogOpen(false);
  };

  const handleOpenProject = () => {
    setBearing("");
    setDistance("");
    setProjectDialogOpen(true);
  };
  const handleProjectConfirm = () => {
    const b = parseFloat(bearing);
    const d = parseFloat(distance);
    if (Number.isFinite(b) && Number.isFinite(d) && d >= 0) {
      onProject(b, d);
      setProjectDialogOpen(false);
    }
  };
  const projectValid =
    Number.isFinite(parseFloat(bearing)) &&
    Number.isFinite(parseFloat(distance)) &&
    parseFloat(distance) >= 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {!hasTransactions ? (
        <>
          <Autocomplete<CRSOption>
            fullWidth
            size="small"
            options={options}
            value={formCrsValue}
            loading={crsLoading}
            onOpen={loadCrsOptions}
            getOptionLabel={(opt) => opt.label}
            isOptionEqualToValue={(a, b) => a.code === b.code}
            onChange={(_, newValue) => {
              if (newValue) onFormCrsChange(newValue.code);
            }}
            slots={{ listbox: VirtualizedListbox }}
            renderOption={(props, option) => (
              <li {...props}>
                <Box
                  component="span"
                  sx={{
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    display: "block",
                    lineHeight: 1.4,
                    py: 0.5,
                  }}
                >
                  {option.label}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Coordinate reference system"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {crsLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              label={labels.first}
              type="number"
              value={formX}
              onChange={(e) => onFormXChange(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { step: "any" } }}
            />
            <TextField
              label={labels.second}
              type="number"
              value={formY}
              onChange={(e) => onFormYChange(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { step: "any" } }}
            />
            {isWgs84Form && (
              <Tooltip
                title={
                  geoPermissionDenied
                    ? "Location services must be enabled for this site to use this feature"
                    : "Use current location"
                }
              >
                <span>
                  <IconButton
                    color="primary"
                    onClick={handleUseCurrentPosition}
                    disabled={geoButtonDisabled}
                    aria-label="Use current location"
                    size="small"
                    sx={{ flexShrink: 0 }}
                  >
                    {geoLoading ? (
                      <CircularProgress color="inherit" size={24} />
                    ) : (
                      <LocationIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        </>
      ) : null}

      <TransactionList
        transactions={transactions}
        crsLabelsByCode={crsLabelsByCode}
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {hasTransactions && currentCoord != null && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Current (EPSG:{currentCrsCode})
            </Typography>
            <CoordinateCard coord={currentCoord} axisLabels={labels} />
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            onClick={handleOpenTransform}
            disabled={coord == null}
          >
            Transform
          </Button>
          {canProject && (
            <Button
              variant="contained"
              onClick={handleOpenProject}
            >
              Project
            </Button>
          )}
          {hasTransactions && (
            <Button variant="outlined" color="error" onClick={onDeleteLast}>
              Delete last
            </Button>
          )}
        </Box>
        {!hasTransactions &&
          coord == null &&
          (formX !== "" || formY !== "") && (
            <Typography variant="body2" color="text.secondary">
              Enter valid numbers for both coordinates to enable Transform.
            </Typography>
          )}
      </Box>

      <Dialog
        open={transformDialogOpen}
        onClose={() => setTransformDialogOpen(false)}
      >
        <DialogTitle>Transform to CRS</DialogTitle>
        <DialogContent>
          <Autocomplete<CRSOption>
            fullWidth
            size="small"
            sx={{ mt: 1, minWidth: 280 }}
            options={targetOptions}
            value={targetCrsValue}
            loading={crsLoading}
            onOpen={loadCrsOptions}
            getOptionLabel={(opt) => opt.label}
            isOptionEqualToValue={(a, b) => a.code === b.code}
            onChange={(_, newValue) => {
              if (newValue) setTargetCrsCode(newValue.code);
            }}
            slots={{ listbox: VirtualizedListbox }}
            renderOption={(props, option) => (
              <li {...props}>
                <Box
                  component="span"
                  sx={{
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    display: "block",
                    lineHeight: 1.4,
                    py: 0.5,
                  }}
                >
                  {option.label}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Target CRS"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {crsLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransformDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTransformConfirm} variant="contained">
            Transform
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
      >
        <DialogTitle>Project by bearing and distance</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
              minWidth: 280,
            }}
          >
            <TextField
              label="Bearing (degrees from North)"
              type="number"
              value={bearing}
              onChange={(e) => setBearing(e.target.value)}
              size="small"
              slotProps={{ htmlInput: { step: "any", min: 0, max: 360 } }}
            />
            <TextField
              label="Distance"
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              size="small"
              slotProps={{ htmlInput: { step: "any", min: 0 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleProjectConfirm}
            variant="contained"
            disabled={!projectValid}
          >
            Project
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={geoSbOpen}
        autoHideDuration={6000}
        onClose={() => setGeoSbOpen(false)}
        message="Could not get location"
      />
    </Box>
  );
}
