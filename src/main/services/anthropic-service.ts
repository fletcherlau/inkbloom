import type { GlobalLlmSettings, LlmConnectionTestResult } from "../../shared/contracts";

const DEFAULT_ANTHROPIC_BASE_URL = "https://api.kimi.com/coding/";
const DEFAULT_ANTHROPIC_MODEL = "kimi-for-coding";
const ANTHROPIC_VERSION = "2023-06-01";

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

export function normalizeAnthropicBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();
  return ensureTrailingSlash(trimmed || DEFAULT_ANTHROPIC_BASE_URL);
}

export function normalizeAnthropicModel(model: string) {
  return model.trim() || DEFAULT_ANTHROPIC_MODEL;
}

export function buildAnthropicEndpoint(baseUrl: string) {
  return new URL("v1/messages", normalizeAnthropicBaseUrl(baseUrl)).toString();
}

export function extractAnthropicText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const content = (payload as { content?: Array<{ type?: string; text?: unknown }> }).content;
  const textBlocks = Array.isArray(content)
    ? content
        .filter((item) => item?.type === "text" && typeof item.text === "string")
        .map((item) => item.text as string)
    : [];

  return textBlocks.length > 0 ? textBlocks.join("") : null;
}

export async function testAnthropicConnection(
  settings: GlobalLlmSettings,
): Promise<LlmConnectionTestResult> {
  const provider = settings.provider.trim();
  const apiKey = settings.apiKey.trim();
  const endpoint = buildAnthropicEndpoint(settings.baseUrl);
  const model = normalizeAnthropicModel(settings.model);

  if (!provider || !apiKey) {
    return {
      ok: false,
      status: null,
      endpoint,
      protocol: "anthropic-messages",
      message: "测试连接前请先填写 provider 和 apiKey。",
    };
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": ANTHROPIC_VERSION,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        max_tokens: 128,
        messages: [{ role: "user", content: "Reply with pong." }],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown network error";

    return {
      ok: false,
      status: null,
      endpoint,
      protocol: "anthropic-messages",
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
      protocol: "anthropic-messages",
      message: `接口返回失败：${errorMessage}`,
    };
  }

  const assistantText = extractAnthropicText(payload);

  return {
    ok: true,
    status: response.status,
    endpoint,
    protocol: "anthropic-messages",
    message: assistantText ? `连接成功，模型返回：${assistantText}` : "连接成功，接口已返回 200 响应。",
  };
}

export async function sendAnthropicMessage(input: {
  settings: GlobalLlmSettings;
  prompt: string;
}) {
  const endpoint = buildAnthropicEndpoint(input.settings.baseUrl);
  const apiKey = input.settings.apiKey.trim();
  const model = normalizeAnthropicModel(input.settings.model);

  if (!apiKey) {
    throw new Error("Anthropic-compatible 模式需要配置 API Key。");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: input.prompt }],
    }),
  });

  const rawText = await response.text();
  const payload = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: { message?: unknown } }).error?.message === "string"
        ? (payload as { error: { message: string } }).error.message
        : rawText || `HTTP ${response.status}`;

    throw new Error(errorMessage);
  }

  const text = extractAnthropicText(payload);

  if (!text) {
    throw new Error("Anthropic-compatible 接口未返回文本内容。");
  }

  return text;
}
