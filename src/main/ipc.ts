import { app, ipcMain } from "electron";
import { join } from "node:path";

import type {
  BibleItemInput,
  BibleItemType,
  ChapterInput,
  WorkflowSignals,
} from "../shared/contracts";
import { createWorkspaceRepository } from "./database/repositories/workspace-repository";
import { sendChatTurn } from "./services/chat-service";
import { saveChapterDraft } from "./services/manuscript-service";
import { getWorkflowSnapshot } from "./services/workflow-service";

export function registerWorkspaceIpcHandlers(dbPath: string) {
  const workspaceRepository = createWorkspaceRepository(dbPath);
  const currentProjectRoot = join(app.getPath("userData"), "task-7-current-project");

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

  ipcMain.handle(
    "manuscript:saveChapterDraft",
    async (_event, payload: { relativeManuscriptPath: string; content: string }) =>
      saveChapterDraft({
        projectRoot: currentProjectRoot,
        relativeManuscriptPath: payload.relativeManuscriptPath,
        content: payload.content,
      }),
  );

  ipcMain.handle(
    "chat:send",
    async (
      _event,
      payload: {
        mode: "organize" | "explore" | "check" | "task";
        content: string;
        context?: {
          activeBibleType?: BibleItemType;
          stage?: "ideation" | "foundation" | "outline" | "drafting" | "revision" | "export";
          characters?: string[];
          styleSummary?: string;
          chapterTitle?: string;
        };
      },
    ) => sendChatTurn(payload),
  );
}
