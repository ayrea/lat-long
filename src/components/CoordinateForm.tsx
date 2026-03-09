import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
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
import { AddCoordinateDialog } from "./AddCoordinateDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { CoordinateList } from "./CoordinateList";
import { FindBearingDialog } from "./FindBearingDialog";
import { GpsAveragingDialog } from "./GpsAveragingDialog";
import { NoteDialog } from "./NoteDialog";
import { ProjectDialog } from "./ProjectDialog";
import { RenameCoordinateDialog } from "./RenameCoordinateDialog";
import { TransformCrsDialog } from "./TransformCrsDialog";
import type { Coordinate } from "../types";
import { getCurrentPosition, isGeolocationAvailable } from "../geolocation";

const FALLBACK_LABELS = { first: "X", second: "Y" } as const;

export type AxisLabels = { first: string; second: string };

type ActiveDialog =
  | { type: "transform"; coordinateId: string }
  | { type: "project"; coordinateId: string }
  | { type: "rename"; coordinateId: string }
  | { type: "note"; coordinateId: string }
  | { type: "findBearing"; coordinateId: string }
  | { type: "delete"; coordinateId: string }
  | { type: "gpsAveraging" };

interface CoordinateFormProps {
  coordinates: Coordinate[];
  /** Current project ID (for photo attachments on cards). */
  projectId: string;
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
  warmupSeconds: number;
  averagingDurationSeconds: number;
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
  projectId,
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
  warmupSeconds,
  averagingDurationSeconds,
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
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);

  const [formCrsCode, setFormCrsCode] = useState(
    () => getStoredDefaultCrs() || DEFAULT_CRS_CODE
  );
  const [formName, setFormName] = useState("");
  const [formX, setFormX] = useState("");
  const [formY, setFormY] = useState("");

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoUnavailable, setGeoUnavailable] = useState(false);
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);
  const [geoSbOpen, setGeoSbOpen] = useState(false);

  const isWgs84Form = formCrsCode === DEFAULT_CRS_CODE;
  const geoAvailable = isGeolocationAvailable();
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
    if (!isGeolocationAvailable() || geoButtonDisabled) return;
    setGeoLoading(true);
    getCurrentPosition(
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
    setActiveDialog({ type: "transform", coordinateId: id });
  };

  const handleOpenProject = (id: string) => {
    setActiveDialog({ type: "project", coordinateId: id });
  };

  const handleOpenRename = (id: string) => {
    setActiveDialog({ type: "rename", coordinateId: id });
  };

  const handleOpenNote = (id: string) => {
    setActiveDialog({ type: "note", coordinateId: id });
  };

  const handleOpenFindBearing = (id: string) => {
    setActiveDialog({ type: "findBearing", coordinateId: id });
  };

  const handleDeleteRequest = (id: string) => {
    setActiveDialog({ type: "delete", coordinateId: id });
  };

  const handleDeleteConfirm = () => {
    if (activeDialog?.type === "delete") {
      onDelete(activeDialog.coordinateId);
    }
    setActiveDialog(null);
  };

  const handleDeleteCancel = () => {
    setActiveDialog(null);
  };

  const handleGpsAveragingComplete = (payload: {
    longitude: number;
    latitude: number;
    notes: string;
  }) => {
    onAddCoordinate({
      crsCode: formCrsCode,
      x: payload.longitude,
      y: payload.latitude,
      nameOverride: formName.trim() || undefined,
      notes: payload.notes,
    });
    setFormName("");
    setFormX("");
    setFormY("");
    setActiveDialog(null);
    onAddDialogClose();
  };

  const labels = crsLabelsByCode[formCrsCode] ?? FALLBACK_LABELS;

  const activeTransformCoordinateId =
    activeDialog?.type === "transform" ? activeDialog.coordinateId : null;
  const activeProjectCoordinateId =
    activeDialog?.type === "project" ? activeDialog.coordinateId : null;
  const activeRenameCoordinateId =
    activeDialog?.type === "rename" ? activeDialog.coordinateId : null;
  const activeNoteCoordinateId =
    activeDialog?.type === "note" ? activeDialog.coordinateId : null;
  const activeFindBearingSourceId =
    activeDialog?.type === "findBearing" ? activeDialog.coordinateId : null;
  const noteCoordinate =
    activeNoteCoordinateId != null
      ? coordinates.find((c) => c.id === activeNoteCoordinateId)
      : undefined;

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
          projectId={projectId}
          crsLabelsByCode={crsLabelsByCode}
          crsNameByCode={crsNameByCode}
          projectableCrsCodes={projectableCrsCodes}
          onTransform={handleOpenTransform}
          onProject={handleOpenProject}
          onRename={handleOpenRename}
          onAddNote={handleOpenNote}
          onFindBearing={handleOpenFindBearing}
          onDelete={handleDeleteRequest}
        />
      )}

      <AddCoordinateDialog
        open={addDialogOpen}
        onClose={handleAddDialogClose}
        nextSuggestedName={nextSuggestedName}
        formCrsValue={formCrsValue}
        formName={formName}
        formX={formX}
        formY={formY}
        options={options}
        crsLoading={crsLoading}
        loadCrsOptions={loadCrsOptions}
        onFormCrsChange={handleFormCrsChange}
        onFormNameChange={setFormName}
        onFormXChange={setFormX}
        onFormYChange={setFormY}
        labels={labels}
        addValid={addValid}
        onAddCoordinate={handleAddCoordinate}
        isWgs84Form={isWgs84Form}
        geoButtonDisabled={geoButtonDisabled}
        geoPermissionDenied={geoPermissionDenied}
        onUseCurrentPosition={handleUseCurrentPosition}
        geoLoading={geoLoading}
        onOpenGpsAveraging={() => setActiveDialog({ type: "gpsAveraging" })}
      />

      <GpsAveragingDialog
        open={activeDialog?.type === "gpsAveraging"}
        onClose={() => setActiveDialog(null)}
        onComplete={handleGpsAveragingComplete}
        onError={() => {
          setGeoUnavailable(true);
          setGeoSbOpen(true);
        }}
        warmupSeconds={warmupSeconds}
        averagingDurationSeconds={averagingDurationSeconds}
      />

      <TransformCrsDialog
        open={activeDialog?.type === "transform"}
        onClose={() => {
          setActiveDialog(null);
        }}
        coordinateId={activeTransformCoordinateId}
        coordinates={coordinates}
        options={options}
        crsLoading={crsLoading}
        loadCrsOptions={loadCrsOptions}
        onTransform={onTransform}
      />

      <ProjectDialog
        open={activeDialog?.type === "project"}
        onClose={() => {
          setActiveDialog(null);
        }}
        coordinateId={activeProjectCoordinateId}
        onProject={onProject}
      />

      <RenameCoordinateDialog
        open={activeDialog?.type === "rename"}
        onClose={() => {
          setActiveDialog(null);
        }}
        coordinateId={activeRenameCoordinateId}
        initialName={
          coordinates.find((c) => c.id === activeRenameCoordinateId)?.name ?? ""
        }
        onRename={onRename}
      />

      <NoteDialog
        open={activeDialog?.type === "note"}
        onClose={() => {
          setActiveDialog(null);
        }}
        entityId={activeNoteCoordinateId}
        initialNote={noteCoordinate?.notes ?? ""}
        title={
          noteCoordinate?.notes
            ? "Edit note"
            : "Add note"
        }
        onSave={onUpdateNote}
      />

      <FindBearingDialog
        open={activeDialog?.type === "findBearing"}
        onClose={() => {
          setActiveDialog(null);
        }}
        sourceCoordinateId={activeFindBearingSourceId}
        coordinates={coordinates}
        onConfirm={onFindBearing}
      />

      <ConfirmationDialog
        open={activeDialog?.type === "delete"}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete coordinate"
        contentText="Are you sure you want to delete this coordinate? This cannot be undone."
        confirmButtonText="Delete"
      />

      <Snackbar
        open={geoSbOpen}
        autoHideDuration={6000}
        onClose={() => setGeoSbOpen(false)}
        message="Could not get location"
      />
    </Box>
  );
}
