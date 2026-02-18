import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
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
import Typography from "@mui/material/Typography";
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
      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          About
          <IconButton
            aria-label="Close"
            onClick={() => setAboutOpen(false)}
            size="small"
            sx={{ mr: -1 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            <Box>
              <Typography variant="subtitle1" component="h2" gutterBottom>
                Coordinate Helper (Lat-Long)
              </Typography>
              <Box sx={{ overflowY: "auto", maxHeight: "40vh" }}>
                <Typography variant="body2" component="div">
                  Coordinate Helper is a Progressive Web App (PWA) for working with spatial coordinates. You can install it for offline use.
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  <strong>What it does:</strong>
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                  <strong>Transform coordinates</strong> — Convert coordinates between different Coordinate Reference Systems (CRS), e.g. WGS 84 (EPSG:4326), Web Mercator (EPSG:3857), British National Grid (EPSG:27700), UTM zones, and others from the EPSG registry.
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                  <strong>Project by bearing and distance</strong> — From a point in a projected CRS, compute a new point given bearing (degrees from North, clockwise) and distance (in the CRS units, e.g. metres).
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                  <strong>Find bearing and distance</strong> — Between two points in a projected CRS, compute bearing and distance.
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                  <strong>Manage a list</strong> — Add, rename, and delete coordinates; each can have a name and notes.
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                  <strong>Export</strong> — Export the coordinate list to CSV.
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  All coordinate math runs in your browser; no data is sent to a server. The app works offline after the first load.
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle1" component="h2" gutterBottom>
                Data &amp; Privacy
              </Typography>
              <Box sx={{ overflowY: "auto", maxHeight: "40vh" }}>
                <Typography variant="body2">
                  All data you enter and generate within this app stays securely on your device and is never transmitted to external servers. We do not collect, store, or share your personal information. Every feature is designed with privacy in mind, ensuring that your data remains fully under your control at all times. You can use the app with confidence, knowing that your information never leaves the app and your privacy is fully respected.
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
