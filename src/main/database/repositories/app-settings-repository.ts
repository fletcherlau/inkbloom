import type { DatabaseSync } from "node:sqlite";

interface AppSettingsRow {
  value: string;
}

export class AppSettingsRepository {
  constructor(private readonly database: DatabaseSync) {}

  get(key: string) {
    const row = this.database
      .prepare(`SELECT value FROM app_settings WHERE key = ?`)
      .get(key) as AppSettingsRow | undefined;

    return row?.value;
  }

  set(key: string, value: string, updatedAt = new Date().toISOString()) {
    this.database
      .prepare(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (@key, @value, @updatedAt)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`,
      )
      .run({ key, value, updatedAt });
  }
}
