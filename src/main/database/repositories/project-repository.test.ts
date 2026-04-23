import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openProjectDatabase } from "../schema";
import { ProjectRepository } from "./project-repository";

describe("project repository", () => {
  it("updates a project's name and updated timestamp", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-project-repo-"));
    const db = openProjectDatabase(join(root, "app.db"));
    const repo = new ProjectRepository(db);

    repo.create({
      id: "project-1",
      name: "旧书名",
      rootPath: join(root, "books", "old-name"),
      createdAt: "2026-04-23T00:00:00.000Z",
      updatedAt: "2026-04-23T00:00:00.000Z",
    });

    repo.updateName("project-1", "新书名", "2026-04-23T01:00:00.000Z");

    expect(repo.findById("project-1")).toEqual({
      id: "project-1",
      name: "新书名",
      rootPath: join(root, "books", "old-name"),
      createdAt: "2026-04-23T00:00:00.000Z",
      updatedAt: "2026-04-23T01:00:00.000Z",
    });
  });

  it("deletes a project record", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-project-repo-"));
    const db = openProjectDatabase(join(root, "app.db"));
    const repo = new ProjectRepository(db);

    repo.create({
      id: "project-1",
      name: "待删除书籍",
      rootPath: join(root, "books", "book"),
      createdAt: "2026-04-23T00:00:00.000Z",
      updatedAt: "2026-04-23T00:00:00.000Z",
    });

    repo.delete("project-1");

    expect(repo.findById("project-1")).toBeUndefined();
    expect(repo.list()).toEqual([]);
  });
});
