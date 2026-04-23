import { randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { GlobalLlmSettings, LlmConnectionTestResult } from "../../shared/contracts";

const DEFAULT_KIMI_CODE_BASE_URL = "https://api.kimi.com/coding/v1";
const DEFAULT_KIMI_MODEL = "kimi-for-coding";
const ACP_PROTOCOL_VERSION = 1;

type JsonRpcId = number;

type JsonRpcResponseMessage = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

type JsonRpcRequestMessage = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type SessionTurn = {
  chunks: string[];
};

type ManagedProcess = {
  child: ChildProcessWithoutNullStreams;
  configDir: string;
  signature: string;
  initialized: boolean;
  nextId: number;
  sessionsByCwd: Map<string, string>;
  pending: Map<number, PendingRequest>;
  turns: Map<string, SessionTurn>;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/u, "") || DEFAULT_KIMI_CODE_BASE_URL;
}

function normalizeModel(model: string) {
  return model.trim() || DEFAULT_KIMI_MODEL;
}

function settingsSignature(settings: GlobalLlmSettings) {
  return JSON.stringify({
    provider: settings.provider.trim(),
    baseUrl: normalizeBaseUrl(settings.baseUrl),
    apiKey: settings.apiKey.trim(),
    model: normalizeModel(settings.model),
  });
}

export function buildKimiAcpConfigToml(settings: GlobalLlmSettings) {
  const model = normalizeModel(settings.model);

  return [
    `default_model = "${model}"`,
    `[providers.${model}]`,
    `type = "kimi"`,
    `base_url = "${normalizeBaseUrl(settings.baseUrl)}"`,
    `api_key = "${settings.apiKey.trim()}"`,
    `[models.${model}]`,
    `provider = "${model}"`,
    `model = "${model}"`,
    `max_context_size = 262144`,
  ].join("\n");
}

function buildAcpPrompt(prompt: string) {
  return [{ type: "text", text: prompt }];
}

