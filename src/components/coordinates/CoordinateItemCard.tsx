import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import MoreVert from "@mui/icons-material/MoreVert";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "../../db";
import type { Coordinate, CardType } from "../../types";
import type { AxisLabels } from "./CoordinateForm";
import { CoordinateCard } from "./CoordinateCard";
import { PhotosDialog } from "../photos/PhotosDialog";

interface CoordinateItemCardProps {
  coordinate: Coordinate;
  /** Parent project ID (for Photos dialog). */
  projectId: string;
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

const CARD_TYPE_STYLES: Record<
  CardType,
  {
    label: string;
    chipBg: string;
    menuBg: string;
    menuHoverBg: string;
  }
> = {
  manual: {
    label: "Manual",
    chipBg: "#fdd835",
    menuBg: "#fdd835",
    menuHoverBg: "rgba(253, 216, 53, 0.9)",
  },
  project: {
    label: "Project",
    chipBg: "#42a5f5",
    menuBg: "#42a5f5",
    menuHoverBg: "rgba(66, 165, 245, 0.9)",
  },
  transform: {
    label: "Transform",
    chipBg: "#66bb6a",
    menuBg: "#66bb6a",
    menuHoverBg: "rgba(102, 187, 106, 0.9)",
  },
};

export function CoordinateItemCard({
  coordinate,
  projectId,
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
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const photoCount = useLiveQuery(
    () => db.photos.where("coordinateId").equals(coordinate.id).count(),
    [coordinate.id],
  );
  const count = photoCount ?? 0;

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
  const handleOpenPhotos = () => {
    handleMenuClose();
    setPhotosDialogOpen(true);
  };

  const cardType: CardType = coordinate.cardType ?? "manual";
  const { label: chipLabel, chipBg } = CARD_TYPE_STYLES[cardType];

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
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
            <Badge badgeContent={count} color="primary" overlap="circular">
              <IconButton
                size="small"
                aria-label={count === 0 ? "Add photos" : `Photos (${count})`}
                onClick={() => setPhotosDialogOpen(true)}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
            </Badge>
          </Box>
        </CardContent>
      </Card>
      <PhotosDialog
        open={photosDialogOpen}
        onClose={() => setPhotosDialogOpen(false)}
        coordinateId={coordinate.id}
        coordinateName={coordinate.name}
        projectId={projectId}
      />
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
            backgroundColor: CARD_TYPE_STYLES.transform.menuBg,
            color: "rgba(0,0,0,0.87)",
            "&:hover": {
              backgroundColor: CARD_TYPE_STYLES.transform.menuHoverBg,
            },
          }}
        >
          <ListItemText primary="Transform" />
        </MenuItem>
        {canProject && (
          <MenuItem
            onClick={handleProject}
            sx={{
              backgroundColor: CARD_TYPE_STYLES.project.menuBg,
              color: "rgba(0,0,0,0.87)",
              "&:hover": {
                backgroundColor: CARD_TYPE_STYLES.project.menuHoverBg,
              },
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
        <MenuItem onClick={handleOpenPhotos}>
          <ListItemText primary="Photos" />
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
