import type { DatabaseSync } from "node:sqlite";

import type { BibleItemRecord } from "../../../shared/contracts";

interface BibleItemRow {
  id: string;
  projectId: string;
  type: string;
  title: string;
  content: string;
  status: "draft" | "confirmed";
  createdAt: string;
  updatedAt: string;
}

export class BibleRepository {
  constructor(private readonly database: DatabaseSync) {}

  create(item: BibleItemRecord) {
    this.database
      .prepare(
        `INSERT INTO bible_items (
          id,
          project_id,
          type,
          title,
          content,
          status,
          created_at,
          updated_at
        ) VALUES (@id, @projectId, @type, @title, @content, @status, @createdAt, @updatedAt)`,
      )
      .run({
        id: item.id,
        projectId: item.projectId,
        type: item.type,
        title: item.title,
        content: item.content,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
  }

  listForProject(projectId: string) {
    const rows = this.database
      .prepare(
        `SELECT
          id,
          project_id AS projectId,
          type,
          title,
          content,
          status,
          created_at AS createdAt,
          updated_at AS updatedAt
         FROM bible_items
         WHERE project_id = ?
         ORDER BY updated_at DESC`,
      )
      .all(projectId) as unknown as BibleItemRow[];

    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      type: row.type,
      title: row.title,
      content: row.content,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
