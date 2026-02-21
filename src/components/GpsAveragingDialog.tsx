import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentPosition, isGeolocationAvailable } from "../geolocation";
import { GpsAverageCoordinates } from "./GpsAverageCoordinates";

const GPS_AVERAGING_READING_COUNT = 10;
const EXTRA_CAPTURE_COUNT = 5;

export interface GpsAveragingResult {
  longitude: number;
  latitude: number;
  notes: string;
}

interface GpsAveragingDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (payload: GpsAveragingResult) => void;
  onError?: () => void;
}

export function GpsAveragingDialog({
  open,
  onClose,
  onComplete,
  onError,
}: GpsAveragingDialogProps) {
  const [readings, setReadings] = useState<
    { longitude: number; latitude: number }[]
  >([]);
  const [targetReadingCount, setTargetReadingCount] = useState(
    GPS_AVERAGING_READING_COUNT
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCapturingExtra, setIsCapturingExtra] = useState(false);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readingsCountRef = useRef(0);

  const average = useMemo(() => {
    if (readings.length === 0) return null;
    const avgLon =
      readings.reduce((s, r) => s + r.longitude, 0) / readings.length;
    const avgLat =
      readings.reduce((s, r) => s + r.latitude, 0) / readings.length;
    return { longitude: avgLon, latitude: avgLat };
  }, [readings]);

  const handleClose = () => {
    cancelledRef.current = true;
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (extraTimeoutRef.current != null) {
      clearTimeout(extraTimeoutRef.current);
      extraTimeoutRef.current = null;
    }
    setReadings([]);
    setSelectedIndex(null);
    setIsCapturingExtra(false);
    onClose();
  };

  const handleDone = () => {
    if (readings.length === 0 || average == null) return;
    const notes =
      "GPS Averaging:\n" +
      readings.map((r) => `${r.longitude}, ${r.latitude}`).join("\n");
    onComplete({ longitude: average.longitude, latitude: average.latitude, notes });
    cancelledRef.current = true;
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setReadings([]);
    setSelectedIndex(null);
    onClose();
  };

  const handleRemoveSelected = () => {
    if (selectedIndex === null) return;
    setReadings((prev) => prev.filter((_, i) => i !== selectedIndex));
    setTargetReadingCount((prev) => prev - 1);
    setSelectedIndex(null);
  };

  const handleAddFive = () => {
    if (readings.length < targetReadingCount || isCapturingExtra)
      return;
    setTargetReadingCount((prev) => prev + EXTRA_CAPTURE_COUNT);
    setIsCapturingExtra(true);
    let count = 0;
    const captureNext = () => {
      getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setReadings((prev) => [...prev, { longitude, latitude }]);
          count += 1;
          if (count < EXTRA_CAPTURE_COUNT) {
            extraTimeoutRef.current = setTimeout(captureNext, 2000);
          } else {
            if (extraTimeoutRef.current != null) {
              clearTimeout(extraTimeoutRef.current);
              extraTimeoutRef.current = null;
            }
            setIsCapturingExtra(false);
          }
        },
        () => {
          if (extraTimeoutRef.current != null) {
            clearTimeout(extraTimeoutRef.current);
            extraTimeoutRef.current = null;
          }
          onError?.();
          setIsCapturingExtra(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };
    captureNext();
  };

  useEffect(() => {
    if (!open || !isGeolocationAvailable()) return;
    cancelledRef.current = false;
    readingsCountRef.current = 0;
    setReadings([]);
    setTargetReadingCount(GPS_AVERAGING_READING_COUNT);

    const capture = () => {
      if (cancelledRef.current) return;
      getCurrentPosition(
        (position) => {
          if (cancelledRef.current) return;
          const { longitude, latitude } = position.coords;
          setReadings((prev) => [...prev, { longitude, latitude }]);
          readingsCountRef.current += 1;
          if (
            readingsCountRef.current < GPS_AVERAGING_READING_COUNT &&
            !cancelledRef.current
          ) {
            timeoutRef.current = setTimeout(capture, 2000);
          }
        },
        () => {
          if (!cancelledRef.current) {
            onError?.();
            handleClose();
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };
    capture();

    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [open]);

  const actionsDisabled =
    readings.length < targetReadingCount || isCapturingExtra;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
              value={Math.min(
                100,
                (readings.length / targetReadingCount) * 100
              )}
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
                {`${readings.length} / ${targetReadingCount}`}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Last:{" "}
            {readings.length > 0
              ? `${readings[readings.length - 1].longitude}, ${readings[readings.length - 1].latitude}`
              : "Waiting for first reading..."}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg:{" "}
            {average != null
              ? `${average.longitude}, ${average.latitude}`
              : "—"}
          </Typography>
          <Box border={1} borderColor="divider" borderRadius={1}>
            <GpsAverageCoordinates
              readings={readings}
              width={320}
              height={200}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              average={average}
            />
          </Box>
          <Button
            size="small"
            color="primary"
            onClick={handleRemoveSelected}
            disabled={selectedIndex === null}
          >
            Remove selected
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleAddFive}
          disabled={actionsDisabled}
        >
          +5
        </Button>
        <Button
          variant="contained"
          onClick={handleDone}
          disabled={actionsDisabled}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
