import { app, BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { registerWorkspaceIpcHandlers } from "./ipc";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: fileURLToPath(new URL("../preload/index.mjs", import.meta.url)),
    },
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    await window.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    await window.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  registerWorkspaceIpcHandlers(join(app.getPath("userData"), "project.db"));
  await createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
