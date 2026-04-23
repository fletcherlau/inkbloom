// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GlobalLlmSettings } from "@shared/contracts";

import { SettingsScreen } from "./settings-screen";

function createSettings(overrides: Partial<GlobalLlmSettings> = {}): GlobalLlmSettings {
  return {
    provider: "",
    baseUrl: "",
    apiKey: "",
    model: "",
    ...overrides,
  };
}

describe("SettingsScreen", () => {
  it("renders the current global LLM settings and saves updates", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onTestConnection = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      endpoint: "https://api.example.com/chat/completions",
      protocol: "openai-chat-completions",
      message: "连接成功，模型返回：pong",
    });

    render(
      <SettingsScreen
        settings={createSettings({ provider: "openai-compatible", model: "gpt-5.4" })}
        isSaving={false}
        onSave={onSave}
        onTestConnection={onTestConnection}
        onGoHome={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: "AI 后端设置" })).toBeInTheDocument();
    expect(screen.getByLabelText("AI 后端")).toHaveValue("openai-compatible");
    expect(screen.getByLabelText("Model")).toHaveValue("gpt-5.4");

    fireEvent.change(screen.getByLabelText("Base URL"), { target: { value: "https://api.example.com" } });
    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "sk-demo" } });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "sk-demo",
        model: "gpt-5.4",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "测试连接" }));

    await waitFor(() =>
      expect(onTestConnection).toHaveBeenCalledWith({
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "sk-demo",
        model: "gpt-5.4",
      }),
    );

    expect(await screen.findByText("连接成功")).toBeInTheDocument();
  });

  it("normalizes default Kimi CLI values before saving and testing", async () => {
    cleanup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onTestConnection = vi.fn().mockResolvedValue({
      ok: true,
      status: 0,
      endpoint: "kimi acp",
      protocol: "kimi-cli-acp",
      message: "Kimi ACP 连接成功，模型返回：pong",
    });

    render(
      <SettingsScreen
        settings={createSettings({ provider: "kimi-cli", apiKey: "sk-demo", model: "", baseUrl: "" })}
        isSaving={false}
        onSave={onSave}
        onTestConnection={onTestConnection}
        onGoHome={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "测试连接" }));

    await waitFor(() =>
      expect(onTestConnection).toHaveBeenCalledWith({
        provider: "kimi-cli",
        apiKey: "sk-demo",
        model: "kimi-for-coding",
        baseUrl: "https://api.kimi.com/coding/v1",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        provider: "kimi-cli",
        apiKey: "sk-demo",
        model: "kimi-for-coding",
        baseUrl: "https://api.kimi.com/coding/v1",
      }),
    );
  });
});
