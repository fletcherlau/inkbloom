// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./app";
import { appStore } from "./stores/app-store";
import { workspaceStore } from "./stores/workspace-store";

describe("App", () => {
  beforeEach(() => {
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
        getGlobalLlmSettings: vi.fn(),
        saveGlobalLlmSettings: vi.fn(),
        listBibleItems: vi.fn().mockResolvedValue([]),
        createBibleItem: vi.fn(),
        createChapter: vi.fn(),
        getWorkflowSnapshot: vi.fn(),
      },
    });
  });

  it("renders the home screen on startup", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Inkbloom" })).toBeInTheDocument();
    expect(await screen.findByText("新建第一本书")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设置" })).toBeInTheDocument();
  });
});
