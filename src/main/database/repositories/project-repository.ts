import type { DatabaseSync } from "node:sqlite";

import type { ProjectRecord } from "../../../shared/contracts";

interface ProjectRow {
  id: string;
  name: string;
  rootPath: string;
  createdAt: string;
  updatedAt: string;
}

export class ProjectRepository {
  constructor(private readonly database: DatabaseSync) {}

  create(project: ProjectRecord) {
    this.database
      .prepare(
        `INSERT INTO projects (id, name, root_path, created_at, updated_at)
         VALUES (@id, @name, @rootPath, @createdAt, @updatedAt)`,
      )
      .run({
        id: project.id,
        name: project.name,
        rootPath: project.rootPath,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      });
  }

  updateName(id: string, name: string, updatedAt: string) {
    this.database
      .prepare(
        `UPDATE projects
         SET name = @name, updated_at = @updatedAt
         WHERE id = @id`,
      )
      .run({ id, name, updatedAt });
  }

  delete(id: string) {
    this.database.prepare("DELETE FROM projects WHERE id = ?").run(id);
  }

  findById(id: string) {
    const row = this.database
      .prepare(
        `SELECT id, name, root_path AS rootPath, created_at AS createdAt, updated_at AS updatedAt
         FROM projects
         WHERE id = ?`,
      )
      .get(id) as ProjectRow | undefined;

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      name: row.name,
      rootPath: row.rootPath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  list() {
    const rows = this.database
      .prepare(
        `SELECT id, name, root_path AS rootPath, created_at AS createdAt, updated_at AS updatedAt
         FROM projects
         ORDER BY updated_at DESC`,
      )
      .all() as unknown as ProjectRow[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      rootPath: row.rootPath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
