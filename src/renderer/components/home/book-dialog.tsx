import { useEffect, useState } from "react";

import type { BookSummary } from "@shared/contracts";

export function BookDialog(props: {
  isOpen: boolean;
  book: BookSummary | null;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(props.book?.title ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(props.book?.title ?? "");
    setIsSubmitting(false);
  }, [props.book, props.isOpen]);

  if (!props.isOpen) {
    return null;
  }

  const heading = props.book ? "修改书籍" : "新建书籍";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await props.onSubmit(title);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="book-dialog-title" style={styles.backdrop}>
      <form style={styles.dialog} onSubmit={handleSubmit}>
        <h2 id="book-dialog-title" style={styles.title}>
          {heading}
        </h2>
        <label style={styles.label}>
          书名
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：长夜港"
            style={styles.input}
          />
        </label>
        <div style={styles.actions}>
          <button type="button" style={styles.secondaryButton} onClick={props.onClose}>
            取消
          </button>
          <button type="submit" style={styles.primaryButton} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(21, 17, 13, 0.45)",
    display: "grid",
    placeItems: "center",
    padding: "1rem",
  },
  dialog: {
    width: "min(28rem, 100%)",
    display: "grid",
    gap: "1rem",
    padding: "1.4rem",
    borderRadius: "1rem",
    background: "#fffaf4",
    boxShadow: "0 20px 60px rgba(33, 24, 19, 0.22)",
  },
  title: {
    margin: 0,
    color: "#2f2721",
  },
  label: {
    display: "grid",
    gap: "0.5rem",
    color: "#54463b",
  },
  input: {
    borderRadius: "0.8rem",
    border: "1px solid #ceb89c",
    padding: "0.8rem 0.9rem",
    fontSize: "1rem",
  },
  actions: {
    display: "flex",
    justifyContent: "end",
    gap: "0.75rem",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#2f2721",
    color: "#f7f1e8",
    padding: "0.75rem 1.1rem",
    cursor: "pointer",
  },
  secondaryButton: {
    borderRadius: "999px",
    border: "1px solid #ceb89c",
    background: "white",
    color: "#2f2721",
    padding: "0.75rem 1.1rem",
    cursor: "pointer",
  },
};
