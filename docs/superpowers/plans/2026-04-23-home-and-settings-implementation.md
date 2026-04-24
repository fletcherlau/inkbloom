# Inkbloom Home And Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a startup homepage for book management and a global LLM settings page, while keeping the existing writing workspace intact behind an explicit entry flow.

**Architecture:** Keep the current Electron main/preload/renderer split. Store the global book index in the existing app-level SQLite database, store global LLM settings in the same app database as key-value configuration, and drive the renderer with a small top-level app store that switches between `home`, `settings`, and `workspace` views.

**Tech Stack:** Electron, React, TypeScript, Vite, node:sqlite, Vitest, React Testing Library

---

## Proposed File Structure

### Shared Contracts

- `src/shared/contracts.ts`
  Add app-level types for home/settings navigation, book summaries, global LLM settings, and the new preload API methods.

### Main Process

- `src/main/index.ts`
  Continue to bootstrap the app database and register IPC. No structural rewrite.
- `src/main/ipc.ts`
  Add IPC handlers for listing/creating/updating/deleting books and for loading/saving global LLM settings.
- `src/main/project-files.ts`
  Reuse the existing scaffold helper for new books. Add a small delete helper for removing a project directory safely.
- `src/main/database/schema.ts`
  Add an `app_settings` table for global configuration.
- `src/main/database/schema.test.ts`
  Add schema coverage for `app_settings`.
- `src/main/database/repositories/project-repository.ts`
  Add `update`, `delete`, and keep `list` as the canonical book index source.
- `src/main/database/repositories/project-repository.test.ts`
  Add repository tests for project update/delete behavior.
- `src/main/database/repositories/app-settings-repository.ts`
  New focused repository for app-level key-value settings.
- `src/main/database/repositories/app-settings-repository.test.ts`
  Cover default read and overwrite save behavior.
- `src/main/services/library-service.ts`
  New service for book CRUD orchestration: create scaffold, write project record, rename, delete record + directory.
- `src/main/services/library-service.test.ts`
  Cover success and rollback/error behavior for create/delete flows.
- `src/main/services/settings-service.ts`
  New service for loading/saving global LLM settings through `app_settings`.
- `src/main/services/settings-service.test.ts`
  Cover default values and persistence.

### Preload

- `src/preload/index.ts`
  Expose the new app APIs to the renderer.

### Renderer

- `src/renderer/app.tsx`
  Stop rendering the workspace unconditionally. Render `HomeScreen`, `SettingsScreen`, or `AppShell` based on top-level app state.
- `src/renderer/app.test.tsx`
  Update the smoke test to assert the startup homepage instead of the old direct-workspace shell.
- `src/renderer/stores/app-store.ts`
  New top-level store for view state, selected book, book list, settings snapshot, dialog state, and navigation actions.
- `src/renderer/stores/app-store.test.ts`
  Cover navigation and optimistic state transitions that do not require DOM rendering.
- `src/renderer/stores/workspace-store.ts`
  Add an explicit initializer/reset API so the workspace can be entered with a selected book and exited cleanly back to home.
- `src/renderer/components/layout/app-shell.tsx`
  Add the “返回首页” entry and read the active book name from store/bootstrap state instead of assuming a hard-coded workspace.
- `src/renderer/components/home/home-screen.tsx`
  New homepage composition component.
- `src/renderer/components/home/home-screen.test.tsx`
  Cover empty state and populated shelf rendering.
- `src/renderer/components/home/home-header.tsx`
  Header with title, short copy, new-book action, settings entry.
- `src/renderer/components/home/book-grid.tsx`
  Grid wrapper for book cards.
- `src/renderer/components/home/book-card.tsx`
  Individual book card with enter/edit/delete actions.
- `src/renderer/components/home/book-dialog.tsx`
  Reusable create/edit dialog component.
- `src/renderer/components/home/delete-book-dialog.tsx`
  Explicit destructive confirmation dialog.
- `src/renderer/components/settings/settings-screen.tsx`
  Global LLM settings form with load/save/back actions.
- `src/renderer/components/settings/settings-screen.test.tsx`
  Cover initial render and save submission.

## Milestone Breakdown

1. App data layer for books and global settings
2. Top-level navigation state between home/settings/workspace
3. Homepage UI and book CRUD flows
4. Settings UI and workspace return-to-home flow

## Task 1: Add App-Level Data APIs For Books And Settings

