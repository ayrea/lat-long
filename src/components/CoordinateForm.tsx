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
import { CoordinateList } from "./CoordinateList";
import { FindBearingDialog } from "./FindBearingDialog";
import { GpsAveragingDialog } from "./GpsAveragingDialog";
import { NoteDialog } from "./NoteDialog";
import { ProjectDialog } from "./ProjectDialog";
import { RenameCoordinateDialog } from "./RenameCoordinateDialog";
import { TransformCrsDialog } from "./TransformCrsDialog";
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

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectCoordinateId, setProjectCoordinateId] = useState<
    string | null
  >(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameCoordinateId, setRenameCoordinateId] = useState<string | null>(
    null
  );

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteCoordinateId, setNoteCoordinateId] = useState<string | null>(null);

  const [findBearingDialogOpen, setFindBearingDialogOpen] = useState(false);
  const [findBearingSourceId, setFindBearingSourceId] = useState<string | null>(
    null
  );

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoUnavailable, setGeoUnavailable] = useState(false);
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);
  const [geoSbOpen, setGeoSbOpen] = useState(false);

  const [gpsAveragingDialogOpen, setGpsAveragingDialogOpen] = useState(false);

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
    setTransformDialogOpen(true);
  };

  const handleOpenProject = (id: string) => {
    setProjectCoordinateId(id);
    setProjectDialogOpen(true);
  };

  const handleOpenRename = (id: string) => {
    setRenameCoordinateId(id);
    setRenameDialogOpen(true);
  };

  const handleOpenNote = (id: string) => {
    setNoteCoordinateId(id);
    setNoteDialogOpen(true);
  };

  const handleOpenFindBearing = (id: string) => {
    setFindBearingSourceId(id);
    setFindBearingDialogOpen(true);
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
    setGpsAveragingDialogOpen(false);
    onAddDialogClose();
  };

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
        onOpenGpsAveraging={() => setGpsAveragingDialogOpen(true)}
      />

      <GpsAveragingDialog
        open={gpsAveragingDialogOpen}
        onClose={() => setGpsAveragingDialogOpen(false)}
        onComplete={handleGpsAveragingComplete}
        onError={() => {
          setGeoUnavailable(true);
          setGeoSbOpen(true);
        }}
      />

      <TransformCrsDialog
        open={transformDialogOpen}
        onClose={() => {
          setTransformDialogOpen(false);
          setTransformCoordinateId(null);
        }}
        coordinateId={transformCoordinateId}
        coordinates={coordinates}
        options={options}
        crsLoading={crsLoading}
        loadCrsOptions={loadCrsOptions}
        onTransform={onTransform}
      />

      <ProjectDialog
        open={projectDialogOpen}
        onClose={() => {
          setProjectDialogOpen(false);
          setProjectCoordinateId(null);
        }}
        coordinateId={projectCoordinateId}
        onProject={onProject}
      />

      <RenameCoordinateDialog
        open={renameDialogOpen}
        onClose={() => {
          setRenameDialogOpen(false);
          setRenameCoordinateId(null);
        }}
        coordinateId={renameCoordinateId}
        initialName={
          coordinates.find((c) => c.id === renameCoordinateId)?.name ?? ""
        }
        onRename={onRename}
      />

      <NoteDialog
        open={noteDialogOpen}
        onClose={() => {
          setNoteDialogOpen(false);
          setNoteCoordinateId(null);
        }}
        coordinateId={noteCoordinateId}
        initialNote={
          coordinates.find((c) => c.id === noteCoordinateId)?.notes ?? ""
        }
        title={
          (coordinates.find((c) => c.id === noteCoordinateId)?.notes ?? "")
            ? "Edit note"
            : "Add note"
        }
        onSave={onUpdateNote}
      />

      <FindBearingDialog
        open={findBearingDialogOpen}
        onClose={() => {
          setFindBearingDialogOpen(false);
          setFindBearingSourceId(null);
        }}
        sourceCoordinateId={findBearingSourceId}
        coordinates={coordinates}
        onConfirm={onFindBearing}
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
