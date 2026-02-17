import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState, useEffect, useRef } from "react";
import {
  getAllCrsList,
  DEFAULT_CRS_CODE,
  DEFAULT_CRS_LABEL,
  loadCrs,
  getAxisLabels,
  isProjectedCrs,
  getStoredDefaultCrs,
  setStoredDefaultCrs,
} from "../crs";
import type { CRSOption } from "../crs";
import { CoordinateList } from "./CoordinateList";
import { VirtualizedListbox } from "./VirtualizedListbox";
import type { Coordinate } from "../types";

const FALLBACK_LABELS = { first: "X", second: "Y" } as const;

export type AxisLabels = { first: string; second: string };

interface CoordinateFormProps {
  coordinates: Coordinate[];
  /** Default name shown when adding a new coordinate (e.g. "1", "2"). */
  nextSuggestedName: string;
  addDialogOpen: boolean;
  onAddDialogOpen: () => void;
  onAddDialogClose: () => void;
  onAddCoordinate: (payload: {
    crsCode: string;
    x: number;
    y: number;
    nameOverride?: string;
    notes?: string;
  }) => void;
  onTransform: (coordinateId: string, targetCrsCode: string) => void;
  onProject: (coordinateId: string, bearing: number, distance: number) => void;
  onRename: (coordinateId: string, newName: string) => void;
  onUpdateNote: (coordinateId: string, notes: string) => void;
  onFindBearing: (sourceCoordinateId: string, targetCoordinateId: string) => void;
  onDelete: (coordinateId: string) => void;
}

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

