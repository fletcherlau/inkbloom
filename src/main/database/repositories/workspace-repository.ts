import { randomUUID } from "node:crypto";

import type {
  BibleItemInput,
  BibleItemRecord,
  BibleItemType,
  ChapterInput,
  ChapterRecord,
} from "../../../shared/contracts";
import { openProjectDatabase } from "../schema";
import { BibleRepository } from "./bible-repository";
import { ChapterRepository } from "./chapter-repository";

export function createWorkspaceRepository(dbPath: string) {
  const database = openProjectDatabase(dbPath);
  const bibleRepository = new BibleRepository(database);
  const chapterRepository = new ChapterRepository(database);

  return {
    createBibleItem(input: BibleItemInput): BibleItemRecord {
      const timestamp = new Date().toISOString();
      const record: BibleItemRecord = {
        id: randomUUID(),
        projectId: input.projectId,
        type: input.type,
        title: input.title,
        content: input.content,
        status: "draft",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      bibleRepository.create(record);

      return record;
    },

    listBibleItems(projectId: string, type: BibleItemType): BibleItemRecord[] {
      return bibleRepository
        .listForProject(projectId)
        .filter((item): item is BibleItemRecord => item.type === type);
    },

    createChapter(input: ChapterInput): ChapterRecord {
      const duplicateChapter = chapterRepository.listForProject(input.projectId).find(
        (chapter) =>
          chapter.volumeKey === input.volumeKey && chapter.chapterKey === input.chapterKey,
      );

      if (duplicateChapter) {
        throw new Error(
          `Chapter already exists for ${input.projectId}/${input.volumeKey}/${input.chapterKey}`,
        );
      }

      const timestamp = new Date().toISOString();
      const record: ChapterRecord = {
        id: randomUUID(),
        projectId: input.projectId,
        volumeKey: input.volumeKey,
        chapterKey: input.chapterKey,
        title: input.title,
        summary: "",
        manuscriptPath: input.manuscriptPath,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      chapterRepository.create(record);

      return record;
    },
  };
}
