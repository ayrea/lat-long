import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";

interface TopBarProps {
  hasTransactions: boolean;
  onReset: () => void;
  onExport: () => void;
}

export function TopBar({ hasTransactions, onReset, onExport }: TopBarProps) {
  const [resetOpen, setResetOpen] = useState(false);

  const handleResetClick = () => setResetOpen(true);
  const handleResetConfirm = () => {
    onReset();
    setResetOpen(false);
  };
  const handleResetCancel = () => setResetOpen(false);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "flex-end",
          flexWrap: "wrap",
          py: 2,
        }}
      >
        <Button variant="outlined" color="warning" onClick={handleResetClick}>
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={onExport}
          disabled={!hasTransactions}
        >
          Export
        </Button>
      </Box>
      <Dialog open={resetOpen} onClose={handleResetCancel}>
        <DialogTitle>Reset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure? This will clear all transactions and reset the
            application to the starting state.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetCancel}>Cancel</Button>
          <Button
            onClick={handleResetConfirm}
            color="warning"
            variant="contained"
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
