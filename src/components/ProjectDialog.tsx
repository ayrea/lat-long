import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  coordinateId: string | null;
  onProject: (
    coordinateId: string,
    bearing: number,
    distance: number
  ) => void;
}

export function ProjectDialog({
  open,
  onClose,
  coordinateId,
  onProject,
}: ProjectDialogProps) {
  const [bearing, setBearing] = useState("");
  const [distance, setDistance] = useState("");

  useEffect(() => {
    if (open) {
      setBearing("");
      setDistance("");
    }
  }, [open]);

  const handleClose = () => {
    setBearing("");
    setDistance("");
    onClose();
  };

  const b = parseFloat(bearing);
  const d = parseFloat(distance);
  const valid =
    coordinateId != null &&
    Number.isFinite(b) &&
    Number.isFinite(d) &&
    d >= 0;

  const handleConfirm = () => {
    if (valid) {
      onProject(coordinateId!, b, d);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Project by bearing and distance</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            minWidth: 280,
          }}
        >
          <TextField
            label="Bearing (degrees from North)"
            type="number"
            value={bearing}
            onChange={(e) => setBearing(e.target.value)}
            size="small"
            slotProps={{ htmlInput: { step: "any", min: 0, max: 360 } }}
          />
          <TextField
            label="Distance"
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            size="small"
            slotProps={{ htmlInput: { step: "any", min: 0 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!valid}>
          Project
        </Button>
      </DialogActions>
    </Dialog>
  );
}
