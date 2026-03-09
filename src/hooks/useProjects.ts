import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ProjectRecord } from "../db";
import { generateId } from "../utils/naming";

export interface UseProjectsResult {
  projects: ProjectRecord[];
  addProject: (projectName: string, notes: string) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  updateProjectNote: (projectId: string, notes: string) => void;
  resetAllData: () => Promise<void>;
}

export function useProjects(): UseProjectsResult {
  const projects =
    useLiveQuery(
      () => db.projects.orderBy("sortOrder").toArray(),
      [],
      [] as ProjectRecord[],
    ) ?? [];

  const addProject = useCallback(
    async (projectName: string, notes: string) => {
      const projectId = generateId();
      await db.projects.add({
        projectId,
        projectName,
        ...(notes !== "" ? { notes } : {}),
        createdDateTime: new Date().toISOString(),
        sortOrder: Date.now(),
      });
      return projectId;
    },
    [],
  );

  const deleteProject = useCallback(async (projectId: string) => {
    await db.photos.where("projectId").equals(projectId).delete();
    await db.coordinates.where("projectId").equals(projectId).delete();
    await db.projects.delete(projectId);
  }, []);

  const updateProjectNote = useCallback((projectId: string, notes: string) => {
    void db.projects.update(projectId, { notes });
  }, []);

  const resetAllData = useCallback(async () => {
    await db.coordinates.clear();
    await db.projects.clear();
  }, []);

  return {
    projects,
    addProject,
    deleteProject,
    updateProjectNote,
    resetAllData,
  };
}

