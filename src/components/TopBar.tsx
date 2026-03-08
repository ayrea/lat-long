import Add from "@mui/icons-material/Add";
import ArrowBack from "@mui/icons-material/ArrowBack";
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
import { ConfirmationDialog } from "./ConfirmationDialog";
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

export type TopBarView = "projects" | "coordinates";

interface TopBarProps {
  view: TopBarView;
  colorMode: ColorMode;
  hasCoordinates: boolean;
  hasProjects: boolean;
  currentProjectName?: string;
  onReset: () => void;
  onExport: () => void;
  onAddCoordinate: () => void;
  onAddProject?: () => void;
  onExitProject?: () => void;
  warmupSeconds: number;
  averagingDurationSeconds: number;
  onSaveSettings: (settings: SettingsValues) => void;
}

export function TopBar({
  view,
  colorMode,
  hasCoordinates: _hasCoordinates,
  hasProjects,
  currentProjectName = "",
  onReset,
  onExport,
  onAddCoordinate,
  onAddProject,
  onExitProject,
  warmupSeconds,
  averagingDurationSeconds,
  onSaveSettings,
}: TopBarProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menuOpen = Boolean(menuAnchor);
  const isProjectsView = view === "projects";
  const canExport = isProjectsView ? hasProjects : true;
  const addAction = isProjectsView ? onAddProject : onAddCoordinate;

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

  const handleSettingsClick = () => {
    handleMenuClose();
    setSettingsOpen(true);
  };

  const title =
    isProjectsView
      ? "Coordinate Helper"
      : (currentProjectName.length > 24
        ? `${currentProjectName.slice(0, 24)}…`
        : currentProjectName) || "Project";

  const resetTitle = isProjectsView ? "Reset" : "Reset project";
  const resetContent = isProjectsView
    ? "Are you sure? This will clear all projects and all coordinates."
    : "Are you sure? This will clear all coordinates in this project.";

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
          {!isProjectsView && onExitProject != null && (
            <IconButton
              onClick={onExitProject}
              aria-label="Exit project"
              size="small"
              sx={{ flexShrink: 0 }}
            >
              <ArrowBack />
            </IconButton>
          )}
          <Typography variant="h6" component="h1" noWrap sx={{ minWidth: 0 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {addAction != null && (
            <IconButton
              onClick={addAction}
              aria-label={isProjectsView ? "Add project" : "Add coordinate"}
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
          <ListItemText primary={resetTitle} />
        </MenuItem>
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
      <ConfirmationDialog
        open={resetOpen}
        onClose={handleResetCancel}
        onConfirm={handleResetConfirm}
        title={resetTitle}
        contentText={resetContent}
        confirmButtonText={resetTitle}
      />
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
