import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";

const GPS_AVERAGING_READING_COUNT = 20;

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
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = () => {
    cancelledRef.current = true;
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setReadings([]);
    onClose();
  };

  useEffect(() => {
    if (!open || !navigator.geolocation) return;
    cancelledRef.current = false;
    setReadings([]);

    const capture = () => {
      if (cancelledRef.current) return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelledRef.current) return;
          const { longitude, latitude } = position.coords;
          setReadings((prev) => {
            const next = [...prev, { longitude, latitude }];
            if (next.length < GPS_AVERAGING_READING_COUNT) {
              timeoutRef.current = setTimeout(capture, 2000);
            }
            return next;
          });
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

  useEffect(() => {
    if (readings.length !== GPS_AVERAGING_READING_COUNT) return;
    const avgLon =
      readings.reduce((s, r) => s + r.longitude, 0) / readings.length;
    const avgLat =
      readings.reduce((s, r) => s + r.latitude, 0) / readings.length;
    const notes = 'GPS Averaging:\n' + readings
      .map((r) => `${r.longitude}, ${r.latitude}`)
      .join("\n");
    onComplete({ longitude: avgLon, latitude: avgLat, notes });
    cancelledRef.current = true;
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setReadings([]);
    onClose();
  }, [readings, onComplete, onClose]);

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
              value={(readings.length / GPS_AVERAGING_READING_COUNT) * 100}
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
                {`${readings.length} / ${GPS_AVERAGING_READING_COUNT}`}
              </Typography>
            </Box>
          </Box>
          <List dense sx={{ width: "100%", maxHeight: 240, overflow: "auto" }}>
            {Array.from({ length: GPS_AVERAGING_READING_COUNT }, (_, i) => (
              <ListItem key={i} disablePadding>
                <ListItemText
                  primary={
                    readings[i]
                      ? `${readings[i].longitude}, ${readings[i].latitude}`
                      : " "
                  }
                  slotProps={{
                    primary: {
                      variant: "body2",
                      color: readings[i]
                        ? "text.primary"
                        : "text.secondary",
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
