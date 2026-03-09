import { db, type CoordinateRecord, type ProjectRecord } from "../db";
import { loadCrs } from "../crs";
import { buildCsv } from "../utils/csv";

function formatLocalDateTime(dateLike: string | Date | null | undefined): string {
  if (!dateLike) return "";
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number): string => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CSV_HEADERS: (string | number)[] = [
  "ProjectId",
  "ProjectName",
  "ProjectNotes",
  "ProjectCreatedDateTime",
  "Id",
  "Name",
  "CRS Code",
  "CRS Name",
  "X",
  "Y",
  "Notes",
  "CoordinateCreateDateTime",
];

async function loadCrsNames(
  codes: Set<string>,
): Promise<Record<string, string>> {
  const crsNameByCode: Record<string, string> = {};
  await Promise.all(
    Array.from(codes).map(async (code) => {
      const info = await loadCrs(code);
      crsNameByCode[code] = info?.name ?? "";
    }),
  );
  return crsNameByCode;
}

function buildCoordinateRow(
  coordinate: CoordinateRecord,
  project: ProjectRecord | undefined,
  crsNameByCode: Record<string, string>,
): (string | number)[] {
  return [
    coordinate.projectId,
    project?.projectName ?? "",
    project?.notes ?? "",
    project?.createdDateTime
      ? formatLocalDateTime(project.createdDateTime)
      : "",
    coordinate.id,
    coordinate.name,
    coordinate.crsCode,
    crsNameByCode[coordinate.crsCode] ?? "",
    coordinate.x,
    coordinate.y,
    coordinate.notes ?? "",
    coordinate.createdDateTime
      ? formatLocalDateTime(coordinate.createdDateTime)
      : "",
  ];
}

export async function exportAllCoordinatesToCsv(): Promise<void> {
  const allProjects = await db.projects.orderBy("sortOrder").toArray();
  const allCoordinates = await db.coordinates.toArray();
  const projectById = new Map(allProjects.map((p) => [p.projectId, p]));
  const codes = new Set(allCoordinates.map((c) => c.crsCode));
  const crsNameByCode = await loadCrsNames(codes);

  const sortedCoordinates = allCoordinates.slice().sort((a, b) => {
    const projectA = projectById.get(a.projectId);
    const projectB = projectById.get(b.projectId);
    const projectDateA = projectA?.createdDateTime
      ? new Date(projectA.createdDateTime).getTime()
      : 0;
    const projectDateB = projectB?.createdDateTime
      ? new Date(projectB.createdDateTime).getTime()
      : 0;
    if (projectDateA !== projectDateB) {
      return projectDateA - projectDateB;
    }
    const coordDateA = a.createdDateTime
      ? new Date(a.createdDateTime).getTime()
      : 0;
    const coordDateB = b.createdDateTime
      ? new Date(b.createdDateTime).getTime()
      : 0;
    return coordDateA - coordDateB;
  });

  const rows = sortedCoordinates.map((coordinate) =>
    buildCoordinateRow(
      coordinate,
      projectById.get(coordinate.projectId),
      crsNameByCode,
    ),
  );

  const csv = buildCsv(CSV_HEADERS, rows);
  const filename = `coordinates-export-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  downloadCsv(filename, csv);
}

export async function exportProjectCoordinatesToCsv(
  projectId: string,
): Promise<void> {
  const proj = await db.projects.get(projectId);
  if (!proj) return;

  const projectCoordinates = await db.coordinates
    .where("projectId")
    .equals(projectId)
    .toArray();

  const sortedProjectCoordinates = projectCoordinates.slice().sort((a, b) => {
    const coordDateA = a.createdDateTime
      ? new Date(a.createdDateTime).getTime()
      : 0;
    const coordDateB = b.createdDateTime
      ? new Date(b.createdDateTime).getTime()
      : 0;
    return coordDateA - coordDateB;
  });

  const codes = new Set(sortedProjectCoordinates.map((c) => c.crsCode));
  const crsNameByCode = await loadCrsNames(codes);

  const rows = sortedProjectCoordinates.map((coordinate) =>
    buildCoordinateRow(coordinate, proj, crsNameByCode),
  );

  const csv = buildCsv(CSV_HEADERS, rows);
  const safeName = proj.projectName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const filename = `coordinates-export-${safeName}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  downloadCsv(filename, csv);
}

