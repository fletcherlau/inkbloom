# Inkbloom MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Inkbloom desktop MVP: a local-first, chat-first long-form fiction writing workbench with Story Bible storage, workflow state, guided next steps, and chapter drafting.

**Architecture:** Use Electron as the desktop shell, with a React renderer and a Node-backed local service layer inside the Electron main process. Persist project state in a local SQLite database under `.inkbloom/project.db`, keep manuscript content in project files, and expose all AI orchestration through a preload API so the renderer never talks to model providers directly.

**Tech Stack:** Electron, React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Tiptap, better-sqlite3, Zustand, Zod, Vitest, React Testing Library

---

## Proposed File Structure

### App Shell and Shared Contracts

- `package.json`
  Defines scripts for dev, build, test, lint, and Electron packaging.
- `tsconfig.json`
  Root TypeScript config with path aliases for renderer, main, and shared modules.
- `electron.vite.config.ts`
  Vite configuration for main, preload, and renderer builds.
- `src/shared/contracts.ts`
  Shared TypeScript types for Project, BibleItem, Chapter, WorkflowState, Task, ChatMessage, and preload RPC payloads.
- `src/shared/bible.ts`
  Bible item type constants, labels, and context selection helpers.

### Main Process

- `src/main/index.ts`
  Electron bootstrap, window lifecycle, and IPC registration.
- `src/main/project-files.ts`
  Project directory creation/open helpers and manuscript file persistence.
- `src/main/database/schema.ts`
  SQLite schema creation and migration entrypoint.
- `src/main/database/repositories/*.ts`
  Focused repositories for projects, bible items, chapters, workflow state, chat threads/messages, and tasks.
- `src/main/services/workflow-service.ts`
  Workflow stage completeness checks and next-step suggestions.
- `src/main/services/context-service.ts`
  Context assembly for chat, drafting, and checks.
- `src/main/services/chat-service.ts`
  Chat orchestration, result routing, and model provider adapter interface.
- `src/main/services/skill-service.ts`
  Skill runner for `capture_braindump`, `shape_synopsis`, `build_characters`, `build_outline`, and `next_step_guide`.
- `src/main/ipc.ts`
  IPC handlers for project, bible, chapter, chat, workflow, and task APIs.

### Preload

- `src/preload/index.ts`
  Safe bridge exposing typed APIs to the renderer.

### Renderer

- `src/renderer/main.tsx`
  React entrypoint.
- `src/renderer/app.tsx`
  App shell routing and workspace bootstrap.
- `src/renderer/stores/workspace-store.ts`
  Zustand store for active project, selected context, and UI state.
- `src/renderer/components/layout/app-shell.tsx`
  Three-column shell: navigation, chat center, context sidebar.
- `src/renderer/components/chat/chat-panel.tsx`
  Primary chat UI with action chips and save/route affordances.
- `src/renderer/components/chat/message-list.tsx`
  Chat transcript rendering.
- `src/renderer/components/chat/composer.tsx`
  User composer with action mode selector.
- `src/renderer/components/bible/story-bible-panel.tsx`
  Story Bible navigation and inline item editor.
- `src/renderer/components/chapters/chapter-panel.tsx`
  Chapter list and draft editor.
- `src/renderer/components/workflow/workflow-sidebar.tsx`
  Current stage, completion checklist, and next-step recommendations.
- `src/renderer/lib/tiptap.ts`
  Minimal Tiptap configuration for chapter drafting.

### Tests

- `src/main/database/schema.test.ts`
- `src/main/services/workflow-service.test.ts`
- `src/main/services/context-service.test.ts`
- `src/main/services/skill-service.test.ts`
- `src/renderer/components/chat/chat-panel.test.tsx`
- `src/renderer/components/workflow/workflow-sidebar.test.tsx`

## Milestone Breakdown

1. App skeleton and local project storage
2. Story Bible and chapter persistence
3. Chat-first workspace UI
4. Workflow state and next-step guidance
5. Skill execution and chat routing
6. Chapter drafting and lightweight consistency checks

