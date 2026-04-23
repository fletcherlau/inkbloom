import { app, ipcMain } from "electron";
import { join } from "node:path";

import type {
  BibleItemInput,
  BibleItemType,
  ChapterInput,
  CreateBookInput,
  DeleteBookInput,
  GlobalLlmSettings,
  UpdateBookInput,
  WorkflowSignals,
} from "../shared/contracts";
import { createWorkspaceRepository } from "./database/repositories/workspace-repository";
import { createLibraryService } from "./services/library-service";
import { createChatService } from "./services/chat-service";
import { saveChapterDraft } from "./services/manuscript-service";
import { createSettingsService } from "./services/settings-service";
import { getWorkflowSnapshot } from "./services/workflow-service";

export function registerWorkspaceIpcHandlers(dbPath: string) {
  const workspaceRepository = createWorkspaceRepository(dbPath);
  const currentProjectRoot = join(app.getPath("userData"), "task-7-current-project");
  const libraryService = createLibraryService({
    dbPath,
    libraryRoot: join(app.getPath("userData"), "books"),
  });
  const settingsService = createSettingsService(dbPath);
  const chatService = createChatService(dbPath);

  ipcMain.handle("library:listBooks", async () => libraryService.listBooks());

  ipcMain.handle("library:createBook", async (_event, payload: CreateBookInput) =>
    libraryService.createBook(payload),
  );

  ipcMain.handle("library:updateBook", async (_event, payload: UpdateBookInput) =>
    libraryService.updateBook(payload),
  );

  ipcMain.handle("library:deleteBook", async (_event, payload: DeleteBookInput) =>
    libraryService.deleteBook(payload.id),
  );

  ipcMain.handle("settings:getGlobalLlm", async () => settingsService.getGlobalLlmSettings());

  ipcMain.handle("settings:saveGlobalLlm", async (_event, payload: GlobalLlmSettings) =>
    settingsService.saveGlobalLlmSettings(payload),
  );

  ipcMain.handle("settings:testGlobalLlm", async (_event, payload: GlobalLlmSettings) =>
    settingsService.testGlobalLlmConnection(payload),
  );

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
        projectId?: string;
        context?: {
          activeBibleType?: BibleItemType;
          stage?: "ideation" | "foundation" | "outline" | "drafting" | "revision" | "export";
          characters?: string[];
          styleSummary?: string;
          chapterTitle?: string;
        };
      },
    ) => chatService.sendChatTurn(payload),
  );
}
