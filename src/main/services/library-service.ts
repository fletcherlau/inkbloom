import { randomUUID } from "node:crypto";

import type { BookSummary, ProjectRecord } from "../../shared/contracts";
import { openProjectDatabase } from "../database/schema";
import { ProjectRepository } from "../database/repositories/project-repository";
import { createProjectScaffold, deleteProjectScaffold } from "../project-files";

interface CreateLibraryServiceOptions {
  dbPath: string;
  libraryRoot: string;
  createId?: () => string;
  now?: () => string;
}

interface CreateBookInput {
  title: string;
}

interface UpdateBookInput {
  id: string;
  title: string;
}

function toBookSummary(project: ProjectRecord): BookSummary {
  return {
    id: project.id,
    title: project.name,
    rootPath: project.rootPath,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function createLibraryService({
  dbPath,
  libraryRoot,
  createId = randomUUID,
  now = () => new Date().toISOString(),
}: CreateLibraryServiceOptions) {
  const database = openProjectDatabase(dbPath);
  const projectRepository = new ProjectRepository(database);

  return {
    listBooks(): BookSummary[] {
      return projectRepository.list().map(toBookSummary);
    },

    createBook(input: CreateBookInput): BookSummary {
      const timestamp = now();
      const projectPath = createProjectScaffold(libraryRoot, input.title);
      const project: ProjectRecord = {
        id: createId(),
        name: input.title,
        rootPath: projectPath,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      try {
        projectRepository.create(project);
      } catch (error) {
        deleteProjectScaffold(projectPath, libraryRoot);
        throw error;
      }

      return toBookSummary(project);
    },

    updateBook(input: UpdateBookInput): BookSummary {
      const project = projectRepository.findById(input.id);

      if (!project) {
        throw new Error(`Project not found: ${input.id}`);
      }

      projectRepository.updateName(input.id, input.title, now());

      return toBookSummary(projectRepository.findById(input.id) ?? project);
    },

    deleteBook(id: string) {
      const project = projectRepository.findById(id);

      if (!project) {
        throw new Error(`Project not found: ${id}`);
      }

      deleteProjectScaffold(project.rootPath, libraryRoot);
      projectRepository.delete(id);
    },
  };
}
