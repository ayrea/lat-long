import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";
import type { ColorMode } from "../theme";

const WARMUP_MIN = 1;
const WARMUP_MAX = 60;
const DURATION_MIN = 1;
const DURATION_MAX = 300;

export interface SettingsValues {
  colorMode: ColorMode;
  warmupSeconds: number;
  averagingDurationSeconds: number;
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  initialColorMode: ColorMode;
  initialWarmupSeconds: number;
  initialAveragingDurationSeconds: number;
  onSave: (settings: SettingsValues) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function SettingsDialog({
  open,
  onClose,
  initialColorMode,
  initialWarmupSeconds,
  initialAveragingDurationSeconds,
  onSave,
}: SettingsDialogProps) {
  const [colorMode, setColorMode] = useState<ColorMode>(initialColorMode);
  const [warmupSeconds, setWarmupSeconds] = useState<string>(
    String(initialWarmupSeconds)
  );
  const [averagingDurationSeconds, setAveragingDurationSeconds] = useState<
    string
  >(String(initialAveragingDurationSeconds));

  useEffect(() => {
    if (open) {
      setColorMode(initialColorMode);
      setWarmupSeconds(String(initialWarmupSeconds));
      setAveragingDurationSeconds(String(initialAveragingDurationSeconds));
    }
  }, [
    open,
    initialColorMode,
    initialWarmupSeconds,
    initialAveragingDurationSeconds,
  ]);

  const warmupNum = parseInt(warmupSeconds, 10);
  const durationNum = parseInt(averagingDurationSeconds, 10);
  const warmupValid =
    Number.isFinite(warmupNum) &&
    warmupNum >= WARMUP_MIN &&
    warmupNum <= WARMUP_MAX;
  const durationValid =
    Number.isFinite(durationNum) &&
    durationNum >= DURATION_MIN &&
    durationNum <= DURATION_MAX;
  const canSave = warmupValid && durationValid;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      colorMode,
      warmupSeconds: clamp(warmupNum, WARMUP_MIN, WARMUP_MAX),
      averagingDurationSeconds: clamp(durationNum, DURATION_MIN, DURATION_MAX),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="settings-mode-label">Mode</InputLabel>
            <Select
              labelId="settings-mode-label"
              id="settings-mode"
              value={colorMode}
              label="Mode"
              onChange={(e) => setColorMode(e.target.value as ColorMode)}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Warm-up Time (seconds)"
            type="number"
            size="small"
            fullWidth
            value={warmupSeconds}
            onChange={(e) => setWarmupSeconds(e.target.value)}
            inputProps={{ min: WARMUP_MIN, max: WARMUP_MAX }}
            error={
              warmupSeconds !== "" &&
              (!Number.isFinite(warmupNum) ||
                warmupNum < WARMUP_MIN ||
                warmupNum > WARMUP_MAX)
            }
            helperText={`${WARMUP_MIN}–${WARMUP_MAX}`}
          />
          <TextField
            label="GPS Averaging Duration (seconds)"
            type="number"
            size="small"
            fullWidth
            value={averagingDurationSeconds}
            onChange={(e) => setAveragingDurationSeconds(e.target.value)}
            inputProps={{ min: DURATION_MIN, max: DURATION_MAX }}
            error={
              averagingDurationSeconds !== "" &&
              (!Number.isFinite(durationNum) ||
                durationNum < DURATION_MIN ||
                durationNum > DURATION_MAX)
            }
            helperText={`${DURATION_MIN}–${DURATION_MAX}`}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
