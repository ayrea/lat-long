import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";

interface RenameCoordinateDialogProps {
  open: boolean;
  onClose: () => void;
  coordinateId: string | null;
  initialName: string;
  onRename: (coordinateId: string, newName: string) => void;
}

export function RenameCoordinateDialog({
  open,
  onClose,
  coordinateId,
  initialName,
  onRename,
}: RenameCoordinateDialogProps) {
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    if (open) setValue(initialName);
  }, [open, initialName]);

  const handleClose = () => {
    setValue("");
    onClose();
  };

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (coordinateId && trimmed) {
      onRename(coordinateId, trimmed);
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>Rename coordinate</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          size="small"
          sx={{ mt: 1, minWidth: 280 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!value.trim()}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
}
