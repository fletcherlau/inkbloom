import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { openProjectDatabase } from "../database/schema";
import { ProjectRepository } from "../database/repositories/project-repository";
import { createChatService } from "./chat-service";

describe("chat service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the existing local skill path for non-kimi-cli providers", async () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-chat-service-"));
    const service = createChatService(join(root, "app.db"), {
      settingsService: {
        getGlobalLlmSettings: () => ({
          provider: "",
          baseUrl: "",
          apiKey: "",
          model: "",
        }),
        saveGlobalLlmSettings: (input) => input,
        testGlobalLlmConnection: vi.fn(),
      },
    });

    await expect(
      service.sendChatTurn({
        mode: "organize",
        content: "把这个灵感整理一下",
      }),
    ).resolves.toMatchObject({
      assistantMessage: {
        content: "灵感已整理，可保存到 Braindump 或继续提炼为梗概。",
      },
      skillResult: {
        skill: "capture_braindump",
      },
    });
  });

  it("routes chat through anthropic-compatible HTTP when provider is anthropic-compatible", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: "这是来自 Anthropic 兼容接口的回复。" }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const root = mkdtempSync(join(tmpdir(), "inkbloom-chat-service-"));
    const service = createChatService(join(root, "app.db"), {
      settingsService: {
        getGlobalLlmSettings: () => ({
          provider: "anthropic-compatible",
          baseUrl: "",
          apiKey: "sk-kimi-demo",
          model: "",
        }),
        saveGlobalLlmSettings: (input) => input,
        testGlobalLlmConnection: vi.fn(),
      },
    });

    const result = await service.sendChatTurn({
      mode: "explore",
      content: "给我三个完全不同的开篇方向",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.kimi.com/coding/v1/messages", expect.any(Object));
    expect(result).toMatchObject({
      assistantMessage: {
        content: "这是来自 Anthropic 兼容接口的回复。",
      },
      skillResult: {
        summary: "这是来自 Anthropic 兼容接口的回复。",
        payload: {
          provider: "anthropic-compatible",
        },
      },
    });
  });

  it("routes chat through Kimi ACP when provider is kimi-cli", async () => {
    const root = mkdtempSync(join(tmpdir(), "inkbloom-chat-service-"));
    const dbPath = join(root, "app.db");
    const db = openProjectDatabase(dbPath);
    new ProjectRepository(db).create({
      id: "book-1",
      name: "长夜港",
      rootPath: join(root, "books", "长夜港"),
      createdAt: "2026-04-23T00:00:00.000Z",
      updatedAt: "2026-04-23T00:00:00.000Z",
    });
    const generateReply = vi.fn().mockResolvedValue("这是来自 Kimi ACP 的回复。");
    const service = createChatService(dbPath, {
      settingsService: {
        getGlobalLlmSettings: () => ({
          provider: "kimi-cli",
          baseUrl: "",
          apiKey: "sk-kimi-demo",
          model: "kimi-for-coding",
        }),
        saveGlobalLlmSettings: (input) => input,
        testGlobalLlmConnection: vi.fn(),
      },
      kimiAcpService: {
        testConnection: vi.fn(),
        generateReply,
        dispose: vi.fn(),
      },
    });

    const result = await service.sendChatTurn({
      mode: "explore",
      content: "给我三个完全不同的开篇方向",
      projectId: "book-1",
    });

    expect(generateReply).toHaveBeenCalledWith({
      settings: {
        provider: "kimi-cli",
        baseUrl: "",
        apiKey: "sk-kimi-demo",
        model: "kimi-for-coding",
      },
      prompt: expect.stringContaining("给我三个完全不同的开篇方向"),
      workDir: join(root, "books", "长夜港"),
    });
    expect(result).toMatchObject({
      assistantMessage: {
        content: "这是来自 Kimi ACP 的回复。",
      },
      skillResult: {
        summary: "这是来自 Kimi ACP 的回复。",
        payload: {
          provider: "kimi-cli",
        },
      },
    });
  });
});
