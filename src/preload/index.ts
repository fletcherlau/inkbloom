import { contextBridge, ipcRenderer } from "electron";

import type {
  BibleItemInput,
  BibleItemType,
  ChapterInput,
  InkbloomApi,
  WorkflowSignals,
  WorkspaceSummary,
} from "../shared/contracts";

export type { WorkspaceSummary };

type ChatSendInput = {
  mode: "organize" | "explore" | "check" | "task";
  content: string;
  context?: {
    activeBibleType?: BibleItemType;
    stage?: "ideation" | "foundation" | "outline" | "drafting" | "revision" | "export";
  };
};

type ChatSendResult = {
  assistantMessage: {
    role: "assistant";
    content: string;
  };
  skillResult: {
    skill: "capture_braindump" | "next_step_guide" | "consistency_check" | "shape_synopsis";
    summary: string;
    payload: Record<string, string>;
  };
};

type PreloadApi = InkbloomApi & {
  sendChatTurn(input: ChatSendInput): Promise<ChatSendResult>;
};

const api: PreloadApi = {
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
  sendChatTurn(input: ChatSendInput) {
    return ipcRenderer.invoke("chat:send", input);
  },
};

contextBridge.exposeInMainWorld("inkbloom", api);
