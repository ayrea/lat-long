import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import MoreVert from "@mui/icons-material/MoreVert";
import { useState } from "react";
import type { Coordinate, CardType } from "../types";
import type { AxisLabels } from "./CoordinateForm";
import { CoordinateCard } from "./CoordinateCard";

interface CoordinateItemCardProps {
  coordinate: Coordinate;
  axisLabels: AxisLabels;
  /** Display name for the CRS (e.g. "WGS 84"). Shown as "Name (EPSG:code)" when set. */
  crsName?: string;
  onTransform: (id: string) => void;
  onProject: (id: string) => void;
  onRename: (id: string) => void;
  onAddNote: (id: string) => void;
  onFindBearing: (id: string) => void;
  onDelete: (id: string) => void;
  canProject: boolean;
}

export function CoordinateItemCard({
  coordinate,
  axisLabels,
  crsName,
  onTransform,
  onProject,
  onRename,
  onAddNote,
  onFindBearing,
  onDelete,
  canProject,
}: CoordinateItemCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const handleTransform = () => {
    handleMenuClose();
    onTransform(coordinate.id);
  };
  const handleProject = () => {
    handleMenuClose();
    onProject(coordinate.id);
  };
  const handleRename = () => {
    handleMenuClose();
    onRename(coordinate.id);
  };
  const handleAddNote = () => {
    handleMenuClose();
    onAddNote(coordinate.id);
  };
  const handleFindBearing = () => {
    handleMenuClose();
    onFindBearing(coordinate.id);
  };
  const handleDelete = () => {
    handleMenuClose();
    onDelete(coordinate.id);
  };

  const cardType: CardType = coordinate.cardType ?? "manual";
  const chipConfig: Record<
    CardType,
    { label: string; bgcolor: string }
  > = {
    manual: { label: "Manual", bgcolor: "#fdd835" },
    project: { label: "Project", bgcolor: "#42a5f5" },
    transform: { label: "Transform", bgcolor: "#66bb6a" },
  };
  const { label: chipLabel, bgcolor: chipBg } = chipConfig[cardType];

  return (
    <>
      <Card variant="outlined" sx={{ minWidth: 280 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 0.5,
            }}
          >
            <Typography variant="h6" component="h3" gutterBottom>
              {coordinate.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Chip
                label={chipLabel}
                size="small"
                sx={{
                  backgroundColor: chipBg,
                  color: "rgba(0,0,0,0.87)",
                  fontWeight: 500,
                }}
              />
              <IconButton
                id={`coordinate-card-menu-button-${coordinate.id}`}
                size="small"
                onClick={handleMenuOpen}
                aria-label="Actions"
                aria-controls={menuOpen ? `coordinate-card-menu-${coordinate.id}` : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? "true" : undefined}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              gap: 2,
            }}
          >
            <Box sx={{ flex: "1 1 50%", minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {crsName
                  ? `${crsName} (EPSG:${coordinate.crsCode})`
                  : `EPSG:${coordinate.crsCode}`}
              </Typography>
              <Box sx={{ mb: 0 }}>
                <CoordinateCard
                  coord={{ x: coordinate.x, y: coordinate.y }}
                  axisLabels={axisLabels}
                />
              </Box>
            </Box>
            <Box
              sx={{
                flex: "1 1 50%",
                minWidth: 0,
                overflowY: "auto",
              }}
            >
              <Typography
                variant="body2"
                color="text.primary"
                component="span"
                sx={{ fontWeight: 500 }}
              >
                Notes:
              </Typography>
              {coordinate.notes != null && coordinate.notes !== "" ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}
                >
                  {coordinate.notes}
                </Typography>
              ) : null}
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Menu
        id={`coordinate-card-menu-${coordinate.id}`}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ list: { "aria-labelledby": `coordinate-card-menu-button-${coordinate.id}` } }}
      >
        <MenuItem
          onClick={handleTransform}
          sx={{
            backgroundColor: "#66bb6a",
            color: "rgba(0,0,0,0.87)",
            "&:hover": { backgroundColor: "rgba(102, 187, 106, 0.9)" },
          }}
        >
          <ListItemText primary="Transform" />
        </MenuItem>
        {canProject && (
          <MenuItem
            onClick={handleProject}
            sx={{
              backgroundColor: "#42a5f5",
              color: "rgba(0,0,0,0.87)",
              "&:hover": { backgroundColor: "rgba(66, 165, 245, 0.9)" },
            }}
          >
            <ListItemText primary="Project" />
          </MenuItem>
        )}
        {canProject && (
          <MenuItem onClick={handleFindBearing}>
            <ListItemText primary="Find bearing" />
          </MenuItem>
        )}
        <MenuItem onClick={handleRename}>
          <ListItemText primary="Rename" />
        </MenuItem>
        <MenuItem onClick={handleAddNote}>
          <ListItemText
            primary={coordinate.notes ? "Edit note" : "Add note"}
          />
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </>
  );
}
