import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { saveChapterDraft } from "./manuscript-service";

describe("manuscript service", () => {
  it("anchors a manuscript draft path under the given project root", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "inkbloom-manuscript-"));
    const target = join(projectRoot, "manuscript", "volume-01", "chapter-001.md");

    saveChapterDraft({
      projectRoot,
      relativeManuscriptPath: "volume-01/chapter-001.md",
      content: "# 第一章\n\n夜里开始下雨。",
    });

    expect(readFileSync(target, "utf8")).toContain("夜里开始下雨");
  });

  it("creates parent directories before writing chapter content", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "inkbloom-manuscript-"));
    const target = join(projectRoot, "manuscript", "volume-01", "chapter-001.md");

    saveChapterDraft({
      projectRoot,
      relativeManuscriptPath: "volume-01/chapter-001.md",
      content: "# 第一章\n\n港口升起白雾。",
    });

    expect(existsSync(join(projectRoot, "manuscript", "volume-01"))).toBe(true);
    expect(readFileSync(target, "utf8")).toContain("港口升起白雾");
  });

  it("rejects an absolute manuscript path", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "inkbloom-manuscript-"));

    expect(() =>
      saveChapterDraft({
        projectRoot,
        relativeManuscriptPath: "/tmp/escape.md",
        content: "forbidden",
      }),
    ).toThrow("relativeManuscriptPath must not be absolute");
  });

  it("rejects a manuscript path that escapes the manuscript tree", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "inkbloom-manuscript-"));

    expect(() =>
      saveChapterDraft({
        projectRoot,
        relativeManuscriptPath: "../escape.md",
        content: "forbidden",
      }),
    ).toThrow("relativeManuscriptPath must stay within the manuscript directory");
  });
});
