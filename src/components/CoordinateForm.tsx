import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useEffect, type ReactNode } from "react";
import {
  getAllCrsList,
  DEFAULT_CRS_CODE,
  DEFAULT_CRS_LABEL,
  loadCrs,
  getAxisLabels,
  isProjectedCrs,
} from "../crs";
import type { CRSOption } from "../crs";
import { VirtualizedListbox } from "./VirtualizedListbox";
import type { Coord, CRSInfo, Transaction } from "../types";

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
  children?: ReactNode;
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
  children,
}: CoordinateFormProps) {
  const [crsInfo, setCrsInfo] = useState<CRSInfo | null>(null);
  const [crsOptions, setCrsOptions] = useState<CRSOption[] | null>(null);
  const [crsLoading, setCrsLoading] = useState(false);
  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  const [targetCrsCode, setTargetCrsCode] = useState(DEFAULT_CRS_CODE);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [bearing, setBearing] = useState("");
  const [distance, setDistance] = useState("");

  const hasTransactions = transactions.length > 0;
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

  const labels = crsInfo ? getAxisLabels(crsInfo) : { first: "X", second: "Y" };
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
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
          </Box>
        </>
      ) : null}

      {children}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {hasTransactions && (
          <Typography variant="body2" color="text.secondary">
            Current: EPSG:{currentCrsCode} —{" "}
            {currentCoord != null
              ? `${currentCoord.x.toFixed(6)}, ${currentCoord.y.toFixed(6)}`
              : "—"}
          </Typography>
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
              color="secondary"
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
    </Box>
  );
}