**Files:**
- Modify: `src/shared/contracts.ts`
- Modify: `src/main/database/schema.ts`
- Modify: `src/main/database/schema.test.ts`
- Modify: `src/main/database/repositories/project-repository.ts`
- Create: `src/main/database/repositories/project-repository.test.ts`
- Create: `src/main/database/repositories/app-settings-repository.ts`
- Create: `src/main/database/repositories/app-settings-repository.test.ts`
- Modify: `src/main/project-files.ts`
- Create: `src/main/services/library-service.ts`
- Create: `src/main/services/library-service.test.ts`
- Create: `src/main/services/settings-service.ts`
- Create: `src/main/services/settings-service.test.ts`

- [ ] **Step 1: Write the failing repository and service tests**

```ts
// src/main/database/repositories/app-settings-repository.test.ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { openProjectDatabase } from "../schema";
import { AppSettingsRepository } from "./app-settings-repository";

describe("app settings repository", () => {
  it("returns undefined for an unset key", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-"));
    const db = openProjectDatabase(join(root, "app.db"));

    expect(new AppSettingsRepository(db).get("llm")).toBeUndefined();
  });

  it("upserts the serialized LLM settings payload", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-"));
    const db = openProjectDatabase(join(root, "app.db"));
    const repo = new AppSettingsRepository(db);

    repo.set("llm", JSON.stringify({ provider: "openai", model: "gpt-5.4" }));

    expect(repo.get("llm")).toContain("gpt-5.4");
  });
});
```

```ts
// src/main/services/library-service.test.ts
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { openProjectDatabase } from "../database/schema";
import { createLibraryService } from "./library-service";

describe("library service", () => {
  it("creates a project scaffold, records it, and returns the project summary", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-library-"));
    const dbPath = join(root, "app.db");
    const service = createLibraryService({
      dbPath,
      libraryRoot: join(root, "books"),
    });

    const project = service.createBook({ title: "长夜港" });

    expect(project.name).toBe("长夜港");
    expect(existsSync(join(project.rootPath, ".inkbloom", "settings.json"))).toBe(true);
    expect(service.listBooks()).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:
- `pnpm vitest src/main/database/repositories/app-settings-repository.test.ts --runInBand`
- `pnpm vitest src/main/services/library-service.test.ts --runInBand`

Expected:
- FAIL because the repository/service files and schema support do not exist yet

- [ ] **Step 3: Implement the minimal app data layer**

```ts
// src/shared/contracts.ts
export interface BookSummary {
  id: string;
  title: string;
  rootPath: string;
  updatedAt: string;
}

export interface GlobalLlmSettings {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}
```

```ts
// src/main/database/repositories/app-settings-repository.ts
import type { DatabaseSync } from "node:sqlite";

export class AppSettingsRepository {
  constructor(private readonly database: DatabaseSync) {}

  get(key: string) {
    const row = this.database
      .prepare(`SELECT value FROM app_settings WHERE key = ?`)
      .get(key) as { value: string } | undefined;

    return row?.value;
  }

