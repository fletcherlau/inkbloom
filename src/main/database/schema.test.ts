import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createProjectScaffold } from "../project-files";
import { openProjectDatabase } from "./schema";

describe("project scaffold", () => {
  it("creates the local-first project layout", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-project-"));
    const projectPath = createProjectScaffold(root, "My Novel");

    expect(projectPath.endsWith("My Novel")).toBe(true);
    expect(existsSync(join(projectPath, "manuscript"))).toBe(true);
    expect(existsSync(join(projectPath, "assets", "characters"))).toBe(true);
    expect(existsSync(join(projectPath, "assets", "locations"))).toBe(true);
    expect(existsSync(join(projectPath, "assets", "references"))).toBe(true);
    expect(existsSync(join(projectPath, "exports"))).toBe(true);
    expect(existsSync(join(projectPath, "snapshots"))).toBe(true);
    expect(existsSync(join(projectPath, ".inkbloom", "cache"))).toBe(true);
    expect(readFileSync(join(projectPath, ".inkbloom", "settings.json"), "utf8")).toBe(
      JSON.stringify({ version: 1 }, null, 2),
    );
  });

  it.each(["../escape", "/tmp/escape", "nested/project"])("rejects unsafe project name %s", (projectName) => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-project-"));

    expect(() => createProjectScaffold(root, projectName)).toThrow();
  });

  it("creates required tables", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-db-"));
    const db = openProjectDatabase(join(root, "project.db"));
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;

    expect(tables.map((row) => row.name)).toEqual(
      expect.arrayContaining([
        "projects",
        "app_settings",
        "bible_items",
        "chapters",
        "workflow_state",
        "chat_threads",
        "chat_messages",
        "tasks",
      ]),
    );
  });

  it("rejects invalid enum values at the database boundary", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-enums-"));
    const db = openProjectDatabase(join(root, "project.db"));

    db.prepare(
      "INSERT INTO projects (id, name, root_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).run("project-1", "My Novel", root, "2026-04-22T00:00:00.000Z", "2026-04-22T00:00:00.000Z");
    db.prepare(
      "INSERT INTO chat_threads (id, project_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).run("thread-1", "project-1", "Thread", "2026-04-22T00:00:00.000Z", "2026-04-22T00:00:00.000Z");

    expect(() =>
      db.prepare(
        "INSERT INTO bible_items (id, project_id, type, title, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        "bible-1",
        "project-1",
        "genre",
        "Genre",
        "",
        "invalid",
        "2026-04-22T00:00:00.000Z",
        "2026-04-22T00:00:00.000Z",
      ),
    ).toThrow();

    expect(() =>
      db.prepare(
        "INSERT INTO workflow_state (project_id, stage, completion_json, suggested_next_action, updated_at) VALUES (?, ?, ?, ?, ?)",
      ).run("project-1", "invalid", "{}", "Next", "2026-04-22T00:00:00.000Z"),
    ).toThrow();

    expect(() =>
      db.prepare(
        "INSERT INTO chat_messages (id, thread_id, role, mode, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run("message-1", "thread-1", "invalid", "chat", "Hello", "2026-04-22T00:00:00.000Z"),
    ).toThrow();

    expect(() =>
      db.prepare(
        "INSERT INTO chat_messages (id, thread_id, role, mode, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run("message-2", "thread-1", "user", "invalid", "Hello", "2026-04-22T00:00:00.000Z"),
    ).toThrow();

    expect(() =>
      db.prepare(
        "INSERT INTO tasks (id, project_id, type, status, input_json, output_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        "task-1",
        "project-1",
        "capture_braindump",
        "invalid",
        "{}",
        "{}",
        "2026-04-22T00:00:00.000Z",
        "2026-04-22T00:00:00.000Z",
      ),
    ).toThrow();
  });
});
