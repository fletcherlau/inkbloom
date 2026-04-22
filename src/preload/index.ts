import { contextBridge } from "electron";

import type { WorkspaceSummary } from "@shared/contracts";

export type { WorkspaceSummary };

contextBridge.exposeInMainWorld("inkbloom", {});
