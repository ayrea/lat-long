import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

const PADDING = 12;
const CROSS_HALF = 4;

export interface GpsReading {
  longitude: number;
  latitude: number;
}

interface GpsAverageCoordinatesProps {
  readings: GpsReading[];
  width: number;
  height: number;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  average?: GpsReading | null;
}

function getBounds(
  readings: GpsReading[],
  average?: GpsReading | null
) {
  const hasReadings = readings.length > 0;
  const hasAverage = average != null;
  if (!hasReadings && !hasAverage) {
    return { minLon: 0, maxLon: 1, minLat: 0, maxLat: 1 };
  }
  const lons = readings.map((r) => r.longitude);
  const lats = readings.map((r) => r.latitude);
  if (hasAverage) {
    lons.push(average.longitude);
    lats.push(average.latitude);
  }
  let minLon = Math.min(...lons);
  let maxLon = Math.max(...lons);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  if (maxLon === minLon) {
    minLon -= 0.0001;
    maxLon += 0.0001;
  }
  if (maxLat === minLat) {
    minLat -= 0.0001;
    maxLat += 0.0001;
  }
  return { minLon, maxLon, minLat, maxLat };
}

function toSvg(
  r: GpsReading,
  bounds: ReturnType<typeof getBounds>,
  width: number,
  height: number
) {
  const rangeLon = bounds.maxLon - bounds.minLon;
  const rangeLat = bounds.maxLat - bounds.minLat;
  const x =
    PADDING +
    (rangeLon ? (r.longitude - bounds.minLon) / rangeLon : 0) *
      (width - 2 * PADDING);
  const y =
    PADDING +
    (rangeLat ? (bounds.maxLat - r.latitude) / rangeLat : 0) *
      (height - 2 * PADDING);
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
  const bounds = getBounds(readings, average);

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

  return (
    <svg
      width={width}
      height={height}
      style={{ cursor: "default" }}
      aria-label="GPS readings plot"
    >
      {readings.map((r, i) => {
        const { x, y } = toSvg(r, bounds, width, height);
        const selected = selectedIndex === i;
        const stroke = selected
          ? theme.palette.primary.main
          : theme.palette.text.secondary;
        const hit = 10;
        return (
          <g
            key={i}
            onClick={() => onSelect(selected ? null : i)}
            style={{ cursor: "pointer" }}
            aria-label={selected ? `Reading ${i + 1} selected` : `Reading ${i + 1}`}
          >
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
      {average != null && (() => {
        const { x, y } = toSvg(average, bounds, width, height);
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
