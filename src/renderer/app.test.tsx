// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./app";
import { appStore } from "./stores/app-store";
import { workspaceStore } from "./stores/workspace-store";

describe("App", () => {
  beforeEach(() => {
    cleanup();
    appStore.resetForTests();
    workspaceStore.resetForTests();
    Object.defineProperty(window, "inkbloom", {
      configurable: true,
      writable: true,
      value: {
        listBooks: vi.fn().mockResolvedValue([]),
        createBook: vi.fn(),
        updateBook: vi.fn(),
        deleteBook: vi.fn(),
        getGlobalLlmSettings: vi.fn().mockResolvedValue({
          provider: "",
          baseUrl: "",
          apiKey: "",
          model: "",
        }),
        saveGlobalLlmSettings: vi.fn().mockResolvedValue({
          provider: "",
          baseUrl: "",
          apiKey: "",
          model: "",
        }),
        testGlobalLlmConnection: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          endpoint: "https://api.example.com/chat/completions",
          protocol: "openai-chat-completions",
          message: "连接成功，模型返回：pong",
        }),
        listBibleItems: vi.fn().mockResolvedValue([]),
        createBibleItem: vi.fn(),
        createChapter: vi.fn(),
        getWorkflowSnapshot: vi.fn().mockResolvedValue({
          stage: "foundation",
          suggestedAction: "继续完善设定。",
          completion: {
            synopsis: true,
            characters: false,
            outline: false,
            drafting: false,
          },
        }),
      },
    });
  });

  it("renders the home screen on startup", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Inkbloom" })).toBeInTheDocument();
    expect(await screen.findByText("新建第一本书")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByText("AI 功能暂不可用，先到 AI 后端设置选择后端并补齐所需配置。")).toBeInTheDocument();
  });

  it("opens settings, saves global config, and returns to home", async () => {
    const saveGlobalLlmSettings = vi.fn().mockImplementation(async (input) => input);
    const testGlobalLlmConnection = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      endpoint: "https://api.example.com/chat/completions",
      protocol: "openai-chat-completions",
      message: "连接成功，模型返回：pong",
    });

    Object.defineProperty(window, "inkbloom", {
      configurable: true,
      writable: true,
      value: {
        listBooks: vi.fn().mockResolvedValue([]),
        createBook: vi.fn(),
        updateBook: vi.fn(),
        deleteBook: vi.fn(),
        getGlobalLlmSettings: vi.fn().mockResolvedValue({
          provider: "",
          baseUrl: "",
          apiKey: "",
          model: "",
        }),
        saveGlobalLlmSettings,
        testGlobalLlmConnection,
        listBibleItems: vi.fn().mockResolvedValue([]),
        createBibleItem: vi.fn(),
        createChapter: vi.fn(),
        getWorkflowSnapshot: vi.fn().mockResolvedValue({
          stage: "foundation",
          suggestedAction: "继续完善设定。",
          completion: {
            synopsis: true,
            characters: false,
            outline: false,
            drafting: false,
          },
        }),
      },
    });

    render(<App />);

    fireEvent.click((await screen.findAllByRole("button", { name: "设置" }))[0]!);

    expect(await screen.findByRole("heading", { name: "AI 后端设置" })).toBeInTheDocument();

    fireEvent.change(document.querySelector('select[name="provider"]')!, { target: { value: "openai-compatible" } });
    fireEvent.change(screen.getByLabelText("Base URL"), { target: { value: "https://api.example.com" } });
    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "sk-demo" } });
    fireEvent.change(screen.getByLabelText("Model"), { target: { value: "gpt-5.4" } });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() =>
      expect(saveGlobalLlmSettings).toHaveBeenCalledWith({
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "sk-demo",
        model: "gpt-5.4",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "测试连接" }));

    await waitFor(() =>
      expect(testGlobalLlmConnection).toHaveBeenCalledWith({
        provider: "openai-compatible",
        baseUrl: "https://api.example.com",
        apiKey: "sk-demo",
        model: "gpt-5.4",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "返回首页" }));

    expect(await screen.findByText("新建第一本书")).toBeInTheDocument();
  });

  it("returns from workspace to home through the shell entry", async () => {
    appStore.setBooksForTests([
      {
        id: "book-1",
        title: "长夜港",
        rootPath: "/tmp/长夜港",
        createdAt: "2026-04-23T00:00:00.000Z",
        updatedAt: "2026-04-23T00:00:00.000Z",
      },
    ]);
    appStore.enterBook({
      id: "book-1",
      title: "长夜港",
      rootPath: "/tmp/长夜港",
      createdAt: "2026-04-23T00:00:00.000Z",
      updatedAt: "2026-04-23T00:00:00.000Z",
    });

    render(<App />);

    expect(screen.getByRole("button", { name: "返回首页" })).toBeInTheDocument();
    expect(screen.getByText("AI 功能暂不可用，先到 AI 后端设置选择后端并补齐所需配置。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "返回首页" }));

    expect(await screen.findByText("长夜港")).toBeInTheDocument();
  });
});