export function createKimiAcpService(options?: {
  command?: string;
  spawnProcess?: (command: string, args: string[]) => ChildProcessWithoutNullStreams;
}) {
  const command = options?.command ?? "kimi";
  const spawnProcess =
    options?.spawnProcess ??
    ((resolvedCommand: string, args: string[]) =>
      spawn(resolvedCommand, args, {
        env: process.env,
        stdio: "pipe",
      }));

  let managedProcess: ManagedProcess | null = null;
  let stdoutBuffer = "";
  let stderrBuffer = "";

  async function disposeManagedProcess() {
    if (!managedProcess) {
      return;
    }

    const current = managedProcess;
    managedProcess = null;

    for (const pending of current.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Kimi ACP 连接已关闭。"));
    }

    current.pending.clear();
    current.child.kill();
    await rm(current.configDir, { recursive: true, force: true });
  }

  function ensureKimiCliSettings(settings: GlobalLlmSettings) {
    if (!settings.apiKey.trim()) {
      throw new Error("Kimi CLI ACP 模式需要配置 API Key。");
    }
  }

  function writeMessage(message: JsonRpcRequestMessage | JsonRpcResponseMessage) {
    if (!managedProcess) {
      throw new Error("Kimi ACP 进程未启动。");
    }

    managedProcess.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  function handleServerRequest(message: JsonRpcRequestMessage) {
    if (message.method === "session/update") {
      const sessionId = typeof message.params?.sessionId === "string" ? message.params.sessionId : null;
      const update = message.params?.update as
        | { sessionUpdate?: string; content?: { type?: string; text?: string } }
        | undefined;

      if (
        sessionId &&
        update?.sessionUpdate === "agent_message_chunk" &&
        update.content?.type === "text" &&
        typeof update.content.text === "string"
      ) {
        managedProcess?.turns.get(sessionId)?.chunks.push(update.content.text);
      }

      return;
    }

    if (message.method === "session/request_permission" && typeof message.id === "number") {
      const options = Array.isArray(message.params?.options) ? message.params.options : [];
      const firstOptionId =
        options.length > 0 && typeof (options[0] as { optionId?: unknown }).optionId === "string"
          ? (options[0] as { optionId: string }).optionId
          : null;

      if (firstOptionId) {
        writeMessage({
          jsonrpc: "2.0",
          id: message.id,
          result: {
            outcome: {
              outcome: "selected",
              optionId: firstOptionId,
            },
          },
        });
      } else {
        writeMessage({
          jsonrpc: "2.0",
          id: message.id,
          result: {
            outcome: {
              outcome: "cancelled",
            },
          },
        });
      }

      return;
    }

    if (typeof message.id === "number") {
      writeMessage({
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32601,
          message: `Unsupported client method: ${message.method}`,
        },
      });
    }
  }

  function handleServerResponse(message: JsonRpcResponseMessage) {
    if (!managedProcess) {
      return;
    }

    const pending = managedProcess.pending.get(message.id);

    if (!pending) {
      return;
    }

    managedProcess.pending.delete(message.id);
    clearTimeout(pending.timeout);

    if (message.error) {
      pending.reject(new Error(message.error.message));
      return;
    }

    pending.resolve(message.result);
  }

  function handleStdoutChunk(chunk: Buffer | string) {
    stdoutBuffer += chunk.toString();

    while (true) {
      const newlineIndex = stdoutBuffer.indexOf("\n");

      if (newlineIndex === -1) {
        break;
      }

      const line = stdoutBuffer.slice(0, newlineIndex).trim();
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);

      if (!line) {
        continue;
      }

      let message: JsonRpcRequestMessage | JsonRpcResponseMessage;

      try {
        message = JSON.parse(line) as JsonRpcRequestMessage | JsonRpcResponseMessage;
      } catch {
        continue;
      }

      if ("method" in message) {
        handleServerRequest(message);
      } else {
        handleServerResponse(message);
      }
    }
  }

  async function request(method: string, params?: Record<string, unknown>, timeoutMs = 15000) {
    if (!managedProcess) {
      throw new Error("Kimi ACP 进程未启动。");
    }

    const id = managedProcess.nextId++;

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        managedProcess?.pending.delete(id);
        reject(new Error(`Kimi ACP 请求超时：${method}`));
      }, timeoutMs);

      managedProcess?.pending.set(id, { resolve, reject, timeout });
      writeMessage({
        jsonrpc: "2.0",
        id,
        method,
        params,
      });
    });
  }

  async function ensureProcess(settings: GlobalLlmSettings) {
    ensureKimiCliSettings(settings);
    const signature = settingsSignature(settings);

    if (managedProcess && managedProcess.signature === signature && managedProcess.initialized) {
      return managedProcess;
    }

    await disposeManagedProcess();

    const configDir = await mkdtemp(join(tmpdir(), "inkbloom-kimi-acp-"));
    const configPath = join(configDir, `${randomUUID()}.toml`);
    await writeFile(configPath, buildKimiAcpConfigToml(settings), "utf8");

    stdoutBuffer = "";
    stderrBuffer = "";

    const child = spawnProcess(command, ["--config-file", configPath, "acp"]);

    managedProcess = {
      child,
      configDir,
      signature,
      initialized: false,
      nextId: 1,
      sessionsByCwd: new Map(),
      pending: new Map(),
      turns: new Map(),
    };

    child.stdout.on("data", handleStdoutChunk);
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderrBuffer += chunk.toString();
    });
    child.on("close", () => {
      if (!managedProcess) {
        return;
      }

      for (const pending of managedProcess.pending.values()) {
        clearTimeout(pending.timeout);
        pending.reject(new Error(stderrBuffer.trim() || "Kimi ACP 进程已退出。"));
      }

      managedProcess.pending.clear();
      void rm(managedProcess.configDir, { recursive: true, force: true });
      managedProcess = null;
    });

    await request("initialize", {
      protocolVersion: ACP_PROTOCOL_VERSION,
      clientCapabilities: {
        fs: {
          readTextFile: false,
          writeTextFile: false,
        },
        terminal: false,
      },
      clientInfo: {
        name: "inkbloom",
        title: "Inkbloom",
        version: "0.1.0",
      },
    });

    managedProcess.initialized = true;
    return managedProcess;
  }

  async function ensureSession(settings: GlobalLlmSettings, cwd: string) {
    const process = await ensureProcess(settings);
    const existingSessionId = process.sessionsByCwd.get(cwd);

    if (existingSessionId) {
      return existingSessionId;
    }

    const result = (await request("session/new", {
      cwd,
      mcpServers: [],
    })) as { sessionId?: string };

    if (!result.sessionId) {
      throw new Error("Kimi ACP 未返回 sessionId。");
    }

    process.sessionsByCwd.set(cwd, result.sessionId);
    return result.sessionId;
  }

  return {
    async testConnection(settings: GlobalLlmSettings): Promise<LlmConnectionTestResult> {
      try {
        const cwd = process.cwd();
        const sessionId = await ensureSession(settings, cwd);

        managedProcess?.turns.set(sessionId, { chunks: [] });
        const result = (await request("session/prompt", {
          sessionId,
          prompt: buildAcpPrompt("Reply with pong."),
        })) as { stopReason?: string };
        const reply = managedProcess?.turns.get(sessionId)?.chunks.join("").trim() ?? "";
        managedProcess?.turns.delete(sessionId);

        return {
          ok: result.stopReason === "end_turn",
          status: result.stopReason === "end_turn" ? 0 : null,
          endpoint: `${command} acp`,
          protocol: "kimi-cli-acp",
          message: reply ? `Kimi ACP 连接成功，模型返回：${reply}` : "Kimi ACP 连接成功。",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";

        return {
          ok: false,
          status: null,
          endpoint: `${command} acp`,
          protocol: "kimi-cli-acp",
          message: `Kimi ACP 连接失败：${message}`,
        };
      }
    },

    async generateReply(input: {
      settings: GlobalLlmSettings;
      prompt: string;
      workDir: string;
    }) {
      const sessionId = await ensureSession(input.settings, input.workDir);
      managedProcess?.turns.set(sessionId, { chunks: [] });

      const result = (await request("session/prompt", {
        sessionId,
        prompt: buildAcpPrompt(input.prompt),
      })) as { stopReason?: string };
      const reply = managedProcess?.turns.get(sessionId)?.chunks.join("").trim() ?? "";
      managedProcess?.turns.delete(sessionId);

      if (result.stopReason !== "end_turn") {
        throw new Error(`Kimi ACP 提前停止：${result.stopReason ?? "unknown stop reason"}`);
      }

      if (!reply) {
        throw new Error("Kimi ACP 未返回内容。");
      }

      return reply;
    },

    async dispose() {
      await disposeManagedProcess();
    },
  };
}
