import type { GlobalLlmSettings, LlmConnectionTestResult } from "../../shared/contracts";
import { openProjectDatabase } from "../database/schema";
import { AppSettingsRepository } from "../database/repositories/app-settings-repository";
import { testAnthropicConnection } from "./anthropic-service";
import { createKimiAcpService } from "./kimi-acp-service";

const SETTINGS_KEY = "llm";

const DEFAULT_SETTINGS: GlobalLlmSettings = {
  provider: "",
  baseUrl: "",
  apiKey: "",
  model: "",
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/u, "");
}

function extractAssistantText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const choices = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
  const firstContent = choices?.[0]?.message?.content;

  return typeof firstContent === "string" ? firstContent : null;
}

export function createSettingsService(dbPath: string) {
  const database = openProjectDatabase(dbPath);
  const repository = new AppSettingsRepository(database);
  const kimiAcpService = createKimiAcpService();

  return {
    getGlobalLlmSettings(): GlobalLlmSettings {
      const serialized = repository.get(SETTINGS_KEY);

      if (!serialized) {
        return { ...DEFAULT_SETTINGS };
      }

      return {
        ...DEFAULT_SETTINGS,
        ...(JSON.parse(serialized) as Partial<GlobalLlmSettings>),
      };
    },

    saveGlobalLlmSettings(input: GlobalLlmSettings): GlobalLlmSettings {
      repository.set(SETTINGS_KEY, JSON.stringify(input));
      return input;
    },

    async testGlobalLlmConnection(input: GlobalLlmSettings): Promise<LlmConnectionTestResult> {
      if (input.provider.trim() === "kimi-cli") {
        return kimiAcpService.testConnection(input);
      }

      if (input.provider.trim() === "anthropic-compatible") {
        return testAnthropicConnection(input);
      }

      const provider = input.provider.trim();
      const baseUrl = normalizeBaseUrl(input.baseUrl);
      const apiKey = input.apiKey.trim();
      const model = input.model.trim();
      const endpoint = `${baseUrl}/chat/completions`;

      if (!provider || !baseUrl || !apiKey || !model) {
        return {
          ok: false,
          status: null,
          endpoint,
          protocol: "openai-chat-completions",
          message: "测试连接前请先填写 provider、baseUrl、apiKey 和 model。",
        };
      }

      let response: Response;

      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Reply with pong." }],
          }),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown network error";

        return {
          ok: false,
          status: null,
          endpoint,
          protocol: "openai-chat-completions",
          message: `网络请求失败：${message}`,
        };
      }

      let payload: unknown = null;
      let rawText = "";

      try {
        rawText = await response.text();
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = rawText || null;
      }

      if (!response.ok) {
        const errorMessage =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof (payload as { error?: { message?: unknown } }).error?.message === "string"
            ? (payload as { error: { message: string } }).error.message
            : rawText || `HTTP ${response.status}`;

        return {
          ok: false,
          status: response.status,
          endpoint,
          protocol: "openai-chat-completions",
          message: `接口返回失败：${errorMessage}`,
        };
      }

      const assistantText = extractAssistantText(payload);

      return {
        ok: true,
        status: response.status,
        endpoint,
        protocol: "openai-chat-completions",
        message: assistantText ? `连接成功，模型返回：${assistantText}` : "连接成功，接口已返回 200 响应。",
      };
    },
  };
}
