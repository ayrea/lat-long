import { useCallback, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type CoordinateRecord } from "../db";
import { loadCrs, setStoredDefaultCrs } from "../crs";
import { transformCoordinate } from "../transform";
import {
  bearingDistanceBetween,
  projectFromBearingDistance,
} from "../project";
import type { Coordinate } from "../types";
import {
  deriveUniqueName,
  generateId,
  getNextNumericName,
} from "../utils/naming";

export interface UseCoordinatesResult {
  coordinates: CoordinateRecord[];
  nextSuggestedName: string;
  addCoordinate: (payload: {
    crsCode: string;
    x: number;
    y: number;
    nameOverride?: string;
    notes?: string;
  }) => Promise<void>;
  transformCoordinateById: (
    coordinateId: string,
    targetCrsCode: string,
  ) => Promise<void>;
  projectFromCoordinate: (
    coordinateId: string,
    bearing: number,
    distance: number,
  ) => Promise<void>;
  renameCoordinate: (coordinateId: string, newName: string) => void;
  deleteCoordinate: (coordinateId: string) => void;
  updateCoordinateNote: (coordinateId: string, notes: string) => void;
  findBearingBetweenCoordinates: (
    sourceCoordinateId: string,
    targetCoordinateId: string,
  ) => void;
  error: string | null;
  clearError: () => void;
}

export function useCoordinates(
  selectedProjectId: string | null,
): UseCoordinatesResult {
  const coordinates =
    useLiveQuery(
      () =>
        selectedProjectId != null
          ? db.coordinates
              .where("projectId")
              .equals(selectedProjectId)
              .sortBy("sortOrder")
          : Promise.resolve([] as CoordinateRecord[]),
      [selectedProjectId],
      [] as CoordinateRecord[],
    ) ?? [];

  const [error, setError] = useState<string | null>(null);

  const getCoordinateById = useCallback(
    (coordinateId: string) => coordinates.find((c) => c.id === coordinateId),
    [coordinates],
  );

  const nextSuggestedName = useMemo(
    () => getNextNumericName(coordinates as Coordinate[]),
    [coordinates],
  );

  const addCoordinate: UseCoordinatesResult["addCoordinate"] = useCallback(
    async (payload) => {
      if (selectedProjectId == null) return;
      const existing = new Set(coordinates.map((c) => c.name));
      const name =
        payload.nameOverride !== undefined
          ? deriveUniqueName(existing, payload.nameOverride)
          : getNextNumericName(coordinates as Coordinate[]);
      setStoredDefaultCrs(payload.crsCode);
      await db.coordinates.add({
        id: generateId(),
        name,
        crsCode: payload.crsCode,
        x: payload.x,
        y: payload.y,
        cardType: "manual",
        ...(payload.notes != null && payload.notes !== ""
          ? { notes: payload.notes }
          : {}),
        sortOrder: Date.now(),
        projectId: selectedProjectId,
      });
    },
    [coordinates, selectedProjectId],
  );

  const transformCoordinateById: UseCoordinatesResult["transformCoordinateById"] =
    useCallback(
      async (coordinateId, targetCrsCode) => {
        setError(null);
        const source = getCoordinateById(coordinateId);
        if (!source || selectedProjectId == null) return;
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
            source.y,
          );
          const existing = new Set(coordinates.map((c) => c.name));
          const newName = deriveUniqueName(
            existing,
            `${source.name}_Transform`,
          );
          await db.coordinates.add({
            id: generateId(),
            name: newName,
            crsCode: targetCrsCode,
            x: outX,
            y: outY,
            cardType: "transform",
            sortOrder: Date.now(),
            projectId: selectedProjectId,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Transform failed.");
        }
      },
      [coordinates, selectedProjectId, getCoordinateById],
    );

  const projectFromCoordinate: UseCoordinatesResult["projectFromCoordinate"] =
    useCallback(
      async (coordinateId, bearing, distance) => {
        setError(null);
        const source = getCoordinateById(coordinateId);
        if (!source || selectedProjectId == null) return;
        try {
          const { easting, northing } = projectFromBearingDistance(
            source.x,
            source.y,
            bearing,
            distance,
          );
          const existing = new Set(coordinates.map((c) => c.name));
          const newName = deriveUniqueName(
            existing,
            `${source.name}_Project`,
          );
          await db.coordinates.add({
            id: generateId(),
            name: newName,
            crsCode: source.crsCode,
            x: easting,
            y: northing,
            cardType: "project",
            notes: `Projected from ${source.name}: bearing ${bearing.toFixed(
              1,
            )}°, distance ${distance.toFixed(2)} units`,
            sortOrder: Date.now(),
            projectId: selectedProjectId,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Project failed.");
        }
      },
      [coordinates, selectedProjectId, getCoordinateById],
    );

  const renameCoordinate: UseCoordinatesResult["renameCoordinate"] =
    useCallback(
      (coordinateId, newName) => {
        const unique = deriveUniqueName(
          new Set(
            coordinates.map((c) => (c.id === coordinateId ? "" : c.name)),
          ),
          newName.trim(),
        );
        void db.coordinates.update(coordinateId, { name: unique });
      },
      [coordinates],
    );

  const deleteCoordinate: UseCoordinatesResult["deleteCoordinate"] =
    useCallback((coordinateId) => {
      void db.photos.where("coordinateId").equals(coordinateId).delete();
      void db.coordinates.delete(coordinateId);
    }, []);

  const updateCoordinateNote: UseCoordinatesResult["updateCoordinateNote"] =
    useCallback((coordinateId, notes) => {
      void db.coordinates.update(coordinateId, { notes });
    }, []);

  const findBearingBetweenCoordinates: UseCoordinatesResult["findBearingBetweenCoordinates"] =
    useCallback(
      (sourceCoordinateId, targetCoordinateId) => {
        setError(null);
        const source = getCoordinateById(sourceCoordinateId);
        const target = getCoordinateById(targetCoordinateId);
        if (!source || !target) return;
        try {
          const { bearingDeg, distance } = bearingDistanceBetween(
            source.x,
            source.y,
            target.x,
            target.y,
          );
          const line = `Bearing to ${target.name}: ${bearingDeg.toFixed(
            1,
          )}°, distance: ${distance.toFixed(2)} units`;
          const existing = (source.notes ?? "").trim();
          const newNotes = existing ? `${existing}\n${line}` : line;
          void db.coordinates.update(sourceCoordinateId, { notes: newNotes });
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Find bearing failed.",
          );
        }
      },
      [coordinates, getCoordinateById],
    );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    coordinates,
    nextSuggestedName,
    addCoordinate,
    transformCoordinateById,
    projectFromCoordinate,
    renameCoordinate,
    deleteCoordinate,
    updateCoordinateNote,
    findBearingBetweenCoordinates,
    error,
    clearError,
  };
}

