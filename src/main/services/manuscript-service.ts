import { writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import { ensureParentDirectory } from "../project-files";

type SaveChapterDraftInput = {
  projectRoot: string;
  relativeManuscriptPath: string;
  content: string;
};

function resolveChapterDraftPath(projectRoot: string, relativeManuscriptPath: string) {
  if (isAbsolute(relativeManuscriptPath)) {
    throw new Error("relativeManuscriptPath must not be absolute");
  }

  const manuscriptRoot = resolve(projectRoot, "manuscript");
  const targetPath = resolve(manuscriptRoot, relativeManuscriptPath);
  const relativePath = relative(manuscriptRoot, targetPath);

  if (
    relativePath === "" ||
    relativePath === "." ||
    relativePath.startsWith("..") ||
    isAbsolute(relativePath)
  ) {
    throw new Error("relativeManuscriptPath must stay within the manuscript directory");
  }

  return targetPath;
}

export function saveChapterDraft(input: SaveChapterDraftInput) {
  const filePath = resolveChapterDraftPath(input.projectRoot, input.relativeManuscriptPath);

  ensureParentDirectory(filePath);
  writeFileSync(filePath, input.content, "utf8");

  return {
    filePath,
  };
}
