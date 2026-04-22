import { ipcMain } from "electron";

import type {
  BibleItemInput,
  BibleItemType,
  ChapterInput,
  WorkflowSignals,
} from "../shared/contracts";
import { createWorkspaceRepository } from "./database/repositories/workspace-repository";
import { getWorkflowSnapshot } from "./services/workflow-service";

export function registerWorkspaceIpcHandlers(dbPath: string) {
  const workspaceRepository = createWorkspaceRepository(dbPath);

  ipcMain.handle(
    "workspace:listBibleItems",
    async (_event, payload: { projectId: string; type: BibleItemType }) =>
      workspaceRepository.listBibleItems(payload.projectId, payload.type),
  );

  ipcMain.handle("workspace:createBibleItem", async (_event, payload: BibleItemInput) =>
    workspaceRepository.createBibleItem(payload),
  );

  ipcMain.handle("workspace:createChapter", async (_event, payload: ChapterInput) =>
    workspaceRepository.createChapter(payload),
  );

  ipcMain.handle("workflow:getSnapshot", async (_event, payload: WorkflowSignals) =>
    getWorkflowSnapshot(payload),
  );
}
