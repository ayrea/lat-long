import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useState, useEffect, useRef } from "react";

interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onAddProject: (projectName: string, notes: string) => void;
}

export function AddProjectDialog({
  open,
  onClose,
  onAddProject,
}: AddProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setProjectName("");
      setNotes("");
    }
  }, [open]);

  const saveValid = projectName.trim() !== "";

  const handleSave = () => {
    if (!saveValid) return;
    onAddProject(projectName.trim(), notes.trim());
    onClose();
  };

  const handleClose = () => {
    setProjectName("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} TransitionProps={{ onEntered: () => inputRef.current?.focus() }}>
      <DialogTitle>New project</DialogTitle>
      <DialogContent>
        <TextField
          inputRef={inputRef}
          margin="dense"
          label="Project name"
          fullWidth
          variant="outlined"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />
        <TextField
          margin="dense"
          label="Notes"
          fullWidth
          variant="outlined"
          multiline
          minRows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!saveValid}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
