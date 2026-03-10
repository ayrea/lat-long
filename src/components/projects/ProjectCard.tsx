import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import MoreVert from "@mui/icons-material/MoreVert";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import type { Project } from "../../types";

interface ProjectCardProps {
  project: Project;
  onSelect: (projectId: string) => void;
  onDeleteRequest: (projectId: string) => void;
  onExportRequest: (projectId: string) => void;
  onAddOrEditNote: (projectId: string) => void;
}

function formatCreatedDate(iso: string): string {
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : iso;
  } catch {
    return iso;
  }
}

export function ProjectCard({
  project,
  onSelect,
  onDeleteRequest,
  onExportRequest,
  onAddOrEditNote,
}: ProjectCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const coordinateCount = useLiveQuery(
    () => db.coordinates.where("projectId").equals(project.projectId).count(),
    [project.projectId],
    0
  );

  const handleCardClick = () => onSelect(project.projectId);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const handleExport = () => {
    handleMenuClose();
    onExportRequest(project.projectId);
  };
  const handleDelete = () => {
    handleMenuClose();
    onDeleteRequest(project.projectId);
  };

  const handleAddOrEditNote = () => {
    handleMenuClose();
    onAddOrEditNote(project.projectId);
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          position: "relative",
          minWidth: 280,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
        onClick={handleCardClick}
      >
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            {project.projectName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Created {formatCreatedDate(project.createdDateTime)}
          </Typography>
          {project.notes != null && project.notes !== "" && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ whiteSpace: "pre-wrap", mb: 1 }}
            >
              Notes: {project.notes}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {coordinateCount} coordinate{coordinateCount !== 1 ? "s" : ""}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            aria-label="Project actions"
            aria-controls={menuOpen ? `project-card-menu-${project.projectId}` : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </CardContent>
      </Card>
      <Menu
        id={`project-card-menu-${project.projectId}`}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleExport}>
          <ListItemText primary="Export" />
        </MenuItem>
        <MenuItem onClick={handleAddOrEditNote}>
          <ListItemText
            primary={project.notes ? "Edit note" : "Add note"}
          />
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </>
  );
}
