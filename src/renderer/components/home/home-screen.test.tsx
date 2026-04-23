// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BookSummary } from "@shared/contracts";

import { HomeScreen } from "./home-screen";

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

describe("HomeScreen", () => {
  it("renders the empty state", () => {
    render(
      <HomeScreen
        books={[]}
        isLoading={false}
        isCreateDialogOpen={false}
        editingBook={null}
        deletingBook={null}
        onOpenCreateDialog={() => undefined}
        onOpenEditDialog={() => undefined}
        onCloseBookDialog={() => undefined}
        onSubmitBook={() => Promise.resolve()}
        onEnterBook={() => undefined}
        onOpenDeleteDialog={() => undefined}
        onCloseDeleteDialog={() => undefined}
        onConfirmDelete={() => Promise.resolve()}
        onOpenSettings={() => undefined}
      />,
    );

    expect(screen.getByText("新建第一本书")).toBeInTheDocument();
    expect(screen.getByText("你的书架还是空的。先创建一本书，再进入创作工作区。")).toBeInTheDocument();
  });

  it("renders a book card and emits the enter/edit/delete actions", () => {
    const onEnterBook = vi.fn();
    const onOpenEditDialog = vi.fn();
    const onOpenDeleteDialog = vi.fn();
    const book = createBook();

    render(
      <HomeScreen
        books={[book]}
        isLoading={false}
        isCreateDialogOpen={false}
        editingBook={null}
        deletingBook={null}
        onOpenCreateDialog={() => undefined}
        onOpenEditDialog={onOpenEditDialog}
        onCloseBookDialog={() => undefined}
        onSubmitBook={() => Promise.resolve()}
        onEnterBook={onEnterBook}
        onOpenDeleteDialog={onOpenDeleteDialog}
        onCloseDeleteDialog={() => undefined}
        onConfirmDelete={() => Promise.resolve()}
        onOpenSettings={() => undefined}
      />,
    );

    expect(screen.getByText("长夜港")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入创作" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "进入创作" }));
    fireEvent.click(screen.getByRole("button", { name: "修改" }));
    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    expect(onEnterBook).toHaveBeenCalledWith(book);
    expect(onOpenEditDialog).toHaveBeenCalledWith(book);
    expect(onOpenDeleteDialog).toHaveBeenCalledWith(book);
  });
});