/** Icon suggesting multiple measurements (stacked/ghosted location pins). */
function GpsAveragingIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        opacity="0.35"
        transform="translate(-4, 0)"
      />
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        opacity="0.6"
        transform="translate(4, 0)"
      />
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
  coordinates,
  nextSuggestedName,
  addDialogOpen,
  onAddDialogOpen,
  onAddDialogClose,
  onAddCoordinate,
  onTransform,
  onProject,
  onRename,
  onUpdateNote,
  onFindBearing,
  onDelete,
}: CoordinateFormProps) {
  const [crsOptions, setCrsOptions] = useState<CRSOption[] | null>(null);
  const [crsLoading, setCrsLoading] = useState(false);
  const [crsLabelsByCode, setCrsLabelsByCode] = useState<
    Record<string, AxisLabels>
  >(() => ({
    [DEFAULT_CRS_CODE]: { first: "Longitude", second: "Latitude" },
  }));
  const [crsNameByCode, setCrsNameByCode] = useState<Record<string, string>>(
    () => ({})
  );
  const [projectableCrsCodes, setProjectableCrsCodes] = useState<Set<string>>(
    () => new Set()
  );

  const [formCrsCode, setFormCrsCode] = useState(
    () => getStoredDefaultCrs() || DEFAULT_CRS_CODE
  );
  const [formName, setFormName] = useState("");
  const [formX, setFormX] = useState("");
  const [formY, setFormY] = useState("");

  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  const [transformCoordinateId, setTransformCoordinateId] = useState<
    string | null
  >(null);
  const [targetCrsCode, setTargetCrsCode] = useState(DEFAULT_CRS_CODE);

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectCoordinateId, setProjectCoordinateId] = useState<
    string | null
  >(null);
  const [bearing, setBearing] = useState("");
  const [distance, setDistance] = useState("");

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameCoordinateId, setRenameCoordinateId] = useState<string | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteCoordinateId, setNoteCoordinateId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");

  const [findBearingDialogOpen, setFindBearingDialogOpen] = useState(false);
  const [findBearingSourceId, setFindBearingSourceId] = useState<string | null>(
    null
  );
  const [findBearingTargetId, setFindBearingTargetId] = useState<string | null>(
    null
  );

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoUnavailable, setGeoUnavailable] = useState(false);
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);
  const [geoSbOpen, setGeoSbOpen] = useState(false);

  const [gpsAveragingDialogOpen, setGpsAveragingDialogOpen] = useState(false);
  const [gpsReadings, setGpsReadings] = useState<
    { longitude: number; latitude: number }[]
  >([]);
  const gpsAveragingCancelledRef = useRef(false);
  const gpsAveragingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const isWgs84Form = formCrsCode === DEFAULT_CRS_CODE;
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

  const handleFormCrsChange = (code: string) => {
    setFormCrsCode(code);
    setStoredDefaultCrs(code);
  };

  const loadCrsOptions = () => {
    if (crsOptions !== null) return;
    setCrsLoading(true);
    getAllCrsList().then((list) => {
      setCrsOptions(list);
      setCrsLoading(false);
    });
  };

  useEffect(() => {
    const codes = new Set<string>();
    codes.add(formCrsCode);
    for (const c of coordinates) {
      codes.add(c.crsCode);
    }
    if (codes.size === 0) {
      setCrsLabelsByCode({});
      setCrsNameByCode({});
      setProjectableCrsCodes(new Set());
      return;
    }
    let cancelled = false;
    Promise.all(
      Array.from(codes).map(async (code) => {
        const info = await loadCrs(code);
        if (cancelled || !info) return [code, null] as const;
        return [
          code,
          {
            labels: getAxisLabels(info),
            projected: isProjectedCrs(info),
            name: info.name,
          },
        ] as const;
      })
    ).then((entries) => {
      if (cancelled) return;
      const nextLabels: Record<string, AxisLabels> = {};
      const nextNames: Record<string, string> = {};
      const nextProjectable = new Set<string>();
      for (const [code, data] of entries) {
        if (data) {
          nextLabels[code] = data.labels;
          if (data.name) nextNames[code] = data.name;
          if (data.projected) nextProjectable.add(code);
        }
      }
      setCrsLabelsByCode((prev) => ({ ...prev, ...nextLabels }));
      setCrsNameByCode((prev) => ({ ...prev, ...nextNames }));
      setProjectableCrsCodes(nextProjectable);
    });
    return () => {
      cancelled = true;
    };
  }, [coordinates, formCrsCode]);

  const options = crsOptions ?? [];
  const formCrsValue = optionForCode(formCrsCode, options);

  const handleUseCurrentPosition = () => {
    if (!navigator.geolocation || geoButtonDisabled) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormX(String(position.coords.longitude));
        setFormY(String(position.coords.latitude));
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

  const addValid =
    Number.isFinite(parseFloat(formX)) &&
    Number.isFinite(parseFloat(formY));
  const handleAddCoordinate = () => {
    const x = parseFloat(formX);
    const y = parseFloat(formY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    onAddCoordinate({
      crsCode: formCrsCode,
      x,
      y,
      nameOverride: formName.trim() || undefined,
    });
    setFormName("");
    setFormX("");
    setFormY("");
    onAddDialogClose();
  };

  const handleAddDialogClose = () => {
    onAddDialogClose();
    setFormName("");
    setFormX("");
    setFormY("");
  };

  const handleOpenTransform = (id: string) => {
    setTransformCoordinateId(id);
    const coord = coordinates.find((c) => c.id === id);
    const crsCode = coord?.crsCode ?? DEFAULT_CRS_CODE;
    const targetOptions = options.filter((o) => o.code !== crsCode);
    const firstOther = targetOptions[0];
    const fallback =
      crsCode === DEFAULT_CRS_CODE ? "3857" : DEFAULT_CRS_CODE;
    setTargetCrsCode(firstOther ? firstOther.code : fallback);
    setTransformDialogOpen(true);
  };
  const handleTransformConfirm = () => {
    if (transformCoordinateId) {
      onTransform(transformCoordinateId, targetCrsCode);
      setTransformDialogOpen(false);
      setTransformCoordinateId(null);
    }
  };

  const handleOpenProject = (id: string) => {
    setProjectCoordinateId(id);
    setBearing("");
    setDistance("");
    setProjectDialogOpen(true);
  };
  const handleProjectConfirm = () => {
    const b = parseFloat(bearing);
    const d = parseFloat(distance);
    if (
      projectCoordinateId &&
      Number.isFinite(b) &&
      Number.isFinite(d) &&
      d >= 0
    ) {
      onProject(projectCoordinateId, b, d);
      setProjectDialogOpen(false);
      setProjectCoordinateId(null);
    }
  };
  const projectValid =
    Number.isFinite(parseFloat(bearing)) &&
    Number.isFinite(parseFloat(distance)) &&
    parseFloat(distance) >= 0;

  const handleOpenRename = (id: string) => {
    const coord = coordinates.find((c) => c.id === id);
    setRenameCoordinateId(id);
    setRenameValue(coord?.name ?? "");
    setRenameDialogOpen(true);
  };
  const handleRenameConfirm = () => {
    const trimmed = renameValue.trim();
    if (renameCoordinateId && trimmed) {
      onRename(renameCoordinateId, trimmed);
      setRenameDialogOpen(false);
      setRenameCoordinateId(null);
      setRenameValue("");
    }
  };

  const handleOpenNote = (id: string) => {
    const coord = coordinates.find((c) => c.id === id);
    setNoteCoordinateId(id);
    setNoteValue(coord?.notes ?? "");
    setNoteDialogOpen(true);
  };
  const handleNoteConfirm = () => {
    if (noteCoordinateId != null) {
      onUpdateNote(noteCoordinateId, noteValue);
      setNoteDialogOpen(false);
      setNoteCoordinateId(null);
      setNoteValue("");
    }
  };

  const handleOpenFindBearing = (id: string) => {
    setFindBearingSourceId(id);
    setFindBearingTargetId(null);
    setFindBearingDialogOpen(true);
  };
  const handleFindBearingConfirm = () => {
    if (findBearingSourceId && findBearingTargetId) {
      onFindBearing(findBearingSourceId, findBearingTargetId);
      setFindBearingDialogOpen(false);
      setFindBearingSourceId(null);
      setFindBearingTargetId(null);
    }
  };

  const handleOpenGpsAveraging = () => {
    gpsAveragingCancelledRef.current = false;
    setGpsReadings([]);
    setGpsAveragingDialogOpen(true);
  };

  const handleCloseGpsAveraging = () => {
    gpsAveragingCancelledRef.current = true;
    if (gpsAveragingTimeoutRef.current != null) {
      clearTimeout(gpsAveragingTimeoutRef.current);
      gpsAveragingTimeoutRef.current = null;
    }
    setGpsAveragingDialogOpen(false);
    setGpsReadings([]);
  };

  useEffect(() => {
    if (!gpsAveragingDialogOpen || !navigator.geolocation) return;
    const capture = () => {
      if (gpsAveragingCancelledRef.current) return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (gpsAveragingCancelledRef.current) return;
          const { longitude, latitude } = position.coords;
          setGpsReadings((prev) => {
            const next = [...prev, { longitude, latitude }];
            if (next.length < 10) {
              gpsAveragingTimeoutRef.current = setTimeout(capture, 5000);
            }
            return next;
          });
        },
        () => {
          if (!gpsAveragingCancelledRef.current) {
            setGeoUnavailable(true);
            setGeoSbOpen(true);
            handleCloseGpsAveraging();
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };
    capture();
    return () => {
      gpsAveragingCancelledRef.current = true;
      if (gpsAveragingTimeoutRef.current != null) {
        clearTimeout(gpsAveragingTimeoutRef.current);
        gpsAveragingTimeoutRef.current = null;
      }
    };
  }, [gpsAveragingDialogOpen]);

  useEffect(() => {
    if (gpsReadings.length !== 10) return;
    const avgLon =
      gpsReadings.reduce((s, r) => s + r.longitude, 0) / gpsReadings.length;
    const avgLat =
      gpsReadings.reduce((s, r) => s + r.latitude, 0) / gpsReadings.length;
    const formattedNotes = gpsReadings
      .map(
        (r, i) =>
          `${i + 1}. ${r.longitude}, ${r.latitude}`
      )
      .join("\n");
    onAddCoordinate({
      crsCode: formCrsCode,
      x: avgLon,
      y: avgLat,
      nameOverride: formName.trim() || undefined,
      notes: formattedNotes,
    });
    setFormName("");
    setFormX("");
    setFormY("");
    setGpsAveragingDialogOpen(false);
    setGpsReadings([]);
    onAddDialogClose();
  }, [
    gpsReadings,
    formCrsCode,
    formName,
    onAddCoordinate,
    onAddDialogClose,
  ]);

  const targetOptions =
    transformCoordinateId != null
      ? (() => {
        const coord = coordinates.find((c) => c.id === transformCoordinateId);
        const crsCode = coord?.crsCode ?? DEFAULT_CRS_CODE;
        return options.filter((o) => o.code !== crsCode);
      })()
      : [];
  const targetCrsValue = optionForCode(targetCrsCode, targetOptions);

  const labels = crsLabelsByCode[formCrsCode] ?? FALLBACK_LABELS;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {coordinates.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            py: 6,
            px: 2,
          }}
        >
          <Typography color="text.secondary" textAlign="center">
            No coordinates yet. Add one to get started.
          </Typography>
          <Button
            variant="contained"
            onClick={onAddDialogOpen}
          >
            Add
          </Button>
        </Box>
      ) : (
        <CoordinateList
          coordinates={coordinates}
          crsLabelsByCode={crsLabelsByCode}
          crsNameByCode={crsNameByCode}
          projectableCrsCodes={projectableCrsCodes}
          onTransform={handleOpenTransform}
          onProject={handleOpenProject}
          onRename={handleOpenRename}
          onAddNote={handleOpenNote}
          onFindBearing={handleOpenFindBearing}
          onDelete={onDelete}
        />
      )}

      <Dialog
        open={addDialogOpen}
        onClose={handleAddDialogClose}
      >
        <DialogTitle>Add coordinate</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
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
                if (newValue) handleFormCrsChange(newValue.code);
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
                label="Name"
                size="small"
                value={formName || nextSuggestedName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <TextField
                label={labels.first}
                type="number"
                value={formX}
                onChange={(e) => setFormX(e.target.value)}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { step: "any" } }}
              />
              <TextField
                label={labels.second}
                type="number"
                value={formY}
                onChange={(e) => setFormY(e.target.value)}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { step: "any" } }}
              />
              {isWgs84Form && (
                <>
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
                  <Tooltip
                    title={
                      geoPermissionDenied
                        ? "Location services must be enabled for this site to use this feature"
                        : "GPS averaging (10 samples)"
                    }
                  >
                    <span>
                      <IconButton
                        color="primary"
                        onClick={handleOpenGpsAveraging}
                        disabled={geoButtonDisabled}
                        aria-label="GPS averaging (10 samples)"
                        size="small"
                        sx={{ flexShrink: 0 }}
                      >
                        <GpsAveragingIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCoordinate}
            disabled={!addValid}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={gpsAveragingDialogOpen}
        onClose={handleCloseGpsAveraging}
        aria-labelledby="gps-averaging-dialog-title"
      >
        <DialogTitle id="gps-averaging-dialog-title">
          GPS Averaging
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              pt: 1,
            }}
          >
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={(gpsReadings.length / 10) * 100}
                size={56}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="caption"
                  component="span"
                  color="text.secondary"
                >
                  {`${gpsReadings.length} / 10`}
                </Typography>
              </Box>
            </Box>
            <List dense sx={{ width: "100%", maxHeight: 240, overflow: "auto" }}>
              {Array.from({ length: 10 }, (_, i) => (
                <ListItem key={i} disablePadding>
                  <ListItemText
                    primary={
                      gpsReadings[i]
                        ? `Longitude: ${gpsReadings[i].longitude}, Latitude: ${gpsReadings[i].latitude}`
                        : " "
                    }
                    primaryTypographyProps={{
                      variant: "body2",
                      color: gpsReadings[i]
                        ? "text.primary"
                        : "text.secondary",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGpsAveraging}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={transformDialogOpen}
        onClose={() => {
          setTransformDialogOpen(false);
          setTransformCoordinateId(null);
        }}
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
          <Button
            onClick={() => {
              setTransformDialogOpen(false);
              setTransformCoordinateId(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleTransformConfirm} variant="contained">
            Transform
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={projectDialogOpen}
        onClose={() => {
          setProjectDialogOpen(false);
          setProjectCoordinateId(null);
        }}
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
          <Button
            onClick={() => {
              setProjectDialogOpen(false);
              setProjectCoordinateId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProjectConfirm}
            variant="contained"
            disabled={!projectValid}
          >
            Project
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={renameDialogOpen}
        onClose={() => {
          setRenameDialogOpen(false);
          setRenameCoordinateId(null);
          setRenameValue("");
        }}
      >
        <DialogTitle>Rename coordinate</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            size="small"
            sx={{ mt: 1, minWidth: 280 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRenameDialogOpen(false);
              setRenameCoordinateId(null);
              setRenameValue("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRenameConfirm}
            variant="contained"
            disabled={!renameValue.trim()}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={noteDialogOpen}
        onClose={() => {
          setNoteDialogOpen(false);
          setNoteCoordinateId(null);
          setNoteValue("");
        }}
      >
        <DialogTitle>
          {(coordinates.find((c) => c.id === noteCoordinateId)?.notes ?? "")
            ? "Edit note"
            : "Add note"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Note"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            size="small"
            multiline
            minRows={3}
            sx={{ mt: 1, minWidth: 280 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setNoteDialogOpen(false);
              setNoteCoordinateId(null);
              setNoteValue("");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleNoteConfirm} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={findBearingDialogOpen}
        onClose={() => {
          setFindBearingDialogOpen(false);
          setFindBearingSourceId(null);
          setFindBearingTargetId(null);
        }}
      >
        <DialogTitle>Find bearing</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Select a coordinate (same CRS) to compute bearing and distance from
            the current point:
          </Typography>
          {(() => {
            const source = coordinates.find((c) => c.id === findBearingSourceId);
            const sourceCrsCode = source?.crsCode ?? "";
            const sameCrsCoords = coordinates.filter(
              (c) => c.id !== findBearingSourceId && c.crsCode === sourceCrsCode
            );
            if (sameCrsCoords.length === 0) {
              return (
                <Typography variant="body2" color="text.secondary">
                  No other coordinates with the same CRS.
                </Typography>
              );
            }
            return (
              <List dense sx={{ minWidth: 280, maxHeight: 240, overflow: "auto" }}>
                {sameCrsCoords.map((coord) => (
                  <ListItemButton
                    key={coord.id}
                    selected={findBearingTargetId === coord.id}
                    onClick={() => setFindBearingTargetId(coord.id)}
                  >
                    {coord.name}
                  </ListItemButton>
                ))}
              </List>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFindBearingDialogOpen(false);
              setFindBearingSourceId(null);
              setFindBearingTargetId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFindBearingConfirm}
            variant="contained"
            disabled={!findBearingTargetId}
          >
            Add to notes
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
