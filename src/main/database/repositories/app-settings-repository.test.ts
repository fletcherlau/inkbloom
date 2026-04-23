import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openProjectDatabase } from "../schema";
import { AppSettingsRepository } from "./app-settings-repository";

describe("app settings repository", () => {
  it("returns undefined for an unset key", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-"));
    const db = openProjectDatabase(join(root, "app.db"));

    expect(new AppSettingsRepository(db).get("llm")).toBeUndefined();
  });

  it("upserts the serialized LLM settings payload", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-"));
    const db = openProjectDatabase(join(root, "app.db"));
    const repo = new AppSettingsRepository(db);

    repo.set("llm", JSON.stringify({ provider: "openai", model: "gpt-5.4" }));

    expect(repo.get("llm")).toContain("gpt-5.4");
  });

  it("overwrites an existing value for the same key", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-"));
    const db = openProjectDatabase(join(root, "app.db"));
    const repo = new AppSettingsRepository(db);

    repo.set("llm", JSON.stringify({ provider: "openai", model: "gpt-5.4" }));
    repo.set("llm", JSON.stringify({ provider: "anthropic", model: "claude-sonnet-4.5" }));

    expect(repo.get("llm")).toContain("claude-sonnet-4.5");
  });
});
