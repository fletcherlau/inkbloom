// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AppShell } from "../layout/app-shell";
import { workspaceStore } from "../../stores/workspace-store";
import { ChatPanel } from "./chat-panel";

describe("ChatPanel", () => {
  beforeEach(() => {
    workspaceStore.resetForTests();
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
});
