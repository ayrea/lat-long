import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { transformCoordinate } from "../transform";
import {
  getUtmProj4String,
  getUtmZone,
  WGS84_PROJ4,
} from "../utm";

const PADDING = 12;
const CROSS_HALF = 4;
const DEGENERATE_RANGE_M = 1;

export interface GpsReading {
  longitude: number;
  latitude: number;
  accuracy: number;
}

interface GpsAverageCoordinatesProps {
  readings: GpsReading[];
  width: number;
  height: number;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  average?: { longitude: number; latitude: number } | null;
}

function latLonToUtm(
  lon: number,
  lat: number,
  utmProj4: string
): { easting: number; northing: number } {
  const [easting, northing] = transformCoordinate(
    WGS84_PROJ4,
    utmProj4,
    lon,
    lat
  );
  return { easting, northing };
}

interface UtmBounds {
  minE: number;
  maxE: number;
  minN: number;
  maxN: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  utmProj4: string;
}

function getUtmBounds(
  readings: GpsReading[],
  average: { longitude: number; latitude: number } | null | undefined,
  width: number,
  height: number
): UtmBounds | null {
  if (readings.length === 0) return null;
  const zone = getUtmZone(readings[0].longitude);
  const south = readings[0].latitude < 0;
  const utmProj4 = getUtmProj4String(zone, south);

  const points: { easting: number; northing: number }[] = readings.map((r) =>
    latLonToUtm(r.longitude, r.latitude, utmProj4)
  );
  if (average != null) {
    points.push(latLonToUtm(average.longitude, average.latitude, utmProj4));
  }

  let minE = Math.min(...points.map((p) => p.easting));
  let maxE = Math.max(...points.map((p) => p.easting));
  let minN = Math.min(...points.map((p) => p.northing));
  let maxN = Math.max(...points.map((p) => p.northing));
  if (maxE === minE) {
    minE -= DEGENERATE_RANGE_M / 2;
    maxE += DEGENERATE_RANGE_M / 2;
  }
  if (maxN === minN) {
    minN -= DEGENERATE_RANGE_M / 2;
    maxN += DEGENERATE_RANGE_M / 2;
  }

  const rangeE = maxE - minE;
  const rangeN = maxN - minN;
  const plotWidth = width - 2 * PADDING;
  const plotHeight = height - 2 * PADDING;
  const scale = Math.min(plotWidth / rangeE, plotHeight / rangeN);
  const offsetX = (plotWidth - rangeE * scale) / 2;
  const offsetY = (plotHeight - rangeN * scale) / 2;

  return {
    minE,
    maxE,
    minN,
    maxN,
    scale,
    offsetX,
    offsetY,
    utmProj4,
  };
}

function toSvg(
  easting: number,
  northing: number,
  bounds: UtmBounds
): { x: number; y: number } {
  const x = PADDING + bounds.offsetX + (easting - bounds.minE) * bounds.scale;
  const y =
    PADDING + bounds.offsetY + (bounds.maxN - northing) * bounds.scale;
  return { x, y };
}

export function GpsAverageCoordinates({
  readings,
  width,
  height,
  selectedIndex,
  onSelect,
  average,
}: GpsAverageCoordinatesProps) {
  const theme = useTheme();
  const bounds = getUtmBounds(readings, average, width, height);

  if (readings.length === 0) {
    return (
      <Box
        sx={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Box component="span" sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          No readings
        </Box>
      </Box>
    );
  }

  if (bounds == null) {
    return null;
  }

  const circleFill = theme.palette.primary.main;

  return (
    <svg
      width={width}
      height={height}
      style={{ cursor: "default" }}
      aria-label="GPS readings plot"
    >
      {readings.map((r, i) => {
        const { easting, northing } = latLonToUtm(
          r.longitude,
          r.latitude,
          bounds.utmProj4
        );
        const { x, y } = toSvg(easting, northing, bounds);
        const selected = selectedIndex === i;
        const stroke = selected
          ? theme.palette.primary.main
          : theme.palette.text.secondary;
        const hit = 10;
        const radiusM = 0.1 * r.accuracy;
        const radiusSvg = radiusM * bounds.scale;
        return (
          <g
            key={i}
            onClick={() => onSelect(selected ? null : i)}
            style={{ cursor: "pointer" }}
            aria-label={selected ? `Reading ${i + 1} selected` : `Reading ${i + 1}`}
          >
            <circle
              cx={x}
              cy={y}
              r={radiusSvg}
              fill={circleFill}
              fillOpacity={0.1}
            />
            <rect
              x={x - hit}
              y={y - hit}
              width={hit * 2}
              height={hit * 2}
              fill="transparent"
            />
            <line
              x1={x - CROSS_HALF}
              y1={y}
              x2={x + CROSS_HALF}
              y2={y}
              stroke={stroke}
              strokeWidth={1.5}
            />
            <line
              x1={x}
              y1={y - CROSS_HALF}
              x2={x}
              y2={y + CROSS_HALF}
              stroke={stroke}
              strokeWidth={1.5}
            />
          </g>
        );
      })}
      {average != null &&
        (() => {
          const { easting, northing } = latLonToUtm(
            average.longitude,
            average.latitude,
            bounds.utmProj4
          );
          const { x, y } = toSvg(easting, northing, bounds);
          const stroke = theme.palette.warning.main;
          return (
            <g key="average" aria-label="Average position">
              <line
                x1={x - CROSS_HALF}
                y1={y}
                x2={x + CROSS_HALF}
                y2={y}
                stroke={stroke}
                strokeWidth={1.5}
              />
              <line
                x1={x}
                y1={y - CROSS_HALF}
                x2={x}
                y2={y + CROSS_HALF}
                stroke={stroke}
                strokeWidth={1.5}
              />
            </g>
          );
        })()}
    </svg>
  );
}
