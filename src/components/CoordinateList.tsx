import Box from "@mui/material/Box";
import { useEffect, useRef } from "react";
import type { Coordinate } from "../types";
import type { AxisLabels } from "./CoordinateForm";
import { CoordinateItemCard } from "./CoordinateItemCard";

const FALLBACK_LABELS: AxisLabels = { first: "X", second: "Y" };

interface CoordinateListProps {
  coordinates: Coordinate[];
  crsLabelsByCode?: Record<string, AxisLabels>;
  /** CRS display name by code (e.g. "WGS 84" for 4326). */
  crsNameByCode?: Record<string, string>;
  /** Set of CRS codes that are projected (Project action allowed). */
  projectableCrsCodes: Set<string>;
  onTransform: (id: string) => void;
  onProject: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

function getLabels(
  code: string,
  crsLabelsByCode?: Record<string, AxisLabels>
): AxisLabels {
  if (crsLabelsByCode && crsLabelsByCode[code]) return crsLabelsByCode[code];
  return FALLBACK_LABELS;
}

export function CoordinateList({
  coordinates,
  crsLabelsByCode,
  crsNameByCode,
  projectableCrsCodes,
  onTransform,
  onProject,
  onRename,
  onDelete,
}: CoordinateListProps) {
  const lastCardRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (coordinates.length > prevLengthRef.current) {
      lastCardRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = coordinates.length;
  }, [coordinates.length]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "auto",
        flex: 1,
        minHeight: 0,
        py: 2,
      }}
    >
      {coordinates.map((coord, i) => (
        <Box
          key={coord.id}
          ref={i === coordinates.length - 1 ? lastCardRef : undefined}
        >
          <CoordinateItemCard
            coordinate={coord}
            axisLabels={getLabels(coord.crsCode, crsLabelsByCode)}
            crsName={crsNameByCode?.[coord.crsCode]}
            canProject={projectableCrsCodes.has(coord.crsCode)}
            onTransform={onTransform}
            onProject={onProject}
            onRename={onRename}
            onDelete={onDelete}
          />
        </Box>
      ))}
    </Box>
  );
}
