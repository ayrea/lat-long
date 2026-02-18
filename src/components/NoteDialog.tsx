import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";

interface NoteDialogProps {
  open: boolean;
  onClose: () => void;
  coordinateId: string | null;
  initialNote: string;
  title: string;
  onSave: (coordinateId: string, notes: string) => void;
}

export function NoteDialog({
  open,
  onClose,
  coordinateId,
  initialNote,
  title,
  onSave,
}: NoteDialogProps) {
  const [value, setValue] = useState(initialNote);

  useEffect(() => {
    if (open) setValue(initialNote);
  }, [open, initialNote]);

  const handleClose = () => {
    setValue("");
    onClose();
  };

  const handleConfirm = () => {
    if (coordinateId != null) {
      onSave(coordinateId, value);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Note"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          size="small"
          multiline
          minRows={3}
          sx={{ mt: 1, minWidth: 280 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
