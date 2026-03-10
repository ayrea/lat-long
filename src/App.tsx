import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import { useCallback, useState } from "react";
import { AddProjectDialog } from "./components/projects/AddProjectDialog";
import { CoordinateForm } from "./components/coordinates/CoordinateForm";
import { ProjectList } from "./components/projects/ProjectList";
import { CoordinatesTopBar } from "./components/coordinates/CoordinatesTopBar";
import { ProjectTopBar } from "./components/projects/ProjectTopBar";
import type { SettingsValues } from "./components/SettingsDialog";
import { getAppTheme, type ColorMode } from "./theme";
import { useProjects } from "./hooks/useProjects";
import { useCoordinates } from "./hooks/useCoordinates";
import { exportAllCoordinatesToCsv, exportProjectCoordinatesToCsv } from "./services/exportCsv";
import {
  getStoredColorMode,
  getStoredGpsAveragingDurationSeconds,
  getStoredGpsWarmupSeconds,
  setStoredColorMode,
  setStoredGpsAveragingDurationSeconds,
  setStoredGpsWarmupSeconds,
} from "./utils/storage";

export default function App() {
  const {
    projects,
    addProject,
    deleteProject,
    updateProjectNote,
    renameProject,
    resetAllData,
  } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const {
    coordinates,
    nextSuggestedName,
    addCoordinate,
    transformCoordinateById,
    projectFromCoordinate,
    renameCoordinate,
    deleteCoordinate,
    updateCoordinateNote,
    findBearingBetweenCoordinates,
    error,
    clearError,
  } = useCoordinates(selectedProjectId);

  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    return getStoredColorMode("dark");
  });
  const [warmupSeconds, setWarmupSeconds] = useState(() =>
    getStoredGpsWarmupSeconds()
  );
  const [averagingDurationSeconds, setAveragingDurationSeconds] = useState(
    () => getStoredGpsAveragingDurationSeconds()
  );
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleSaveSettings = useCallback((settings: SettingsValues) => {
    setColorMode(settings.colorMode);
    setStoredColorMode(settings.colorMode);
    setWarmupSeconds(settings.warmupSeconds);
    setAveragingDurationSeconds(settings.averagingDurationSeconds);
    setStoredGpsWarmupSeconds(settings.warmupSeconds);
    setStoredGpsAveragingDurationSeconds(settings.averagingDurationSeconds);
  }, []);

  const handleResetData = useCallback(async () => {
    await resetAllData();
    setSelectedProjectId(null);
  }, [resetAllData]);

  const handleAddProject = useCallback(
    async (projectName: string, notes: string) => {
      const newProjectId = await addProject(projectName, notes);
      setSelectedProjectId(newProjectId);
    },
    [addProject]
  );

  const handleDeleteProject = useCallback(async (projectId: string) => {
    await deleteProject(projectId);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  }, [deleteProject, selectedProjectId]);

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleExitProject = useCallback(() => {
    setSelectedProjectId(null);
  }, []);

  const handleUpdateProjectNote = useCallback(
    (projectId: string, notes: string) => {
      updateProjectNote(projectId, notes);
    },
    [updateProjectNote]
  );

  const handleRenameProject = useCallback(
    (newName: string) => {
      if (selectedProjectId != null) {
        renameProject(selectedProjectId, newName);
      }
    },
    [renameProject, selectedProjectId]
  );

  const handleExport = useCallback(() => {
    void exportAllCoordinatesToCsv();
  }, []);

  const handleExportProject = useCallback((projectId: string) => {
    void exportProjectCoordinatesToCsv(projectId);
  }, []);

  const handleExportCurrentProject = useCallback(() => {
    if (selectedProjectId != null) void handleExportProject(selectedProjectId);
  }, [selectedProjectId, handleExportProject]);

  const currentProjectName =
    projects.find((p) => p.projectId === selectedProjectId)?.projectName ?? "";

  return (
    <ThemeProvider theme={getAppTheme(colorMode)}>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          overflow: "hidden",
          maxWidth: 720,
          mx: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          {selectedProjectId == null ? (
            <ProjectTopBar
              colorMode={colorMode}
              hasProjects={projects.length > 0}
              onExport={handleExport}
              onAddProject={() => setAddProjectDialogOpen(true)}
              warmupSeconds={warmupSeconds}
              averagingDurationSeconds={averagingDurationSeconds}
              onSaveSettings={handleSaveSettings}
              onResetData={handleResetData}
            />
          ) : (
            <CoordinatesTopBar
              currentProjectName={currentProjectName}
              onExport={handleExportCurrentProject}
              onAddCoordinate={() => setAddDialogOpen(true)}
              onRenameProject={handleRenameProject}
              onExitProject={handleExitProject}
            />
          )}
        </Box>
        {error != null && (
          <Alert
            severity="error"
            onClose={clearError}
            sx={{ mb: 2, flexShrink: 0 }}
          >
            {error}
          </Alert>
        )}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          {selectedProjectId == null ? (
            <ProjectList
              projects={projects}
              onSelectProject={handleSelectProject}
              onAddProjectClick={() => setAddProjectDialogOpen(true)}
              onDeleteProject={handleDeleteProject}
              onExportProject={handleExportProject}
              onUpdateProjectNote={handleUpdateProjectNote}
            />
          ) : (
            <CoordinateForm
              coordinates={coordinates}
              projectId={selectedProjectId}
              nextSuggestedName={nextSuggestedName}
              addDialogOpen={addDialogOpen}
              onAddDialogOpen={() => setAddDialogOpen(true)}
              onAddDialogClose={() => setAddDialogOpen(false)}
              onAddCoordinate={addCoordinate}
              onTransform={transformCoordinateById}
              onProject={projectFromCoordinate}
              onRename={renameCoordinate}
              onDelete={deleteCoordinate}
              onUpdateNote={updateCoordinateNote}
              onFindBearing={findBearingBetweenCoordinates}
              onExitProject={handleExitProject}
              warmupSeconds={warmupSeconds}
              averagingDurationSeconds={averagingDurationSeconds}
            />
          )}
        </Box>
      </Box>
      <AddProjectDialog
        open={addProjectDialogOpen}
        onClose={() => setAddProjectDialogOpen(false)}
        onAddProject={handleAddProject}
      />
    </ThemeProvider>
  );
}
