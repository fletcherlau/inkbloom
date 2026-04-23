import { afterEach, describe, expect, it, vi } from "vitest";

import type { GlobalLlmSettings } from "../../shared/contracts";
import {
  buildAnthropicEndpoint,
  normalizeAnthropicBaseUrl,
  normalizeAnthropicModel,
  sendAnthropicMessage,
  testAnthropicConnection,
} from "./anthropic-service";

function createSettings(overrides: Partial<GlobalLlmSettings> = {}): GlobalLlmSettings {
  return {
    provider: "anthropic-compatible",
    baseUrl: "",
    apiKey: "sk-kimi-demo",
    model: "",
    ...overrides,
  };
}

describe("anthropic service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes Kimi Code anthropic defaults", () => {
    expect(normalizeAnthropicBaseUrl("")).toBe("https://api.kimi.com/coding/");
    expect(normalizeAnthropicModel("")).toBe("kimi-for-coding");
    expect(buildAnthropicEndpoint("")).toBe("https://api.kimi.com/coding/v1/messages");
  });

  it("tests anthropic-compatible connection successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: "pong" }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await testAnthropicConnection(createSettings());

    expect(fetchMock).toHaveBeenCalledWith("https://api.kimi.com/coding/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": "sk-kimi-demo",
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

  it("sends an anthropic-compatible message and extracts text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            content: [{ type: "text", text: "这是来自 Anthropic 兼容接口的回复。" }],
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      sendAnthropicMessage({
        settings: createSettings(),
        prompt: "请继续扩写这一段。",
      }),
    ).resolves.toBe("这是来自 Anthropic 兼容接口的回复。");
  });
});