  set(key: string, value: string) {
    this.database
      .prepare(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (@key, @value, @updatedAt)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run({ key, value, updatedAt: new Date().toISOString() });
  }
}
```

```ts
// src/main/services/settings-service.ts
const DEFAULT_SETTINGS = {
  provider: "",
  baseUrl: "",
  apiKey: "",
  model: "",
};

export function createSettingsService(dbPath: string) {
  return {
    getGlobalLlmSettings() {
      // read JSON from app_settings.llm or return DEFAULT_SETTINGS
    },
    saveGlobalLlmSettings(input: GlobalLlmSettings) {
      // serialize and persist
    },
  };
}
```

Implementation notes:
- Extend `SCHEMA_SQL` with `app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`.
- In `ProjectRepository`, add:
  - `updateName(id: string, name: string, updatedAt: string)`
  - `delete(id: string)`
- In `project-files.ts`, add a safe `deleteProjectScaffold(projectPath: string)` helper using `rmSync(projectPath, { recursive: true, force: false })`, but guard that the target is under the configured library root.
- In `library-service.ts`, keep the create flow atomic enough for MVP:
  - create scaffold first
  - insert project record second
  - if insert fails, delete the scaffold before rethrowing

- [ ] **Step 4: Run the data-layer tests and the existing schema suite**

Run:
- `pnpm vitest src/main/database/schema.test.ts src/main/database/repositories/project-repository.test.ts src/main/database/repositories/app-settings-repository.test.ts src/main/services/library-service.test.ts src/main/services/settings-service.test.ts --runInBand`

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/contracts.ts src/main/database/schema.ts src/main/database/schema.test.ts src/main/database/repositories/project-repository.ts src/main/database/repositories/project-repository.test.ts src/main/database/repositories/app-settings-repository.ts src/main/database/repositories/app-settings-repository.test.ts src/main/project-files.ts src/main/services/library-service.ts src/main/services/library-service.test.ts src/main/services/settings-service.ts src/main/services/settings-service.test.ts
git commit -m "feat: add app data layer for books and llm settings"
```

## Task 2: Expose The New App APIs Through IPC And Preload

**Files:**
- Modify: `src/shared/contracts.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Write the failing preload contract assertions**

```ts
// add to src/renderer/app.test.tsx or a new preload-facing renderer test
expect(window.inkbloom.listBooks).toBeTypeOf("function");
expect(window.inkbloom.getGlobalLlmSettings).toBeTypeOf("function");
```

If direct `window.inkbloom` assertions are awkward in jsdom, instead create a contract-level TypeScript check by using the methods inside the new app store test and let `tsc --noEmit` fail before implementation.

- [ ] **Step 2: Run typecheck to verify the new API surface is missing**

Run:
- `pnpm lint`

Expected:
- FAIL with missing methods on `InkbloomApi`

- [ ] **Step 3: Implement IPC and preload wiring**

```ts
// src/shared/contracts.ts
export interface InkbloomApi {
  listBooks(): Promise<BookSummary[]>;
  createBook(input: { title: string }): Promise<BookSummary>;
  updateBook(input: { id: string; title: string }): Promise<BookSummary>;
  deleteBook(input: { id: string }): Promise<void>;
  getGlobalLlmSettings(): Promise<GlobalLlmSettings>;
  saveGlobalLlmSettings(input: GlobalLlmSettings): Promise<GlobalLlmSettings>;

