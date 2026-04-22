import { ipcMain } from "electron";

import type {
  BibleItemInput,
  BibleItemType,
  ChapterInput,
  WorkflowSignals,
} from "../shared/contracts";
import { createWorkspaceRepository } from "./database/repositories/workspace-repository";
import { sendChatTurn } from "./services/chat-service";
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
        };
      },
    ) => sendChatTurn(payload),
  );
}
