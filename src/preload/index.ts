import { contextBridge, ipcRenderer } from "electron";

import type {
  BibleItemInput,
  BibleItemType,
  ChapterInput,
  InkbloomApi,
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
};

contextBridge.exposeInMainWorld("inkbloom", api);
