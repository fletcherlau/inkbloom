import { PassThrough } from "node:stream";
import { EventEmitter } from "node:events";

import { describe, expect, it } from "vitest";

import type { GlobalLlmSettings } from "../../shared/contracts";
import { buildKimiAcpConfigToml, createKimiAcpService } from "./kimi-acp-service";

function createSettings(overrides: Partial<GlobalLlmSettings> = {}): GlobalLlmSettings {
  return {
    provider: "kimi-cli",
    baseUrl: "",
    apiKey: "sk-kimi-demo",
    model: "kimi-for-coding",
    ...overrides,
  };
}

function createFakeAcpProcess() {
  const stdout = new PassThrough();
  const stdin = new PassThrough();
  const stderr = new PassThrough();
  const child = new EventEmitter() as EventEmitter & {
    stdin: PassThrough;
    stdout: PassThrough;
    stderr: PassThrough;
    kill: () => void;
  };

  child.stdin = stdin;
  child.stdout = stdout;
  child.stderr = stderr;
  child.kill = () => {
    child.emit("close", 0);
  };

  return child;
}

describe("kimi acp service", () => {
  it("builds a Kimi ACP config with the default Kimi Code endpoint", () => {
    expect(buildKimiAcpConfigToml(createSettings())).toContain(
      'base_url = "https://api.kimi.com/coding/v1"',
    );
  });

  it("runs initialize, session/new, and session/prompt over ACP", async () => {
    const fakeChild = createFakeAcpProcess();
    const writes: string[] = [];

    fakeChild.stdin.on("data", (chunk) => {
      writes.push(chunk.toString());

      for (const line of chunk
        .toString()
        .split("\n")
        .map((entry: string) => entry.trim())
        .filter(Boolean)) {
        const message = JSON.parse(line) as { id: number; method: string; params?: { sessionId?: string } };

        if (message.method === "initialize") {
          fakeChild.stdout.write(
            `${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: 1 } })}\n`,
          );
        }

        if (message.method === "session/new") {
          fakeChild.stdout.write(
            `${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { sessionId: "sess-1" } })}\n`,
          );
        }

        if (message.method === "session/prompt") {
          fakeChild.stdout.write(
            `${JSON.stringify({
              jsonrpc: "2.0",
              method: "session/update",
              params: {
                sessionId: message.params?.sessionId,
                update: {
                  sessionUpdate: "agent_message_chunk",
                  content: { type: "text", text: "pong" },
                },
              },
            })}\n`,
          );
          fakeChild.stdout.write(
            `${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { stopReason: "end_turn" } })}\n`,
          );
        }
      }
    });

    const service = createKimiAcpService({
      command: "kimi",
      spawnProcess: () => fakeChild as never,
    });

    const result = await service.testConnection(createSettings());

    expect(result).toEqual({
      ok: true,
      status: 0,
      endpoint: "kimi acp",
      protocol: "kimi-cli-acp",
      message: "Kimi ACP 连接成功，模型返回：pong",
    });
    expect(writes.join("")).toContain('"method":"initialize"');
    expect(writes.join("")).toContain('"method":"session/new"');
    expect(writes.join("")).toContain('"method":"session/prompt"');
  });
});
