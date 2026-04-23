import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createSettingsService } from "./settings-service";

describe("settings service", () => {
  it("returns defaults when no global settings have been saved", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-service-"));
    const service = createSettingsService(join(root, "app.db"));

    expect(service.getGlobalLlmSettings()).toEqual({
      provider: "",
      baseUrl: "",
      apiKey: "",
      model: "",
    });
  });

  it("persists and reloads global LLM settings", () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-service-"));
    const dbPath = join(root, "app.db");
    const service = createSettingsService(dbPath);

    service.saveGlobalLlmSettings({
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "secret",
      model: "gpt-5.4",
    });

    expect(createSettingsService(dbPath).getGlobalLlmSettings()).toEqual({
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "secret",
      model: "gpt-5.4",
    });
  });
});
