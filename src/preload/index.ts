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

const api: InkbloomApi = {
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
};

contextBridge.exposeInMainWorld("inkbloom", api);
