import type { ChatMessage } from "../../stores/workspace-store";

type MessageListProps = {
  messages: readonly ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return <p>先描述你现在卡住的问题，Inkbloom 会从聊天开始帮你整理。</p>;
  }

  return (
    <ul aria-label="chat-messages" style={styles.list}>
      {messages.map((message) => (
        <li key={message.id} style={styles.item}>
          <strong>{message.role === "user" ? "你" : "Inkbloom"}</strong>
          <p style={styles.content}>{message.content}</p>
        </li>
      ))}
    </ul>
  );
}

const styles = {
  list: {
    display: "grid",
    gap: "0.75rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    border: "1px solid #d7d2c8",
    borderRadius: "14px",
    padding: "0.9rem 1rem",
    background: "#fffdf8",
  },
  content: {
    margin: "0.35rem 0 0",
    whiteSpace: "pre-wrap" as const,
  },
};
