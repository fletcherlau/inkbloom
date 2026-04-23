import type { DatabaseSync } from "node:sqlite";

import type { ChapterRecord } from "../../../shared/contracts";

interface ChapterRow {
  id: string;
  projectId: string;
  volumeKey: string;
  chapterKey: string;
  title: string;
  summary: string;
  manuscriptPath: string;
  createdAt: string;
  updatedAt: string;
}

export class ChapterRepository {
  constructor(private readonly database: DatabaseSync) {}

  create(chapter: ChapterRecord) {
    this.database
      .prepare(
        `INSERT INTO chapters (
          id,
          project_id,
          volume_key,
          chapter_key,
          title,
          summary,
          manuscript_path,
          created_at,
          updated_at
        ) VALUES (
          @id,
          @projectId,
          @volumeKey,
          @chapterKey,
          @title,
          @summary,
          @manuscriptPath,
          @createdAt,
          @updatedAt
        )`,
      )
      .run({
        id: chapter.id,
        projectId: chapter.projectId,
        volumeKey: chapter.volumeKey,
        chapterKey: chapter.chapterKey,
        title: chapter.title,
        summary: chapter.summary,
        manuscriptPath: chapter.manuscriptPath,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      });
  }

  listForProject(projectId: string) {
    const rows = this.database
      .prepare(
        `SELECT
          id,
          project_id AS projectId,
          volume_key AS volumeKey,
          chapter_key AS chapterKey,
          title,
          summary,
          manuscript_path AS manuscriptPath,
          created_at AS createdAt,
          updated_at AS updatedAt
         FROM chapters
         WHERE project_id = ?
         ORDER BY volume_key, chapter_key`,
      )
      .all(projectId) as unknown as ChapterRow[];

    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      volumeKey: row.volumeKey,
      chapterKey: row.chapterKey,
      title: row.title,
      summary: row.summary,
      manuscriptPath: row.manuscriptPath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
