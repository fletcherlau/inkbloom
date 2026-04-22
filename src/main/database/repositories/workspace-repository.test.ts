import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ProjectRepository } from "./project-repository";
import { ChapterRepository } from "./chapter-repository";
import { openProjectDatabase } from "../schema";
import { createWorkspaceRepository } from "./workspace-repository";

describe("workspace repository", () => {
  it("creates and lists bible items by type", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-workspace-"));
    const dbPath = join(root, "project.db");
    const db = openProjectDatabase(dbPath);
    new ProjectRepository(db).create({
      id: "project-1",
      name: "My Novel",
      rootPath: root,
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    });
    const repo = createWorkspaceRepository(dbPath);

    const item = repo.createBibleItem({
      projectId: "project-1",
      type: "braindump",
      title: "Opening image",
      content: "一场暴雨中的港口对白。",
    });

    repo.createBibleItem({
      projectId: "project-1",
      type: "genre",
      title: "Genre",
      content: "悬疑成长小说",
    });

    const items = repo.listBibleItems("project-1", "braindump");
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(item.id);
    expect(items[0]?.type).toBe("braindump");
  });

  it("creates chapter records with manuscript paths", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-workspace-"));
    const dbPath = join(root, "project.db");
    const db = openProjectDatabase(dbPath);
    new ProjectRepository(db).create({
      id: "project-1",
      name: "My Novel",
      rootPath: root,
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    });
    const repo = createWorkspaceRepository(dbPath);

    const chapter = repo.createChapter({
      projectId: "project-1",
      volumeKey: "volume-01",
      chapterKey: "chapter-001",
      title: "第一章",
      manuscriptPath: "manuscript/volume-01/chapter-001.md",
    });
    const persistedChapters = new ChapterRepository(db).listForProject("project-1");

    expect(chapter.manuscriptPath).toContain("chapter-001.md");
    expect(chapter.summary).toBe("");
    expect(persistedChapters).toHaveLength(1);
    expect(persistedChapters[0]?.id).toBe(chapter.id);
    expect(persistedChapters[0]?.manuscriptPath).toBe("manuscript/volume-01/chapter-001.md");
  });

  it("rejects duplicate chapters for the same project volume and chapter key", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-workspace-"));
    const dbPath = join(root, "project.db");
    const db = openProjectDatabase(dbPath);
    new ProjectRepository(db).create({
      id: "project-1",
      name: "My Novel",
      rootPath: root,
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    });
    const repo = createWorkspaceRepository(dbPath);

    repo.createChapter({
      projectId: "project-1",
      volumeKey: "volume-01",
      chapterKey: "chapter-001",
      title: "第一章",
      manuscriptPath: "manuscript/volume-01/chapter-001.md",
    });

    expect(() =>
      repo.createChapter({
        projectId: "project-1",
        volumeKey: "volume-01",
        chapterKey: "chapter-001",
        title: "重复第一章",
        manuscriptPath: "manuscript/volume-01/chapter-001-v2.md",
      }),
    ).toThrow("Chapter already exists for project-1/volume-01/chapter-001");

    expect(new ChapterRepository(db).listForProject("project-1")).toHaveLength(1);
  });
});