## Task 1: Bootstrap Electron + React Workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `electron.vite.config.ts`
- Create: `src/main/index.ts`
- Create: `src/preload/index.ts`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/app.tsx`
- Create: `src/shared/contracts.ts`
- Test: `src/renderer/app.test.tsx`

- [ ] **Step 1: Write the failing renderer smoke test**

```tsx
// src/renderer/app.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./app";

describe("App", () => {
  it("renders the empty workspace shell", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Inkbloom" })).toBeInTheDocument();
    expect(screen.getByText("打开作品或创建新项目以开始创作。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest src/renderer/app.test.tsx --runInBand`

Expected: FAIL with `Cannot find module './app'` or missing React entry files.

- [ ] **Step 3: Write the minimal app shell and build config**

```json
// package.json
{
  "name": "inkbloom",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "electron": "^37.0.0",
    "electron-vite": "^3.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.2.0"
  }
}
```

```ts
// src/shared/contracts.ts
export type WorkflowStage =
  | "ideation"
  | "foundation"
  | "outline"
  | "drafting"
  | "revision"
  | "export";

export interface WorkspaceSummary {
  projectId: string | null;
  projectName: string | null;
}
```

```tsx
// src/renderer/app.tsx
export function App() {
  return (
    <main>
      <h1>Inkbloom</h1>
      <p>打开作品或创建新项目以开始创作。</p>
    </main>
  );
}
```

```tsx
// src/renderer/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

```ts
// src/main/index.ts
import { app, BrowserWindow } from "electron";

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    webPreferences: {
      preload: new URL("../preload/index.js", import.meta.url).pathname,
    },
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    await window.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  }
}

app.whenReady().then(createWindow);
```

- [ ] **Step 4: Run tests and typecheck**

Run:
- `pnpm vitest src/renderer/app.test.tsx --runInBand`
- `pnpm lint`

Expected:
- test PASS
- TypeScript exits 0

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json electron.vite.config.ts src
git commit -m "feat: bootstrap inkbloom desktop workspace"
```

## Task 2: Add Local Project Directory and SQLite Schema

**Files:**
- Create: `src/main/project-files.ts`
- Create: `src/main/database/schema.ts`
- Create: `src/main/database/repositories/project-repository.ts`
- Create: `src/main/database/repositories/bible-repository.ts`
- Create: `src/main/database/repositories/chapter-repository.ts`
- Create: `src/main/database/schema.test.ts`
- Modify: `src/shared/contracts.ts`

- [ ] **Step 1: Write failing schema and project creation tests**

```ts
// src/main/database/schema.test.ts
import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createProjectScaffold } from "../project-files";
import { openProjectDatabase } from "./schema";

describe("project scaffold", () => {
  it("creates the local-first project layout", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-project-"));
    const projectPath = createProjectScaffold(root, "My Novel");

    expect(projectPath.endsWith("My Novel")).toBe(true);
  });

  it("creates required tables", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-db-"));
    const db = openProjectDatabase(join(root, "project.db"));
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>;

    expect(tables.map((row) => row.name)).toEqual(
      expect.arrayContaining(["projects", "bible_items", "chapters", "workflow_state", "chat_threads", "chat_messages", "tasks"]),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest src/main/database/schema.test.ts --runInBand`

Expected: FAIL because schema and project file helpers do not exist.

- [ ] **Step 3: Implement scaffold creation and base schema**

```ts
// src/main/project-files.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function createProjectScaffold(parentDir: string, projectName: string) {
  const projectPath = join(parentDir, projectName);

  mkdirSync(join(projectPath, "manuscript"), { recursive: true });
  mkdirSync(join(projectPath, "assets", "characters"), { recursive: true });
  mkdirSync(join(projectPath, "assets", "locations"), { recursive: true });
  mkdirSync(join(projectPath, "assets", "references"), { recursive: true });
  mkdirSync(join(projectPath, "exports"), { recursive: true });
  mkdirSync(join(projectPath, "snapshots"), { recursive: true });
  mkdirSync(join(projectPath, ".inkbloom", "cache"), { recursive: true });

  writeFileSync(join(projectPath, ".inkbloom", "settings.json"), JSON.stringify({ version: 1 }, null, 2));

  return projectPath;
}
```

```ts
// src/main/database/schema.ts
import Database from "better-sqlite3";

export function openProjectDatabase(dbPath: string) {
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      root_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bible_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      volume_key TEXT NOT NULL,
      chapter_key TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      manuscript_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_state (
      project_id TEXT PRIMARY KEY,
      stage TEXT NOT NULL,
      completion_json TEXT NOT NULL,
      suggested_next_action TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_threads (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      mode TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      input_json TEXT NOT NULL,
      output_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  return db;
}
```

- [ ] **Step 4: Run tests to verify the schema passes**

Run:
- `pnpm vitest src/main/database/schema.test.ts --runInBand`
- `pnpm lint`

Expected:
- schema tests PASS
- TypeScript exits 0

- [ ] **Step 5: Commit**

```bash
git add src/main/project-files.ts src/main/database src/shared/contracts.ts
git commit -m "feat: add local project scaffold and sqlite schema"
```

## Task 3: Implement Story Bible and Chapter Persistence APIs

**Files:**
- Create: `src/main/ipc.ts`
- Create: `src/main/database/repositories/workspace-repository.ts`
- Create: `src/preload/index.ts`
- Modify: `src/main/index.ts`
- Modify: `src/shared/contracts.ts`
- Test: `src/main/database/repositories/workspace-repository.test.ts`

- [ ] **Step 1: Write failing repository tests**

```ts
// src/main/database/repositories/workspace-repository.test.ts
import { describe, expect, it } from "vitest";

import { createWorkspaceRepository } from "./workspace-repository";

describe("workspace repository", () => {
  it("creates and lists bible items by type", () => {
    const repo = createWorkspaceRepository(":memory:");
    const item = repo.createBibleItem({
      projectId: "project-1",
      type: "braindump",
      title: "Opening image",
      content: "一场暴雨中的港口对白。",
    });

    const items = repo.listBibleItems("project-1", "braindump");
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(item.id);
  });

  it("creates chapter records with manuscript paths", () => {
    const repo = createWorkspaceRepository(":memory:");
    const chapter = repo.createChapter({
      projectId: "project-1",
      volumeKey: "volume-01",
      chapterKey: "chapter-001",
      title: "第一章",
      manuscriptPath: "manuscript/volume-01/chapter-001.md",
    });

    expect(chapter.manuscriptPath).toContain("chapter-001.md");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest src/main/database/repositories/workspace-repository.test.ts --runInBand`

Expected: FAIL because `createWorkspaceRepository` does not exist.

- [ ] **Step 3: Implement repositories, IPC handlers, and preload contract**

```ts
// src/shared/contracts.ts
export type BibleItemType =
  | "braindump"
  | "genre"
  | "style"
  | "synopsis"
  | "characters"
  | "worldbuilding"
  | "outline"
  | "themes"
  | "constraints";

export interface BibleItemInput {
  projectId: string;
  type: BibleItemType;
  title: string;
  content: string;
}

export interface ChapterInput {
  projectId: string;
  volumeKey: string;
  chapterKey: string;
  title: string;
  manuscriptPath: string;
}
```

```ts
// src/main/database/repositories/workspace-repository.ts
import { randomUUID } from "node:crypto";

import { openProjectDatabase } from "../schema";
import type { BibleItemInput, ChapterInput } from "../../../shared/contracts";

export function createWorkspaceRepository(dbPath: string) {
  const db = openProjectDatabase(dbPath);

  return {
    createBibleItem(input: BibleItemInput) {
      const record = { id: randomUUID(), ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      db.prepare(`
        INSERT INTO bible_items (id, project_id, type, title, content, created_at, updated_at)
        VALUES (@id, @projectId, @type, @title, @content, @created_at, @updated_at)
      `).run(record);
      return { id: record.id, ...input };
    },
    listBibleItems(projectId: string, type: string) {
      return db.prepare(`
        SELECT id, project_id as projectId, type, title, content
        FROM bible_items
        WHERE project_id = ? AND type = ?
        ORDER BY updated_at DESC
      `).all(projectId, type);
    },
    createChapter(input: ChapterInput) {
      const record = { id: randomUUID(), ...input, summary: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      db.prepare(`
        INSERT INTO chapters (id, project_id, volume_key, chapter_key, title, summary, manuscript_path, created_at, updated_at)
        VALUES (@id, @projectId, @volumeKey, @chapterKey, @title, @summary, @manuscriptPath, @created_at, @updated_at)
      `).run(record);
      return { id: record.id, ...input };
    },
  };
}
```

```ts
// src/preload/index.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("inkbloom", {
  listBibleItems: (projectId: string, type: string) => ipcRenderer.invoke("workspace:listBibleItems", { projectId, type }),
  createBibleItem: (payload: unknown) => ipcRenderer.invoke("workspace:createBibleItem", payload),
  createChapter: (payload: unknown) => ipcRenderer.invoke("workspace:createChapter", payload),
});
```

- [ ] **Step 4: Run tests and a local preview smoke check**

Run:
- `pnpm vitest src/main/database/repositories/workspace-repository.test.ts --runInBand`
- `pnpm lint`
- `pnpm dev`

Expected:
- repository tests PASS
- TypeScript exits 0
- Electron window opens without preload errors

- [ ] **Step 5: Commit**

```bash
git add src/main/ipc.ts src/preload/index.ts src/shared/contracts.ts src/main/database/repositories
git commit -m "feat: expose story bible and chapter persistence apis"
```

## Task 4: Build the Chat-First Workspace Shell

**Files:**
- Create: `src/renderer/stores/workspace-store.ts`
- Create: `src/renderer/components/layout/app-shell.tsx`
- Create: `src/renderer/components/chat/chat-panel.tsx`
- Create: `src/renderer/components/chat/message-list.tsx`
- Create: `src/renderer/components/chat/composer.tsx`
- Create: `src/renderer/components/bible/story-bible-panel.tsx`
- Create: `src/renderer/components/workflow/workflow-sidebar.tsx`
- Modify: `src/renderer/app.tsx`
- Test: `src/renderer/components/chat/chat-panel.test.tsx`

- [ ] **Step 1: Write the failing chat-first layout test**

```tsx
// src/renderer/components/chat/chat-panel.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatPanel } from "./chat-panel";

describe("ChatPanel", () => {
  it("renders primary creation actions in the composer", () => {
    render(<ChatPanel messages={[]} onSend={() => undefined} />);

    expect(screen.getByRole("button", { name: "整理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发散" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "检查" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "转任务" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest src/renderer/components/chat/chat-panel.test.tsx --runInBand`

Expected: FAIL because chat components do not exist.

- [ ] **Step 3: Implement the three-column shell and primary chat UI**

```tsx
// src/renderer/components/chat/chat-panel.tsx
type ChatPanelProps = {
  messages: Array<{ id: string; role: "user" | "assistant"; content: string }>;
  onSend: (input: { mode: "organize" | "explore" | "check" | "task"; content: string }) => void;
};

const MODES = [
  { key: "organize", label: "整理" },
  { key: "explore", label: "发散" },
  { key: "check", label: "检查" },
  { key: "task", label: "转任务" },
] as const;

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  return (
    <section>
      <header>
        <h2>创作对话</h2>
        <p>尽量在聊天中推进想法，再决定是否写回 Story Bible 或章节。</p>
      </header>
      <ul aria-label="chat-messages">
        {messages.map((message) => (
          <li key={message.id}>
            <strong>{message.role === "user" ? "你" : "Inkbloom"}</strong>
            <p>{message.content}</p>
          </li>
        ))}
      </ul>
      <div>
        {MODES.map((mode) => (
          <button key={mode.key} type="button" onClick={() => onSend({ mode: mode.key, content: "" })}>
            {mode.label}
          </button>
        ))}
      </div>
      <textarea aria-label="chat-composer" placeholder="描述你现在要推进的创作问题" />
    </section>
  );
}
```

```tsx
// src/renderer/components/layout/app-shell.tsx
import { ChatPanel } from "../chat/chat-panel";
import { StoryBiblePanel } from "../bible/story-bible-panel";
import { WorkflowSidebar } from "../workflow/workflow-sidebar";

export function AppShell() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 320px", minHeight: "100vh" }}>
      <StoryBiblePanel />
      <ChatPanel messages={[]} onSend={() => undefined} />
      <WorkflowSidebar />
    </div>
  );
}
```

```tsx
// src/renderer/app.tsx
import { AppShell } from "./components/layout/app-shell";

export function App() {
  return <AppShell />;
}
```

- [ ] **Step 4: Run tests and manual UI smoke check**

Run:
- `pnpm vitest src/renderer/components/chat/chat-panel.test.tsx --runInBand`
- `pnpm test`
- `pnpm dev`

Expected:
- chat panel test PASS
- full test suite PASS
- app opens with left nav, center chat, and right workflow sidebar

- [ ] **Step 5: Commit**

```bash
git add src/renderer
git commit -m "feat: add chat-first workspace shell"
```

## Task 5: Add Workflow State and Next-Step Guidance

**Files:**
- Create: `src/main/services/workflow-service.ts`
- Create: `src/main/services/workflow-service.test.ts`
- Modify: `src/shared/contracts.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/components/workflow/workflow-sidebar.tsx`

- [ ] **Step 1: Write failing workflow guidance tests**

```ts
// src/main/services/workflow-service.test.ts
import { describe, expect, it } from "vitest";

import { getWorkflowSnapshot } from "./workflow-service";

describe("workflow guidance", () => {
  it("keeps a project in foundation when synopsis is missing", () => {
    const snapshot = getWorkflowSnapshot({
      hasSynopsis: false,
      hasCharacters: true,
      hasOutline: false,
      chapterCount: 0,
    });

    expect(snapshot.stage).toBe("foundation");
    expect(snapshot.suggestedAction).toContain("先固定故事梗概");
  });

  it("moves to drafting when outline and chapter scaffolds exist", () => {
    const snapshot = getWorkflowSnapshot({
      hasSynopsis: true,
      hasCharacters: true,
      hasOutline: true,
      chapterCount: 1,
    });

    expect(snapshot.stage).toBe("drafting");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest src/main/services/workflow-service.test.ts --runInBand`

Expected: FAIL because the workflow service does not exist.

- [ ] **Step 3: Implement stage evaluation and sidebar contract**

```ts
// src/main/services/workflow-service.ts
type WorkflowSignals = {
  hasSynopsis: boolean;
  hasCharacters: boolean;
  hasOutline: boolean;
  chapterCount: number;
};

export function getWorkflowSnapshot(signals: WorkflowSignals) {
  if (!signals.hasSynopsis || !signals.hasCharacters) {
    return {
      stage: "foundation",
      suggestedAction: "先固定故事梗概和主要角色，再继续扩大结构。",
      completion: {
        synopsis: signals.hasSynopsis,
        characters: signals.hasCharacters,
        outline: signals.hasOutline,
        drafting: signals.chapterCount > 0,
      },
    };
  }

  if (!signals.hasOutline) {
    return {
      stage: "outline",
      suggestedAction: "把当前梗概推进成卷、幕、章级结构。",
      completion: {
        synopsis: true,
        characters: true,
        outline: false,
        drafting: false,
      },
    };
  }

  if (signals.chapterCount === 0) {
    return {
      stage: "drafting",
      suggestedAction: "开始试写第一章，先验证角色声音和开篇张力。",
      completion: {
        synopsis: true,
        characters: true,
        outline: true,
        drafting: false,
      },
    };
  }

  return {
    stage: "drafting",
    suggestedAction: "继续推进章节写作，并在关键节点执行一致性检查。",
    completion: {
      synopsis: true,
      characters: true,
      outline: true,
      drafting: true,
    },
  };
}
```

```tsx
// src/renderer/components/workflow/workflow-sidebar.tsx
export function WorkflowSidebar() {
  const snapshot = {
    stage: "foundation",
    suggestedAction: "先固定故事梗概和主要角色，再继续扩展结构。",
    completion: {
      synopsis: false,
      characters: false,
      outline: false,
      drafting: false,
    },
  };

  return (
    <aside>
      <h2>当前阶段</h2>
      <p>{snapshot.stage}</p>
      <p>{snapshot.suggestedAction}</p>
      <ul>
        <li>梗概：{snapshot.completion.synopsis ? "已完成" : "未完成"}</li>
        <li>角色：{snapshot.completion.characters ? "已完成" : "未完成"}</li>
        <li>大纲：{snapshot.completion.outline ? "已完成" : "未完成"}</li>
        <li>章节：{snapshot.completion.drafting ? "已完成" : "未完成"}</li>
      </ul>
    </aside>
  );
}
```

- [ ] **Step 4: Run tests and verify visible guidance**

Run:
- `pnpm vitest src/main/services/workflow-service.test.ts --runInBand`
- `pnpm test`
- `pnpm dev`

Expected:
- workflow tests PASS
- UI shows current stage and suggested next action

- [ ] **Step 5: Commit**

```bash
git add src/main/services/workflow-service.ts src/renderer/components/workflow/workflow-sidebar.tsx
git commit -m "feat: add workflow stage evaluation and guidance"
```

## Task 6: Implement Skill Routing for Chat Actions

**Files:**
- Create: `src/main/services/skill-service.ts`
- Create: `src/main/services/context-service.ts`
- Create: `src/main/services/chat-service.ts`
- Create: `src/main/services/skill-service.test.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/components/chat/chat-panel.tsx`

- [ ] **Step 1: Write failing skill routing tests**

```ts
// src/main/services/skill-service.test.ts
import { describe, expect, it } from "vitest";

import { runSkill } from "./skill-service";

describe("skill routing", () => {
  it("routes organize mode to capture_braindump", async () => {
    const result = await runSkill({
      mode: "organize",
      content: "一个失忆杀手在海边小镇醒来。",
      context: { activeBibleType: "braindump" },
    });

    expect(result.skill).toBe("capture_braindump");
    expect(result.summary).toContain("灵感已整理");
  });

  it("routes task mode to next_step_guide when the request is ambiguous", async () => {
    const result = await runSkill({
      mode: "task",
      content: "我下一步应该干什么？",
      context: { stage: "foundation" },
    });

    expect(result.skill).toBe("next_step_guide");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest src/main/services/skill-service.test.ts --runInBand`

Expected: FAIL because the skill service does not exist.

- [ ] **Step 3: Implement deterministic MVP skill routing**

```ts
// src/main/services/skill-service.ts
type SkillRequest = {
  mode: "organize" | "explore" | "check" | "task";
  content: string;
  context: Record<string, unknown>;
};

export async function runSkill(request: SkillRequest) {
  if (request.mode === "organize") {
    return {
      skill: "capture_braindump",
      summary: "灵感已整理，可保存到 Braindump 或继续提炼为梗概。",
      payload: {
        title: "新灵感条目",
        content: request.content.trim(),
      },
    };
  }

  if (request.mode === "task" && request.content.includes("下一步")) {
    return {
      skill: "next_step_guide",
      summary: "建议先补齐梗概和角色，再决定是否进入大纲阶段。",
      payload: {
        suggestedAction: "先固定故事梗概和主要角色。",
      },
    };
  }

  if (request.mode === "check") {
    return {
      skill: "consistency_check",
      summary: "已进入轻量一致性检查模式。",
      payload: {},
    };
  }

  return {
    skill: "shape_synopsis",
    summary: "我先帮你把当前想法收敛成可继续推进的梗概。",
    payload: {
      synopsis: request.content.trim(),
    },
  };
}
```

```ts
// src/main/services/chat-service.ts
import { runSkill } from "./skill-service";

export async function sendChatTurn(input: {
  mode: "organize" | "explore" | "check" | "task";
  content: string;
  context: Record<string, unknown>;
}) {
  const skillResult = await runSkill(input);

  return {
    assistantMessage: skillResult.summary,
    skillResult,
  };
}
```

- [ ] **Step 4: Run tests and manual mode smoke check**

Run:
- `pnpm vitest src/main/services/skill-service.test.ts --runInBand`
- `pnpm test`
- `pnpm dev`

Expected:
- skill tests PASS
- clicking chat action buttons results in different assistant summaries

- [ ] **Step 5: Commit**

```bash
git add src/main/services src/renderer/components/chat
git commit -m "feat: add skill-driven chat routing"
```

## Task 7: Add Chapter Drafting and Manuscript File Sync

**Files:**
- Create: `src/renderer/components/chapters/chapter-panel.tsx`
- Create: `src/renderer/lib/tiptap.ts`
- Create: `src/main/services/manuscript-service.ts`
- Create: `src/main/services/manuscript-service.test.ts`
- Modify: `src/main/project-files.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/components/layout/app-shell.tsx`

- [ ] **Step 1: Write failing manuscript sync tests**

```ts
// src/main/services/manuscript-service.test.ts
import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { saveChapterDraft } from "./manuscript-service";

describe("manuscript service", () => {
  it("writes chapter content to the manuscript file", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-manuscript-"));
    const target = join(root, "chapter-001.md");

    saveChapterDraft(target, "# 第一章\n\n暴雨里的港口。");

    expect(readFileSync(target, "utf8")).toContain("暴雨里的港口");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest src/main/services/manuscript-service.test.ts --runInBand`

Expected: FAIL because the manuscript service does not exist.

- [ ] **Step 3: Implement file sync and chapter drafting surface**

```ts
// src/main/services/manuscript-service.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function saveChapterDraft(filePath: string, content: string) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}
```

```tsx
// src/renderer/components/chapters/chapter-panel.tsx
type ChapterPanelProps = {
  title: string;
  content: string;
  onSave: (content: string) => void;
};

export function ChapterPanel({ title, content, onSave }: ChapterPanelProps) {
  return (
    <section>
      <header>
        <h2>{title}</h2>
        <button type="button" onClick={() => onSave(content)}>保存章节</button>
      </header>
      <textarea aria-label="chapter-editor" defaultValue={content} />
    </section>
  );
}
```

- [ ] **Step 4: Run tests and manual save check**

Run:
- `pnpm vitest src/main/services/manuscript-service.test.ts --runInBand`
- `pnpm test`
- `pnpm dev`

Expected:
- manuscript tests PASS
- saving a chapter writes a Markdown file under `manuscript/`

- [ ] **Step 5: Commit**

```bash
git add src/main/services/manuscript-service.ts src/renderer/components/chapters/chapter-panel.tsx
git commit -m "feat: add chapter drafting and manuscript sync"
```

## Task 8: Add Lightweight Consistency Checks and Save-to-Bible Actions

**Files:**
- Create: `src/main/services/context-service.test.ts`
- Modify: `src/main/services/context-service.ts`
- Modify: `src/main/services/chat-service.ts`
- Modify: `src/main/services/skill-service.ts`
- Modify: `src/renderer/components/chat/chat-panel.tsx`
- Modify: `src/renderer/components/bible/story-bible-panel.tsx`

- [ ] **Step 1: Write failing context and consistency tests**

```ts
// src/main/services/context-service.test.ts
import { describe, expect, it } from "vitest";

import { buildConsistencyContext } from "./context-service";

describe("context service", () => {
  it("includes characters, style, and current chapter in consistency checks", () => {
    const context = buildConsistencyContext({
      characters: ["Lin", "Qiao"],
      styleSummary: "冷峻、第三人称限知",
      chapterTitle: "第一章",
    });

    expect(context).toContain("Lin");
    expect(context).toContain("第三人称限知");
    expect(context).toContain("第一章");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest src/main/services/context-service.test.ts --runInBand`

Expected: FAIL because `buildConsistencyContext` is missing.

- [ ] **Step 3: Implement lightweight consistency context and save actions**

```ts
// src/main/services/context-service.ts
type ConsistencyContextInput = {
  characters: string[];
  styleSummary: string;
  chapterTitle: string;
};

export function buildConsistencyContext(input: ConsistencyContextInput) {
  return [
    `角色: ${input.characters.join(", ")}`,
    `风格: ${input.styleSummary}`,
    `章节: ${input.chapterTitle}`,
  ].join("\n");
}
```

```ts
// src/main/services/chat-service.ts
export async function sendChatTurn(input: {
  mode: "organize" | "explore" | "check" | "task";
  content: string;
  context: Record<string, unknown>;
}) {
  const skillResult = await runSkill(input);

  return {
    assistantMessage: skillResult.summary,
    skillResult,
    saveTargets: ["story-bible", "chapter", "task"],
  };
}
```

```tsx
// src/renderer/components/chat/chat-panel.tsx
export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  return (
    <section>
      {/* existing transcript and composer */}
      <footer>
        <button type="button">保存到 Story Bible</button>
        <button type="button">保存到章节</button>
        <button type="button">转成任务</button>
      </footer>
    </section>
  );
}
```

- [ ] **Step 4: Run tests and verify save affordances**

Run:
- `pnpm vitest src/main/services/context-service.test.ts --runInBand`
- `pnpm test`
- `pnpm dev`

Expected:
- context tests PASS
- UI shows “保存到 Story Bible / 保存到章节 / 转成任务” on assistant responses

- [ ] **Step 5: Commit**

```bash
git add src/main/services/context-service.ts src/main/services/chat-service.ts src/renderer/components/chat/chat-panel.tsx
git commit -m "feat: add consistency context and save actions"
```

## Task 9: Final Verification, Packaging, and Documentation Pass

**Files:**
- Create: `README.md`
- Modify: `package.json`
- Modify: `docs/superpowers/specs/2026-04-22-inkbloom-design.md`

- [ ] **Step 1: Write missing setup and verification docs**

```md
<!-- README.md -->
# Inkbloom

本地优先、Chat-first 的长篇小说创作工作台。

## 开发

```bash
pnpm install
pnpm dev
```

## 测试

```bash
pnpm test
pnpm lint
```

## MVP 功能

- Story Bible 分类管理
- Chat-first 创作工作台
- 工作流阶段与下一步建议
- 技能驱动的创作动作
- 本地章节保存
```

- [ ] **Step 2: Run full verification**

Run:
- `pnpm install`
- `pnpm test`
- `pnpm lint`
- `pnpm build`

Expected:
- dependencies install successfully
- tests PASS
- typecheck PASS
- production build created under `dist/`

- [ ] **Step 3: Smoke-test packaged desktop app**

Run: `pnpm preview`

Expected:
- Electron preview launches
- create/open project works
- chat shell renders
- chapter save writes manuscript files
- workflow sidebar shows suggestions

- [ ] **Step 4: Update the spec with any implementation-driven clarifications**

```md
Add a short “Implementation Notes” appendix to `docs/superpowers/specs/2026-04-22-inkbloom-design.md` only if the shipped MVP requires a design clarification discovered during implementation. Do not change product scope silently.
```

- [ ] **Step 5: Commit**

```bash
git add README.md package.json docs/superpowers/specs/2026-04-22-inkbloom-design.md
git commit -m "docs: finalize inkbloom mvp setup and verification"
```

## Self-Review

### Spec coverage

- Product definition and local-first architecture are covered by Tasks 1-3.
- Chat-first UI and minimal document surfaces are covered by Task 4.
- Workflow state and next-step guidance are covered by Task 5.
- Skill-based progression is covered by Task 6.
- Chapter drafting and manuscript persistence are covered by Task 7.
- Lightweight consistency checks and explicit save routing are covered by Task 8.
- Final verification and developer onboarding are covered by Task 9.

No spec sections are currently uncovered for the MVP scope. Deliberately excluded non-MVP items such as cloud sync, collaboration, plugin systems, and advanced agent orchestration remain out of plan.

### Placeholder scan

- Removed vague “add validation later” language.
- Every task includes exact files, commands, and expected outcomes.
- Code steps contain concrete code blocks instead of references to unspecified future code.

### Type consistency

- Workflow stages use the same lowercase values across shared contracts and workflow service.
- Chat modes remain `organize | explore | check | task` across renderer and services.
- Bible item categories remain aligned with the spec taxonomy.
