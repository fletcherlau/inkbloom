import { contextBridge, ipcRenderer } from "electron";

import type {
  BibleItemInput,
  BibleItemType,
  ChapterInput,
  CreateBookInput,
  DeleteBookInput,
  GlobalLlmSettings,
  InkbloomApi,
  LlmConnectionTestResult,
  UpdateBookInput,
  WorkflowSignals,
  WorkspaceSummary,
} from "../shared/contracts";

export type { WorkspaceSummary };

type ChatSendInput = {
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
};

type ChatSendResult = {
  assistantMessage: {
    role: "assistant";
    content: string;
  };
  saveTargets?: readonly ("story-bible" | "chapter" | "task")[];
  skillResult: {
    skill: "capture_braindump" | "next_step_guide" | "consistency_check" | "shape_synopsis";
    summary: string;
    payload: Record<string, string>;
  };
};

type PreloadApi = InkbloomApi & {
  saveChapterDraft(input: {
    relativeManuscriptPath: string;
    content: string;
  }): Promise<{ filePath: string }>;
  sendChatTurn(input: ChatSendInput): Promise<ChatSendResult>;
};

const api: PreloadApi = {
  listBooks() {
    return ipcRenderer.invoke("library:listBooks");
  },
  createBook(input: CreateBookInput) {
    return ipcRenderer.invoke("library:createBook", input);
  },
  updateBook(input: UpdateBookInput) {
    return ipcRenderer.invoke("library:updateBook", input);
  },
  deleteBook(input: DeleteBookInput) {
    return ipcRenderer.invoke("library:deleteBook", input);
  },
  getGlobalLlmSettings() {
    return ipcRenderer.invoke("settings:getGlobalLlm");
  },
  saveGlobalLlmSettings(input: GlobalLlmSettings) {
    return ipcRenderer.invoke("settings:saveGlobalLlm", input);
  },
  testGlobalLlmConnection(input: GlobalLlmSettings): Promise<LlmConnectionTestResult> {
    return ipcRenderer.invoke("settings:testGlobalLlm", input);
  },
  listBibleItems(projectId: string, type: BibleItemType) {
    return ipcRenderer.invoke("workspace:listBibleItems", { projectId, type });
  },
  createBibleItem(input: BibleItemInput) {
    return ipcRenderer.invoke("workspace:createBibleItem", input);
  },
  createChapter(input: ChapterInput) {
    return ipcRenderer.invoke("workspace:createChapter", input);
  },
  getWorkflowSnapshot(signals: WorkflowSignals) {
    return ipcRenderer.invoke("workflow:getSnapshot", signals);
  },
  saveChapterDraft(input: {
    relativeManuscriptPath: string;
    content: string;
  }) {
    return ipcRenderer.invoke("manuscript:saveChapterDraft", input);
  },
  sendChatTurn(input: ChatSendInput) {
    return ipcRenderer.invoke("chat:send", input);
  },
};

contextBridge.exposeInMainWorld("inkbloom", api);