  listBibleItems(projectId: string, type: BibleItemType): Promise<BibleItemRecord[]>;
  createBibleItem(input: BibleItemInput): Promise<BibleItemRecord>;
  createChapter(input: ChapterInput): Promise<ChapterRecord>;
  getWorkflowSnapshot(signals: WorkflowSignals): Promise<WorkflowSnapshot>;
}
```

```ts
// src/main/ipc.ts
ipcMain.handle("library:listBooks", async () => libraryService.listBooks());
ipcMain.handle("library:createBook", async (_event, payload: { title: string }) =>
  libraryService.createBook(payload),
);
ipcMain.handle("library:updateBook", async (_event, payload: { id: string; title: string }) =>
  libraryService.updateBook(payload),
);
ipcMain.handle("library:deleteBook", async (_event, payload: { id: string }) =>
  libraryService.deleteBook(payload.id),
);
ipcMain.handle("settings:getGlobalLlm", async () => settingsService.getGlobalLlmSettings());
ipcMain.handle("settings:saveGlobalLlm", async (_event, payload: GlobalLlmSettings) =>
  settingsService.saveGlobalLlmSettings(payload),
);
```

```ts
// src/preload/index.ts
const api: PreloadApi = {
  listBooks() {
    return ipcRenderer.invoke("library:listBooks");
  },
  createBook(input) {
    return ipcRenderer.invoke("library:createBook", input);
  },
  updateBook(input) {
    return ipcRenderer.invoke("library:updateBook", input);
  },
  deleteBook(input) {
    return ipcRenderer.invoke("library:deleteBook", input);
  },
  getGlobalLlmSettings() {
    return ipcRenderer.invoke("settings:getGlobalLlm");
  },
  saveGlobalLlmSettings(input) {
    return ipcRenderer.invoke("settings:saveGlobalLlm", input);
  },
  // keep existing workspace/chat APIs
};
```

- [ ] **Step 4: Run typecheck and the smoke tests**

Run:
- `pnpm lint`
- `pnpm vitest src/renderer/app.test.tsx --runInBand`

Expected:
- `lint` PASS
- renderer smoke test still PASS or fails only because the startup UI will be updated in the next task

- [ ] **Step 5: Commit**

```bash
git add src/shared/contracts.ts src/main/ipc.ts src/preload/index.ts
git commit -m "feat: expose home and settings app APIs"
```

## Task 3: Add Top-Level App State And Homepage UI

**Files:**
- Modify: `src/renderer/app.tsx`
- Modify: `src/renderer/app.test.tsx`
- Create: `src/renderer/stores/app-store.ts`
- Create: `src/renderer/stores/app-store.test.ts`
- Modify: `src/renderer/stores/workspace-store.ts`
- Create: `src/renderer/components/home/home-screen.tsx`
- Create: `src/renderer/components/home/home-screen.test.tsx`
- Create: `src/renderer/components/home/home-header.tsx`
- Create: `src/renderer/components/home/book-grid.tsx`
- Create: `src/renderer/components/home/book-card.tsx`
- Create: `src/renderer/components/home/book-dialog.tsx`
- Create: `src/renderer/components/home/delete-book-dialog.tsx`

- [ ] **Step 1: Write the failing renderer tests for the new startup flow**

```tsx
// src/renderer/app.test.tsx
it("renders the home screen on startup", async () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: "Inkbloom" })).toBeInTheDocument();
  expect(screen.getByText("新建第一本书")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "设置" })).toBeInTheDocument();
});
```

```tsx
// src/renderer/components/home/home-screen.test.tsx
it("renders a book card and emits the enter/edit/delete actions", () => {
  render(
    <HomeScreen
      books={[
        { id: "book-1", title: "长夜港", rootPath: "/tmp/长夜港", updatedAt: "2026-04-23T00:00:00.000Z" },
      ]}
      // pass mocked handlers
    />,
  );

  expect(screen.getByText("长夜港")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "进入创作" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the renderer tests to verify the current app fails**

Run:
- `pnpm vitest src/renderer/app.test.tsx src/renderer/components/home/home-screen.test.tsx --runInBand`

Expected:
- FAIL because `App` still renders the workspace shell directly and the home components do not exist

- [ ] **Step 3: Implement top-level app store and homepage components**

```ts
// src/renderer/stores/app-store.ts
export type AppView = "home" | "settings" | "workspace";

type AppState = {
  view: AppView;
  books: readonly BookSummary[];
  selectedBookId: string | null;
  isBookDialogOpen: boolean;
  editingBookId: string | null;
  deletingBookId: string | null;
};
```

```tsx
// src/renderer/app.tsx
export function App() {
  const view = useAppStore((state) => state.view);

  if (view === "home") {
    return <HomeScreen />;
  }

  if (view === "settings") {
    return <SettingsScreen />;
  }

  return <AppShell />;
}
```

```ts
// src/renderer/stores/workspace-store.ts
type WorkspaceState = {
  projectId: string | null;
  projectName: string;
  // existing fields...
};

initializeWorkspace(input: { projectId: string; projectName: string }) {
  setState({
    projectId: input.projectId,
    projectName: input.projectName,
    // preserve the rest of createInitialState defaults
  });
}
```

Implementation notes:
- Keep the store small and explicit. Do not move book CRUD side effects into random components.
- Let `app-store.ts` own:
  - initial `listBooks()` bootstrap
  - `openSettings()`
  - `enterBook(book)`
  - `createBook(title)` -> update local books -> initialize workspace -> switch to `workspace`
  - `updateBook(id, title)` -> refresh local list
  - `deleteBook(id)` -> refresh local list and close dialog
- In `HomeScreen`, show:
  - empty state copy when `books.length === 0`
  - otherwise render `BookGrid`
- Keep dialog components controlled. Do not hide form submission logic inside card components.

- [ ] **Step 4: Run renderer tests and typecheck**

Run:
- `pnpm vitest src/renderer/app.test.tsx src/renderer/components/home/home-screen.test.tsx src/renderer/stores/app-store.test.ts --runInBand`
- `pnpm lint`

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/app.tsx src/renderer/app.test.tsx src/renderer/stores/app-store.ts src/renderer/stores/app-store.test.ts src/renderer/stores/workspace-store.ts src/renderer/components/home/home-screen.tsx src/renderer/components/home/home-screen.test.tsx src/renderer/components/home/home-header.tsx src/renderer/components/home/book-grid.tsx src/renderer/components/home/book-card.tsx src/renderer/components/home/book-dialog.tsx src/renderer/components/home/delete-book-dialog.tsx
git commit -m "feat: add home screen and book management flow"
```

## Task 4: Add Global Settings UI And Workspace Return Flow

**Files:**
- Create: `src/renderer/components/settings/settings-screen.tsx`
- Create: `src/renderer/components/settings/settings-screen.test.tsx`
- Modify: `src/renderer/components/layout/app-shell.tsx`
- Modify: `src/renderer/stores/app-store.ts`
- Modify: `src/renderer/stores/workspace-store.ts`

- [ ] **Step 1: Write the failing tests for settings and return-to-home**

```tsx
// src/renderer/components/settings/settings-screen.test.tsx
it("loads and saves the global LLM settings form", async () => {
  render(<SettingsScreen />);

  expect(screen.getByLabelText("Provider")).toHaveValue("");
  await userEvent.type(screen.getByLabelText("Model"), "gpt-5.4");
  await userEvent.click(screen.getByRole("button", { name: "保存设置" }));

  expect(window.inkbloom.saveGlobalLlmSettings).toHaveBeenCalled();
});
```

```tsx
// add to src/renderer/app.test.tsx
it("returns from workspace to home when the back action is triggered", async () => {
  render(<App />);

  // bootstrap a selected book through the app store
  await userEvent.click(screen.getByRole("button", { name: "返回首页" }));
  expect(screen.getByText("新建书籍")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the renderer tests to verify they fail**

Run:
- `pnpm vitest src/renderer/components/settings/settings-screen.test.tsx src/renderer/app.test.tsx --runInBand`

Expected:
- FAIL because there is no settings screen and `AppShell` has no back action

- [ ] **Step 3: Implement settings screen and workspace exit**

```tsx
// src/renderer/components/settings/settings-screen.tsx
export function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const saveSettings = useAppStore((state) => state.saveSettings);
  const goHome = useAppStore((state) => state.goHome);

  return (
    <main>
      <h1>LLM 设置</h1>
      <form onSubmit={handleSubmit}>
        {/* provider, baseUrl, apiKey, model */}
        <button type="submit">保存设置</button>
        <button type="button" onClick={goHome}>返回首页</button>
      </form>
    </main>
  );
}
```

```tsx
// src/renderer/components/layout/app-shell.tsx
<header style={styles.workspaceHeader}>
  <button type="button" onClick={appStore.goHome}>
    返回首页
  </button>
  <span>{projectName}</span>
</header>
```

Implementation notes:
- On app bootstrap, `app-store` should also load `getGlobalLlmSettings()`.
- If all LLM fields are empty, show a non-blocking banner on `HomeScreen` and/or `AppShell`, for example:
  - `尚未配置 LLM，AI 功能暂不可用`
- Keep save behavior simple:
  - submit form
  - call preload API
  - update store snapshot
  - show lightweight success text in-page
  - remain on settings page until user clicks back

- [ ] **Step 4: Run the full relevant test suite**

Run:
- `pnpm vitest src/renderer/app.test.tsx src/renderer/components/home/home-screen.test.tsx src/renderer/components/settings/settings-screen.test.tsx src/renderer/stores/app-store.test.ts src/main/database/schema.test.ts src/main/database/repositories/project-repository.test.ts src/main/database/repositories/app-settings-repository.test.ts src/main/services/library-service.test.ts src/main/services/settings-service.test.ts --runInBand`
- `pnpm lint`

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/settings/settings-screen.tsx src/renderer/components/settings/settings-screen.test.tsx src/renderer/components/layout/app-shell.tsx src/renderer/stores/app-store.ts src/renderer/stores/workspace-store.ts src/renderer/app.tsx src/renderer/app.test.tsx
git commit -m "feat: add global llm settings and workspace home navigation"
```

## Task 5: Verify Manually In Electron

**Files:**
- Modify: none

- [ ] **Step 1: Start the app locally**

Run:
- `pnpm dev`

Expected:
- Electron window opens to the new homepage instead of the old direct workspace

- [ ] **Step 2: Verify empty-state and create flow**

Manual checklist:
- Home shows `新建第一本书`
- Home shows `设置`
- Creating a new book creates the project scaffold and enters the workspace immediately
- Workspace header shows `返回首页`

- [ ] **Step 3: Verify edit/delete flow**

Manual checklist:
- Edit updates the book title on the home card
- Delete asks for confirmation
- Confirm delete removes the card and local directory

- [ ] **Step 4: Verify settings flow**

Manual checklist:
- Settings loads previously saved values
- Saving without leaving the page shows success feedback
- Returning home preserves the saved values
- If LLM is unconfigured, the non-blocking warning appears on home and/or workspace

- [ ] **Step 5: Commit any last-mile fixes**

```bash
git add src
git commit -m "fix: polish home and settings manual verification issues"
```
