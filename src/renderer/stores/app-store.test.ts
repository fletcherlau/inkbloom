// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BookSummary } from "@shared/contracts";

import { appStore } from "./app-store";
import { workspaceStore } from "./workspace-store";

function createBook(overrides: Partial<BookSummary> = {}): BookSummary {
  return {
    id: "book-1",
    title: "长夜港",
    rootPath: "/tmp/长夜港",
    createdAt: "2026-04-23T00:00:00.000Z",
    updatedAt: "2026-04-23T00:00:00.000Z",
    ...overrides,
  };
}

describe("appStore", () => {
  beforeEach(() => {
    appStore.resetForTests();
    workspaceStore.resetForTests();
  });

  it("bootstraps books into the home view", async () => {
    const listBooks = vi.fn().mockResolvedValue([createBook()]);

    Object.defineProperty(window, "inkbloom", {
      configurable: true,
      writable: true,
      value: {
        listBooks,
        createBook: vi.fn(),
        updateBook: vi.fn(),
        deleteBook: vi.fn(),
        getGlobalLlmSettings: vi.fn(),
        saveGlobalLlmSettings: vi.fn(),
        listBibleItems: vi.fn(),
        createBibleItem: vi.fn(),
        createChapter: vi.fn(),
        getWorkflowSnapshot: vi.fn(),
      },
    });

    await appStore.bootstrap();

    expect(listBooks).toHaveBeenCalledTimes(1);
    expect(appStore.getSnapshot().books).toEqual([createBook()]);
    expect(appStore.getSnapshot().view).toBe("home");
  });

  it("creates a book and enters the workspace", async () => {
    const created = createBook({
      id: "book-2",
      title: "新书",
      rootPath: "/tmp/新书",
      createdAt: "2026-04-23T01:00:00.000Z",
      updatedAt: "2026-04-23T01:00:00.000Z",
    });

    Object.defineProperty(window, "inkbloom", {
      configurable: true,
      writable: true,
      value: {
        listBooks: vi.fn().mockResolvedValue([]),
        createBook: vi.fn().mockResolvedValue(created),
        updateBook: vi.fn(),
        deleteBook: vi.fn(),
        getGlobalLlmSettings: vi.fn(),
        saveGlobalLlmSettings: vi.fn(),
        listBibleItems: vi.fn(),
        createBibleItem: vi.fn(),
        createChapter: vi.fn(),
        getWorkflowSnapshot: vi.fn(),
      },
    });

    await appStore.createBook("新书");

    expect(appStore.getSnapshot().view).toBe("workspace");
    expect(appStore.getSnapshot().selectedBookId).toBe("book-2");
    expect(workspaceStore.getSnapshot().projectId).toBe("book-2");
    expect(workspaceStore.getSnapshot().projectName).toBe("新书");
  });

  it("updates and deletes books while staying on the home view", async () => {
    const initial = createBook();
    const updated = createBook({
      title: "长夜港（修订）",
      updatedAt: "2026-04-23T02:00:00.000Z",
    });
    const updateBook = vi.fn().mockResolvedValue(updated);
    const deleteBook = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(window, "inkbloom", {
      configurable: true,
      writable: true,
      value: {
        listBooks: vi.fn().mockResolvedValue([]),
        createBook: vi.fn(),
        updateBook,
        deleteBook,
        getGlobalLlmSettings: vi.fn(),
        saveGlobalLlmSettings: vi.fn(),
        listBibleItems: vi.fn(),
        createBibleItem: vi.fn(),
        createChapter: vi.fn(),
        getWorkflowSnapshot: vi.fn(),
      },
    });

    appStore.setBooksForTests([initial]);

    await appStore.updateBook({ id: initial.id, title: "长夜港（修订）" });

    expect(updateBook).toHaveBeenCalledWith({ id: initial.id, title: "长夜港（修订）" });
    expect(appStore.getSnapshot().books[0]?.title).toBe("长夜港（修订）");
    expect(appStore.getSnapshot().view).toBe("home");

    await appStore.deleteBook(initial.id);

    expect(deleteBook).toHaveBeenCalledWith({ id: initial.id });
    expect(appStore.getSnapshot().books).toEqual([]);
    expect(appStore.getSnapshot().view).toBe("home");
  });

  it("resets saving state when saving backend settings fails", async () => {
    Object.defineProperty(window, "inkbloom", {
      configurable: true,
      writable: true,
      value: {
        listBooks: vi.fn().mockResolvedValue([]),
        createBook: vi.fn(),
        updateBook: vi.fn(),
        deleteBook: vi.fn(),
        getGlobalLlmSettings: vi.fn(),
        saveGlobalLlmSettings: vi.fn().mockRejectedValue(new Error("save failed")),
        testGlobalLlmConnection: vi.fn(),
        listBibleItems: vi.fn(),
        createBibleItem: vi.fn(),
        createChapter: vi.fn(),
        getWorkflowSnapshot: vi.fn(),
      },
    });

    await expect(
      appStore.saveGlobalLlmSettings({
        provider: "kimi-cli",
        baseUrl: "",
        apiKey: "sk-demo",
        model: "kimi-for-coding",
      }),
    ).rejects.toThrow("save failed");

    expect(appStore.getSnapshot().isSavingSettings).toBe(false);
  });
});
