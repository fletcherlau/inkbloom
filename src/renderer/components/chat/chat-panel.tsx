import { useMemo, useState } from "react";

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
};

type ChatApiWindow = Window & {
  inkbloom?: {
    sendChatTurn?: (input: {
      mode: ChatActionMode;
      content: string;
      context?: Record<string, never>;
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
      return;
    }

    void sendChatTurn({ mode: selectedMode, content, context: {} })
      .then((result) => {
        setAssistantOverrides((currentOverrides) => ({
          ...currentOverrides,
          [assistantId]: result.assistantMessage.content,
        }));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "unknown error";

        setAssistantOverrides((currentOverrides) => ({
          ...currentOverrides,
          [assistantId]: `请求执行失败：${message}`,
        }));
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
};
