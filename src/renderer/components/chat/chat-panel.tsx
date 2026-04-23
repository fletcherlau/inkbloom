import { useMemo, useState } from "react";

import type { BibleItemType, WorkflowStage } from "@shared/contracts";
import type { ChatActionMode, ChatMessage } from "../../stores/workspace-store";
import { Composer } from "./composer";
import { MessageList } from "./message-list";

type ChatPanelProps = {
  messages: readonly ChatMessage[];
  draftMessage?: string;
  selectedMode?: ChatActionMode;
  onDraftChange?: (value: string) => void;
  onModeChange?: (mode: ChatActionMode) => void;
  onSend: (input: { mode: ChatActionMode; content: string }) => void;
};

type ChatSendResult = {
  assistantMessage: {
    role: "assistant";
    content: string;
  };
  saveTargets?: readonly ("story-bible" | "chapter" | "task")[];
  skillResult?: {
    skill: "capture_braindump" | "next_step_guide" | "consistency_check" | "shape_synopsis";
    summary: string;
    payload: Record<string, string>;
  };
};

type ChatRequestContext = {
  activeBibleType?: BibleItemType;
  stage?: WorkflowStage;
  characters?: string[];
  styleSummary?: string;
  chapterTitle?: string;
};

type ChatApiWindow = Window & {
  inkbloom?: {
    sendChatTurn?: (input: {
      mode: ChatActionMode;
      content: string;
      context?: ChatRequestContext;
    }) => Promise<ChatSendResult>;
  };
};

export function ChatPanel({
  messages,
  draftMessage = "",
  selectedMode = "organize",
  onDraftChange = () => undefined,
  onModeChange = () => undefined,
  onSend,
}: ChatPanelProps) {
  const [assistantOverrides, setAssistantOverrides] = useState<Record<string, string>>({});
  const [saveTargets, setSaveTargets] = useState<readonly ("story-bible" | "chapter" | "task")[]>([]);

  const visibleMessages = useMemo(() => {
    if (Object.keys(assistantOverrides).length === 0) {
      return messages;
    }

    return messages.map((message) =>
      assistantOverrides[message.id] === undefined
        ? message
        : { ...message, content: assistantOverrides[message.id] },
    );
  }, [assistantOverrides, messages]);

  function handleSend() {
    const content = draftMessage.trim();

    if (!content) {
      return;
    }

    const assistantId = `assistant-${messages.length + 2}`;
    onSend({ mode: selectedMode, content });

    const sendChatTurn = (window as ChatApiWindow).inkbloom?.sendChatTurn;

    if (sendChatTurn === undefined) {
      setSaveTargets([]);
      return;
    }

    void sendChatTurn({
      mode: selectedMode,
      content,
      context: buildChatRequestContext(selectedMode, content),
    })
      .then((result) => {
        setAssistantOverrides((currentOverrides) => ({
          ...currentOverrides,
          [assistantId]: result.assistantMessage.content,
        }));
        setSaveTargets(result.saveTargets ?? []);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "unknown error";

        setAssistantOverrides((currentOverrides) => ({
          ...currentOverrides,
          [assistantId]: `请求执行失败：${message}`,
        }));
        setSaveTargets([]);
      });
  }

  return (
    <section aria-labelledby="chat-panel-title" style={styles.panel}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Chat-First Workspace</p>
          <h2 id="chat-panel-title" style={styles.title}>
            创作对话
          </h2>
        </div>
        <p style={styles.description}>尽量在聊天里推进想法，再决定是否写回 Story Bible 或转为后续任务。</p>
      </header>
      <div style={styles.body}>
        <MessageList messages={visibleMessages} />
      </div>
      {saveTargets.length > 0 ? (
        <section aria-label="save-affordances" style={styles.affordances}>
          <p style={styles.affordanceLabel}>将本轮结果继续落到项目资产：</p>
          <div style={styles.affordanceActions}>
            {saveTargets.includes("story-bible") ? (
              <button type="button" style={styles.affordanceButton}>
                保存到 Story Bible
              </button>
            ) : null}
            {saveTargets.includes("chapter") ? (
              <button type="button" style={styles.affordanceButton}>
                保存到章节
              </button>
            ) : null}
            {saveTargets.includes("task") ? (
              <button type="button" style={styles.affordanceButton}>
                转成任务
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
      <Composer
        draftMessage={draftMessage}
        selectedMode={selectedMode}
        onDraftChange={onDraftChange}
        onModeChange={onModeChange}
        onSubmit={handleSend}
      />
    </section>
  );
}

function buildChatRequestContext(
  mode: ChatActionMode,
  content: string,
): ChatRequestContext | undefined {
  if (mode !== "check") {
    return undefined;
  }

  return {
    chapterTitle: "第一章草稿",
    styleSummary: "保持当前章节的叙事视角、语气与节奏一致。",
    characters: inferCharacters(content),
  };
}

function inferCharacters(content: string) {
  const firstToken = content
    .split(/[，。！？、；：\s]+/u)
    .map((token) => token.trim())
    .find((token) => token.length > 0);

  return [firstToken ?? "当前章节角色焦点"];
}

const styles = {
  panel: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: "1.25rem",
    minHeight: "100%",
  },
  header: {
    display: "grid",
    gap: "0.5rem",
  },
  eyebrow: {
    margin: 0,
    color: "#8a5a2b",
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  title: {
    margin: "0.2rem 0 0",
    fontSize: "1.8rem",
  },
  description: {
    margin: 0,
    color: "#6b6257",
    maxWidth: "42rem",
  },
  body: {
    overflow: "auto",
  },
  affordances: {
    display: "grid",
    gap: "0.6rem",
    padding: "0.9rem 1rem",
    borderRadius: "16px",
    border: "1px solid #d8c6a7",
    background: "#fff8ee",
  },
  affordanceLabel: {
    margin: 0,
    color: "#6b6257",
    fontSize: "0.92rem",
  },
  affordanceActions: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.65rem",
  },
  affordanceButton: {
    padding: "0.55rem 0.85rem",
    borderRadius: "999px",
    border: "1px solid #c9873f",
    background: "#f2ddbf",
    color: "#3e2b18",
    cursor: "pointer",
    fontWeight: 600,
  },
};
