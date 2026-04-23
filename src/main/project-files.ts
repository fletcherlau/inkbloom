import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

function assertSafeProjectName(parentDir: string, projectName: string) {
  if (!projectName.trim()) {
    throw new Error("projectName must not be empty");
  }

  if (projectName === "." || projectName === "..") {
    throw new Error("projectName must be a plain directory name");
  }

  if (projectName.includes("/") || projectName.includes("\\")) {
    throw new Error("projectName must not contain path separators");
  }

  if (isAbsolute(projectName)) {
    throw new Error("projectName must not be an absolute path");
  }

  const resolvedParentDir = resolve(parentDir);
  const targetPath = resolve(resolvedParentDir, projectName);
  const relativePath = relative(resolvedParentDir, targetPath);

  if (
    relativePath === "" ||
    relativePath === "." ||
    relativePath.startsWith("..") ||
    isAbsolute(relativePath)
  ) {
    throw new Error("projectName resolves outside the parent directory");
  }

  if (relativePath.includes(sep)) {
    throw new Error("projectName must resolve to a single directory name");
  }

  return targetPath;
}

export function createProjectScaffold(parentDir: string, projectName: string) {
  const projectPath = assertSafeProjectName(parentDir, projectName);

  mkdirSync(join(projectPath, "manuscript"), { recursive: true });
  mkdirSync(join(projectPath, "assets", "characters"), { recursive: true });
  mkdirSync(join(projectPath, "assets", "locations"), { recursive: true });
  mkdirSync(join(projectPath, "assets", "references"), { recursive: true });
  mkdirSync(join(projectPath, "exports"), { recursive: true });
  mkdirSync(join(projectPath, "snapshots"), { recursive: true });
  mkdirSync(join(projectPath, ".inkbloom", "cache"), { recursive: true });

  writeFileSync(
    join(projectPath, ".inkbloom", "settings.json"),
    JSON.stringify({ version: 1 }, null, 2),
  );

  return projectPath;
}

export function ensureParentDirectory(filePath: string) {
  mkdirSync(dirname(resolve(filePath)), { recursive: true });
}

export function deleteProjectScaffold(projectPath: string, libraryRoot: string) {
  const resolvedLibraryRoot = resolve(libraryRoot);
  const resolvedProjectPath = resolve(projectPath);
  const relativePath = relative(resolvedLibraryRoot, resolvedProjectPath);

  if (
    relativePath === "" ||
    relativePath === "." ||
    relativePath.startsWith("..") ||
    isAbsolute(relativePath)
  ) {
    throw new Error("projectPath must stay within the library root");
  }

  if (!existsSync(resolvedProjectPath)) {
    return;
  }

  rmSync(resolvedProjectPath, { recursive: true, force: false });
}
