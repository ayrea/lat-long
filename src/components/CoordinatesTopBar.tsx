import Add from "@mui/icons-material/Add";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { AboutDialog } from "./AboutDialog";

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

interface CoordinatesTopBarProps {
  currentProjectName?: string;
  onExport: () => void;
  onAddCoordinate: () => void;
  onExitProject?: () => void;
}

export function CoordinatesTopBar({
  currentProjectName = "",
  onExport,
  onAddCoordinate,
  onExitProject,
}: CoordinatesTopBarProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const menuOpen = Boolean(menuAnchor);

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

  const title =
    currentProjectName.length > 24
      ? `${currentProjectName.slice(0, 24)}…`
      : currentProjectName || "Project";

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
          {onExitProject != null && (
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
            Project: {title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          <IconButton
            onClick={onAddCoordinate}
            aria-label="Add coordinate"
            size="small"
          >
            <Add />
          </IconButton>
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
        <MenuItem onClick={handleExportClick}>
          <ListItemText primary="Export" />
        </MenuItem>
        <MenuItem onClick={handleAboutClick}>
          <ListItemText primary="About" />
        </MenuItem>
      </Menu>
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
