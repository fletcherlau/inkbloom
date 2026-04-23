import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createSettingsService } from "./settings-service";

describe("settings service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("tests an OpenAI-compatible chat completions endpoint successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "pong" } }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-service-"));
    const service = createSettingsService(join(root, "app.db"));

    const result = await service.testGlobalLlmConnection({
      provider: "openai-compatible",
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-demo",
      model: "gpt-5.4",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer sk-demo",
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        messages: [{ role: "user", content: "Reply with pong." }],
      }),
    });
    expect(result).toEqual({
      ok: true,
      status: 200,
      endpoint: "https://api.example.com/v1/chat/completions",
      protocol: "openai-chat-completions",
      message: "连接成功，模型返回：pong",
    });
  });

  it("tests an anthropic-compatible messages endpoint successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: "pong" }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-service-"));
    const service = createSettingsService(join(root, "app.db"));

    const result = await service.testGlobalLlmConnection({
      provider: "anthropic-compatible",
      baseUrl: "",
      apiKey: "sk-demo",
      model: "",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.kimi.com/coding/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": "sk-demo",
      },
      body: JSON.stringify({
        model: "kimi-for-coding",
        max_tokens: 128,
        messages: [{ role: "user", content: "Reply with pong." }],
      }),
    });
    expect(result).toEqual({
      ok: true,
      status: 200,
      endpoint: "https://api.kimi.com/coding/v1/messages",
      protocol: "anthropic-messages",
      message: "连接成功，模型返回：pong",
    });
  });

  it("returns a structured failure when required fields are missing", async () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-settings-service-"));
    const service = createSettingsService(join(root, "app.db"));

    await expect(
      service.testGlobalLlmConnection({
        provider: "",
        baseUrl: "",
        apiKey: "",
        model: "",
      }),
    ).resolves.toEqual({
      ok: false,
      status: null,
      endpoint: "/chat/completions",
      protocol: "openai-chat-completions",
      message: "测试连接前请先填写 provider、baseUrl、apiKey 和 model。",
    });
  });
});
