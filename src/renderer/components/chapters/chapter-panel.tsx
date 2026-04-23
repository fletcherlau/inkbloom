import { useState } from "react";

import { chapterEditorPlaceholder, createMinimalTiptapConfig } from "../../lib/tiptap";

type ChapterPanelProps = {
  title: string;
  relativeManuscriptPath: string;
  initialContent?: string;
};

type ManuscriptApiWindow = Window & {
  inkbloom?: {
    saveChapterDraft?: (input: {
      relativeManuscriptPath: string;
      content: string;
    }) => Promise<{ filePath: string }>;
  };
};

const tiptapConfig = createMinimalTiptapConfig();

export function ChapterPanel({
  title,
  relativeManuscriptPath,
  initialContent = "",
}: ChapterPanelProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState("等待保存");
  const [isSaving, setIsSaving] = useState(false);

  const canSave = relativeManuscriptPath.trim().length > 0 && isSaving === false;

  async function handleSave() {
    const saveDraft = (window as ManuscriptApiWindow).inkbloom?.saveChapterDraft;

    if (saveDraft === undefined) {
      setStatus("当前环境未连接保存能力");
      return;
    }

    setIsSaving(true);
    setStatus("保存中...");

    try {
      const result = await saveDraft({ relativeManuscriptPath, content });
      setStatus(`已保存到 ${result.filePath}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown error";
      setStatus(`保存失败：${message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="chapter-panel-title" style={styles.panel}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Chapter Draft</p>
          <h2 id="chapter-panel-title" style={styles.title}>
            {title}
          </h2>
        </div>
        <button type="button" onClick={() => void handleSave()} disabled={!canSave} style={styles.button}>
          {isSaving ? "保存中..." : "保存草稿"}
        </button>
      </header>
      <p style={styles.filePath}>
        {relativeManuscriptPath ? `manuscript/${relativeManuscriptPath}` : "尚未绑定章节文件路径"}
      </p>
      <textarea
        aria-label="chapter-editor"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={tiptapConfig.placeholder ?? chapterEditorPlaceholder}
        style={styles.editor}
      />
      <p aria-live="polite" style={styles.status}>
        {status}
      </p>
    </section>
  );
}

const styles = {
  panel: {
    display: "grid",
    gap: "0.75rem",
    padding: "1rem 1.1rem",
    borderRadius: "1rem",
    background: "rgba(255, 250, 240, 0.78)",
    border: "1px solid rgba(138, 90, 43, 0.16)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    alignItems: "flex-start",
  },
  eyebrow: {
    margin: 0,
    color: "#8a5a2b",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  title: {
    margin: "0.15rem 0 0",
    fontSize: "1.15rem",
  },
  filePath: {
    margin: 0,
    color: "#6b6257",
    fontSize: "0.88rem",
    wordBreak: "break-all" as const,
  },
  editor: {
    minHeight: "11rem",
    resize: "vertical" as const,
    borderRadius: "0.9rem",
    border: "1px solid rgba(138, 90, 43, 0.2)",
    padding: "0.9rem",
    font: "inherit",
    lineHeight: 1.6,
    color: "#2f2721",
    background: "#fffdf8",
  },
  button: {
    border: "none",
    borderRadius: "999px",
    padding: "0.7rem 1rem",
    background: "#8a5a2b",
    color: "#fff8ef",
    fontWeight: 700,
    cursor: "pointer",
  },
  status: {
    margin: 0,
    color: "#6b6257",
    fontSize: "0.88rem",
  },
};
