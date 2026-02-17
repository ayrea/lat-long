import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import MoreVert from "@mui/icons-material/MoreVert";
import { useState } from "react";
import type { Coordinate } from "../types";
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
  const handleDelete = () => {
    handleMenuClose();
    onDelete(coordinate.id);
  };

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
        </CardContent>
      </Card>
      <Menu
        id={`coordinate-card-menu-${coordinate.id}`}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ "aria-labelledby": `coordinate-card-menu-button-${coordinate.id}` }}
      >
        <MenuItem onClick={handleTransform}>
          <ListItemText primary="Transform" />
        </MenuItem>
        {canProject && (
          <MenuItem onClick={handleProject}>
            <ListItemText primary="Project" />
          </MenuItem>
        )}
        <MenuItem onClick={handleRename}>
          <ListItemText primary="Rename" />
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </>
  );
}
