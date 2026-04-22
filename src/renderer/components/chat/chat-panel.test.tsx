// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "../layout/app-shell";
import { workspaceStore } from "../../stores/workspace-store";
import { ChatPanel } from "./chat-panel";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function installInkbloomSendChatTurnMock(sendChatTurn: ReturnType<typeof vi.fn>) {
  Object.defineProperty(window, "inkbloom", {
    configurable: true,
    writable: true,
    value: {
      listBibleItems: vi.fn().mockResolvedValue([]),
      createBibleItem: vi.fn(),
      createChapter: vi.fn(),
      getWorkflowSnapshot: vi.fn().mockResolvedValue({
        stage: "foundation",
        suggestedAction: "先固定故事梗概和主要角色，再继续扩大结构。",
        completion: {
          synopsis: false,
          characters: false,
          outline: false,
          drafting: false,
        },
      }),
      sendChatTurn,
    },
  });
}

describe("ChatPanel", () => {
  beforeEach(() => {
    workspaceStore.resetForTests();
    Object.defineProperty(window, "inkbloom", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders primary creation actions in the composer", () => {
    render(<ChatPanel messages={[]} onSend={() => undefined} />);

    expect(screen.getByRole("button", { name: "整理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发散" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "检查" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "转任务" })).toBeInTheDocument();
  });

  it("appends messages and uses the submitted mode for the assistant receipt", () => {
    render(<AppShell />);

    fireEvent.click(screen.getByRole("button", { name: "发散" }));
    fireEvent.change(screen.getByLabelText("chat-composer"), {
      target: { value: "想看三个完全不同的开篇方向" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(screen.getByText("想看三个完全不同的开篇方向")).toBeInTheDocument();
    expect(screen.getByText("已记录为发散请求，后续任务会在这里继续展开。")).toBeInTheDocument();
  });

  it("ignores blank input when submitting", () => {
    render(<AppShell />);

    fireEvent.change(screen.getByLabelText("chat-composer"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(screen.queryByText(/已记录为.+请求/)).not.toBeInTheDocument();
    expect(screen.queryByText("   ")).not.toBeInTheDocument();
  });

  it("updates each assistant placeholder independently when replies resolve out of order", async () => {
    const firstReply = createDeferred<{ assistantMessage: { role: "assistant"; content: string } }>();
    const secondReply = createDeferred<{ assistantMessage: { role: "assistant"; content: string } }>();

    installInkbloomSendChatTurnMock(
      vi
        .fn()
        .mockReturnValueOnce(firstReply.promise)
        .mockReturnValueOnce(secondReply.promise),
    );

    render(<AppShell />);

    fireEvent.change(screen.getByLabelText("chat-composer"), {
      target: { value: "第一条消息" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    fireEvent.change(screen.getByLabelText("chat-composer"), {
      target: { value: "第二条消息" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    secondReply.resolve({
      assistantMessage: {
        role: "assistant",
        content: "第二条已完成",
      },
    });

    await waitFor(() => {
      expect(screen.getByText("第二条已完成")).toBeInTheDocument();
    });

    firstReply.resolve({
      assistantMessage: {
        role: "assistant",
        content: "第一条已完成",
      },
    });

    await waitFor(() => {
      expect(screen.getByText("第一条已完成")).toBeInTheDocument();
      expect(screen.getByText("第二条已完成")).toBeInTheDocument();
    });
  });

  it("replaces the assistant placeholder with an explicit error message when routing fails", async () => {
    installInkbloomSendChatTurnMock(vi.fn().mockRejectedValueOnce(new Error("routing failed")));

    render(<AppShell />);

    fireEvent.change(screen.getByLabelText("chat-composer"), {
      target: { value: "帮我整理这个想法" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => {
      expect(screen.getByText("请求执行失败：routing failed")).toBeInTheDocument();
    });

    expect(screen.queryByText("已记录为整理请求，后续任务会在这里继续展开。")).not.toBeInTheDocument();
  });
});
