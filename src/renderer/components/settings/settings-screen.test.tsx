// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

    render(
      <SettingsScreen
        settings={createSettings({ provider: "openai", model: "gpt-5.4" })}
        isSaving={false}
        onSave={onSave}
        onGoHome={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: "全局 AI 设置" })).toBeInTheDocument();
    expect(screen.getByLabelText("Provider")).toHaveValue("openai");
    expect(screen.getByLabelText("Model")).toHaveValue("gpt-5.4");

    fireEvent.change(screen.getByLabelText("Base URL"), { target: { value: "https://api.example.com" } });
    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "sk-demo" } });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        provider: "openai",
        baseUrl: "https://api.example.com",
        apiKey: "sk-demo",
        model: "gpt-5.4",
      }),
    );
  });
});
