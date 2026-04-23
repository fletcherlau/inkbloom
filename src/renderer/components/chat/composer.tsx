import { FormEvent } from "react";

import type { ChatActionMode } from "../../stores/workspace-store";
import { modeLabels } from "../../stores/workspace-store";

type ComposerProps = {
  draftMessage: string;
  selectedMode: ChatActionMode;
  onDraftChange: (value: string) => void;
  onModeChange: (mode: ChatActionMode) => void;
  onSubmit: () => void;
};

const actionModes = Object.keys(modeLabels) as ChatActionMode[];

export function Composer({
  draftMessage,
  selectedMode,
  onDraftChange,
  onModeChange,
  onSubmit,
}: ComposerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div aria-label="chat-actions" style={styles.actions}>
        {actionModes.map((mode) => {
          const isActive = mode === selectedMode;

          return (
            <button
              key={mode}
              type="button"
              aria-pressed={isActive}
              onClick={() => onModeChange(mode)}
              style={{
                ...styles.actionButton,
                ...(isActive ? styles.actionButtonActive : null),
              }}
            >
              {modeLabels[mode]}
            </button>
          );
        })}
      </div>
      <label style={styles.label}>
        <span>创作输入</span>
        <textarea
          aria-label="chat-composer"
          value={draftMessage}
          placeholder="描述你现在要推进的创作问题"
          onChange={(event) => onDraftChange(event.target.value)}
          style={styles.textarea}
        />
      </label>
      <div style={styles.footer}>
        <p style={styles.hint}>先在对话里整理思路，再决定是否写回设定或转成任务。</p>
        <button type="submit" style={styles.submitButton}>
          发送
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: {
    display: "grid",
    gap: "1rem",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.75rem",
  },
  actionButton: {
    borderWidth: "1px",
    borderStyle: "solid" as const,
    borderColor: "#cdbfa4",
    borderRadius: "999px",
    background: "#f3ead8",
    color: "#3b2f2f",
    padding: "0.45rem 0.9rem",
    cursor: "pointer",
  },
  actionButtonActive: {
    background: "#d78b48",
    borderColor: "#d78b48",
    color: "#fffaf2",
  },
  label: {
    display: "grid",
    gap: "0.5rem",
    fontWeight: 600,
  },
  textarea: {
    minHeight: "7rem",
    resize: "vertical" as const,
    borderRadius: "14px",
    border: "1px solid #d7d2c8",
    padding: "0.9rem 1rem",
    font: "inherit",
    background: "#fffdf8",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },
  hint: {
    margin: 0,
    color: "#6b6257",
    fontSize: "0.95rem",
  },
  submitButton: {
    border: 0,
    borderRadius: "999px",
    background: "#20252b",
    color: "#fffdf8",
    padding: "0.6rem 1.1rem",
    cursor: "pointer",
  },
};
