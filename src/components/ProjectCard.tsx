import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { Project } from "../types";

interface ProjectCardProps {
  project: Project;
  onSelect: (projectId: string) => void;
  onDeleteRequest: (projectId: string) => void;
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
}: ProjectCardProps) {
  const coordinateCount = useLiveQuery(
    () => db.coordinates.where("projectId").equals(project.projectId).count(),
    [project.projectId],
    0
  );

  const handleCardClick = () => onSelect(project.projectId);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteRequest(project.projectId);
  };

  return (
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
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-wrap", mb: 1 }}
          >
            {project.notes}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {coordinateCount} coordinate{coordinateCount !== 1 ? "s" : ""}
        </Typography>
        <IconButton
          size="small"
          onClick={handleDeleteClick}
          aria-label="Delete project"
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <DeleteOutlined fontSize="small" />
        </IconButton>
      </CardContent>
    </Card>
  );
}
