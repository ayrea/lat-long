import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import type { ColorMode } from "../theme";

function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  );
}

interface TopBarProps {
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  hasCoordinates: boolean;
  onReset: () => void;
  onExport: () => void;
  onAddCoordinate: () => void;
}

export function TopBar({
  colorMode,
  onColorModeChange,
  hasCoordinates,
  onReset,
  onExport,
  onAddCoordinate,
}: TopBarProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const menuOpen = Boolean(menuAnchor);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchor(null);

  const handleResetClick = () => {
    handleMenuClose();
    setResetOpen(true);
  };
  const handleResetConfirm = () => {
    onReset();
    setResetOpen(false);
  };
  const handleResetCancel = () => setResetOpen(false);

  const handleExportClick = () => {
    handleMenuClose();
    onExport();
  };

  const handleDarkModeClick = () => {
    onColorModeChange(colorMode === "dark" ? "light" : "dark");
    handleMenuClose();
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          width: "100%",
        }}
      >
        {hasCoordinates ? (
          <Button variant="outlined" onClick={onAddCoordinate}>
            Add coordinate
          </Button>
        ) : (
          <Box />
        )}
        <IconButton
          id="app-menu-button"
          onClick={handleMenuOpen}
          aria-label="Open menu"
          aria-controls={menuOpen ? "app-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
        >
          <MenuIcon />
        </IconButton>
      </Box>
      <Menu
        id="app-menu"
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ "aria-labelledby": "app-menu-button" }}
      >
        <MenuItem onClick={handleResetClick}>
          <ListItemText primary="Reset" />
        </MenuItem>
        <MenuItem
          onClick={handleExportClick}
          disabled={!hasCoordinates}
        >
          <ListItemText primary="Export" />
        </MenuItem>
        <MenuItem onClick={handleDarkModeClick}>
          <ListItemText
            primary={colorMode === "dark" ? "Light mode" : "Dark mode"}
          />
        </MenuItem>
      </Menu>
      <Dialog open={resetOpen} onClose={handleResetCancel}>
        <DialogTitle>Reset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure? This will clear all coordinates and reset the
            application to the starting state.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetCancel}>Cancel</Button>
          <Button
            onClick={handleResetConfirm}
            color="error"
            variant="contained"
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
