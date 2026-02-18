import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import type { Coordinate } from "../types";

interface FindBearingDialogProps {
  open: boolean;
  onClose: () => void;
  sourceCoordinateId: string | null;
  coordinates: Coordinate[];
  onConfirm: (sourceId: string, targetId: string) => void;
}

export function FindBearingDialog({
  open,
  onClose,
  sourceCoordinateId,
  coordinates,
  onConfirm,
}: FindBearingDialogProps) {
  const source = coordinates.find((c) => c.id === sourceCoordinateId);
  const sourceCrsCode = source?.crsCode ?? "";
  const sameCrsCoords = coordinates.filter(
    (c) => c.id !== sourceCoordinateId && c.crsCode === sourceCrsCode
  );

  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setTargetId(null);
  }, [open]);

  const handleClose = () => {
    setTargetId(null);
    onClose();
  };

  const handleConfirm = () => {
    if (sourceCoordinateId && targetId) {
      onConfirm(sourceCoordinateId, targetId);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Find bearing</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Select a coordinate (same CRS) to compute bearing and distance from
          the current point:
        </Typography>
        {sameCrsCoords.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No other coordinates with the same CRS.
          </Typography>
        ) : (
          <List
            dense
            sx={{ minWidth: 280, maxHeight: 240, overflow: "auto" }}
          >
            {sameCrsCoords.map((coord) => (
              <ListItemButton
                key={coord.id}
                selected={targetId === coord.id}
                onClick={() => setTargetId(coord.id)}
              >
                {coord.name}
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!targetId}
        >
          Add to notes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
