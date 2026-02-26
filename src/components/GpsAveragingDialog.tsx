import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import {
  getAccuratePosition,
  isGeolocationAvailable,
  type AccuratePositionProgress,
  type AccuratePositionResult,
} from "../geolocation";
import { GpsAverageCoordinates } from "./GpsAverageCoordinates";

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
  warmupSeconds?: number;
  averagingDurationSeconds?: number;
}

export function GpsAveragingDialog({
  open,
  onClose,
  onComplete,
  onError,
  warmupSeconds = 30,
  averagingDurationSeconds = 60,
}: GpsAveragingDialogProps) {
  const warmupMs = warmupSeconds * 1000;
  const collectionMs = averagingDurationSeconds * 1000;
  const totalMs = warmupMs + collectionMs;
  const [progress, setProgress] = useState<AccuratePositionProgress | null>(
    null
  );
  const [result, setResult] = useState<AccuratePositionResult | null>(null);
  const [readings, setReadings] = useState<
    { longitude: number; latitude: number; accuracy: number }[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const currentAverage =
    progress?.currentAverage ??
    (result != null ? { latitude: result.latitude, longitude: result.longitude } : null);

  const handleClose = () => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setProgress(null);
    setResult(null);
    setReadings([]);
    setSelectedIndex(null);
    onClose();
  };

  const handleDone = () => {
    if (result == null) return;
    const durationSec = Math.round(result.durationMs / 1000);
    const notes =
      `Accurate GPS: ${result.samplesUsed} samples over ${durationSec}s, weighted by 1/accuracy². Discarded: ${result.samplesDiscarded}.`;
    onComplete({
      longitude: result.longitude,
      latitude: result.latitude,
      notes,
    });
    handleClose();
  };

  useEffect(() => {
    if (!open || !isGeolocationAvailable()) return;
    setProgress({
      phase: "warmup",
      warmupRemainingMs: warmupMs,
      samplesAccepted: 0,
      samplesDiscarded: 0,
      latestAccuracy: null,
      currentAverage: null,
    });
    setResult(null);
    setReadings([]);

    cancelRef.current = getAccuratePosition({
      onProgress: setProgress,
      onSampleAccepted: (reading) => {
        setReadings((prev) => [...prev, reading]);
      },
      onSuccess: (res) => {
        setResult(res);
        setProgress(null);
      },
      onError: () => {
        onError?.();
        handleClose();
      },
      warmupMs,
      collectionMs,
    });

    return () => {
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
    };
  }, [open, warmupMs, collectionMs]);

  const progressPercent =
    progress != null
      ? progress.phase === "warmup"
        ? (1 - (progress.warmupRemainingMs ?? 0) / warmupMs) *
          (warmupMs / totalMs) *
          100
        : (warmupMs / totalMs) * 100 +
          ((progress.collectingElapsedMs ?? 0) / collectionMs) *
            (collectionMs / totalMs) *
            100
      : 100;

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
          <Box sx={{ width: "100%", maxWidth: 320 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, progressPercent)}
              sx={{ height: 8, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {progress?.phase === "warmup"
                ? `Warming up… ${Math.ceil((progress.warmupRemainingMs ?? 0) / 1000)} s remaining`
                : progress?.phase === "collecting"
                  ? `Collecting… ${Math.floor((progress.collectingElapsedMs ?? 0) / 1000)} s / ${averagingDurationSeconds} s`
                  : result != null
                    ? "Complete"
                    : "Starting…"}
            </Typography>
          </Box>

          {progress != null && (
            <>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Accepted: {progress.samplesAccepted}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Discarded: {progress.samplesDiscarded}
                </Typography>
                {progress.latestAccuracy != null && (
                  <Typography variant="body2" color="text.secondary">
                    Current accuracy: {progress.latestAccuracy.toFixed(1)} m
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Only samples with accuracy ≤ 10 m are used.
              </Typography>
            </>
          )}

          <Typography variant="body2" color="text.secondary">
            Weighted average:{" "}
            {currentAverage != null
              ? `${currentAverage.longitude}, ${currentAverage.latitude}`
              : "—"}
          </Typography>

          <Box border={1} borderColor="divider" borderRadius={1}>
            <GpsAverageCoordinates
              readings={readings}
              width={320}
              height={200}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              average={currentAverage}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleDone}
          disabled={result == null}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
