import Add from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { ColorMode } from "../theme";
import { AboutDialog } from "./AboutDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";

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
  const [aboutOpen, setAboutOpen] = useState(false);

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

  const handleAboutClick = () => {
    handleMenuClose();
    setAboutOpen(true);
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
        <Typography variant="h6" component="h1">
          Coordinate Helper
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {hasCoordinates && (
            <IconButton
              onClick={onAddCoordinate}
              aria-label="Add coordinate"
              size="small"
            >
              <Add />
            </IconButton>
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
      </Box>
      <Menu
        id="app-menu"
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ list: { "aria-labelledby": "app-menu-button" } }}
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
        <MenuItem onClick={handleAboutClick}>
          <ListItemText primary="About" />
        </MenuItem>
      </Menu>
      <ConfirmationDialog
        open={resetOpen}
        onClose={handleResetCancel}
        onConfirm={handleResetConfirm}
        title="Reset"
        contentText="Are you sure? This will clear all coordinates and reset the application to the starting state."
        confirmButtonText="Reset"
      />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
