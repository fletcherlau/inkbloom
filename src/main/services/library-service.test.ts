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

    expect(project.title).toBe("长夜港");
    expect(existsSync(join(project.rootPath, ".inkbloom", "settings.json"))).toBe(true);
    expect(service.listBooks()).toHaveLength(1);
  });

  it("renames an existing project without changing its root path", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-library-"));
    const dbPath = join(root, "app.db");
    const service = createLibraryService({
      dbPath,
      libraryRoot: join(root, "books"),
    });
    const created = service.createBook({ title: "旧标题" });

    const updated = service.updateBook({ id: created.id, title: "新标题" });

    expect(updated).toEqual({
      ...created,
      title: "新标题",
      updatedAt: expect.any(String),
    });
    expect(service.listBooks()[0]?.title).toBe("新标题");
    expect(service.listBooks()[0]?.rootPath).toBe(created.rootPath);
  });

  it("deletes the project directory and record together", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-library-"));
    const dbPath = join(root, "app.db");
    const service = createLibraryService({
      dbPath,
      libraryRoot: join(root, "books"),
    });
    const created = service.createBook({ title: "待删除书籍" });

    service.deleteBook(created.id);

    expect(existsSync(created.rootPath)).toBe(false);
    expect(service.listBooks()).toEqual([]);
  });

  it("removes the scaffold when record creation fails", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-library-"));
    const dbPath = join(root, "app.db");
    const libraryRoot = join(root, "books");
    const db = openProjectDatabase(dbPath);

    db.prepare(
      "INSERT INTO projects (id, name, root_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).run("project-1", "重复标题", join(libraryRoot, "重复标题"), "2026-04-23T00:00:00.000Z", "2026-04-23T00:00:00.000Z");
    db.close();

    const service = createLibraryService({
      dbPath,
      libraryRoot,
      createId: () => "project-1",
      now: () => "2026-04-23T01:00:00.000Z",
    });

    expect(() => service.createBook({ title: "重复标题" })).toThrow();
    expect(existsSync(join(libraryRoot, "重复标题"))).toBe(false);
  });
});
