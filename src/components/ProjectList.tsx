import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ProjectRecord } from "../db";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { NoteDialog } from "./NoteDialog";
import { ProjectCard } from "./ProjectCard";

interface ProjectListProps {
  projects: ProjectRecord[];
  onSelectProject: (projectId: string) => void;
  onAddProjectClick: () => void;
  onDeleteProject: (projectId: string) => void;
  onExportProject: (projectId: string) => void;
  onUpdateProjectNote: (projectId: string, notes: string) => void;
}

export function ProjectList({
  projects,
  onSelectProject,
  onAddProjectClick,
  onDeleteProject,
  onExportProject,
  onUpdateProjectNote,
}: ProjectListProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<
    string | null
  >(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteProjectId, setNoteProjectId] = useState<string | null>(null);

  const handleDeleteRequest = (projectId: string) => {
    setPendingDeleteProjectId(projectId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (pendingDeleteProjectId) {
      onDeleteProject(pendingDeleteProjectId);
      setPendingDeleteProjectId(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setPendingDeleteProjectId(null);
  };

  const handleOpenNote = (projectId: string) => {
    setNoteProjectId(projectId);
    setNoteDialogOpen(true);
  };

  const noteProject = projects.find((p) => p.projectId === noteProjectId);

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {projects.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              py: 6,
              px: 2,
            }}
          >
            <Typography color="text.secondary" textAlign="center">
              No projects yet. Add one to get started.
            </Typography>
            <Button variant="contained" onClick={onAddProjectClick}>
              Add project
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              overflow: "auto",
              flex: 1,
              minHeight: 0,
              py: 2,
            }}
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onSelect={onSelectProject}
                onDeleteRequest={handleDeleteRequest}
                onExportRequest={onExportProject}
                onAddOrEditNote={handleOpenNote}
              />
            ))}
          </Box>
        )}
      </Box>
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete project"
        contentText="Are you sure you want to delete this project? All coordinates in this project will also be deleted. This cannot be undone."
        confirmButtonText="Delete"
      />
      <NoteDialog
        open={noteDialogOpen}
        onClose={() => {
          setNoteDialogOpen(false);
          setNoteProjectId(null);
        }}
        entityId={noteProjectId}
        initialNote={noteProject?.notes ?? ""}
        title={noteProject?.notes ? "Edit note" : "Add note"}
        onSave={(id, notes) => onUpdateProjectNote(id, notes)}
      />
    </>
  );
}
