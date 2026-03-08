import Add from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { ColorMode } from "../theme";
import type { SettingsValues } from "./SettingsDialog";
import { AboutDialog } from "./AboutDialog";
import { SettingsDialog } from "./SettingsDialog";

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

interface ProjectTopBarProps {
  colorMode: ColorMode;
  hasProjects: boolean;
  onExport: () => void;
  onAddProject?: () => void;
  warmupSeconds: number;
  averagingDurationSeconds: number;
  onSaveSettings: (settings: SettingsValues) => void;
}

export function ProjectTopBar({
  colorMode,
  hasProjects,
  onExport,
  onAddProject,
  warmupSeconds,
  averagingDurationSeconds,
  onSaveSettings,
}: ProjectTopBarProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menuOpen = Boolean(menuAnchor);
  const canExport = hasProjects;

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchor(null);

  const handleExportClick = () => {
    handleMenuClose();
    onExport();
  };

  const handleAboutClick = () => {
    handleMenuClose();
    setAboutOpen(true);
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    setSettingsOpen(true);
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
          <Typography variant="h6" component="h1" noWrap sx={{ minWidth: 0 }}>
            Coordinate Helper
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {onAddProject != null && (
            <IconButton
              onClick={onAddProject}
              aria-label="Add project"
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
        <MenuItem onClick={handleExportClick} disabled={!canExport}>
          <ListItemText primary="Export" />
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <ListItemText primary="Settings" />
        </MenuItem>
        <MenuItem onClick={handleAboutClick}>
          <ListItemText primary="About" />
        </MenuItem>
      </Menu>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialColorMode={colorMode}
        initialWarmupSeconds={warmupSeconds}
        initialAveragingDurationSeconds={averagingDurationSeconds}
        onSave={onSaveSettings}
      />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
