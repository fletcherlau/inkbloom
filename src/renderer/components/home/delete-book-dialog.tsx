import type { BookSummary } from "@shared/contracts";

export function DeleteBookDialog(props: {
  book: BookSummary | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  if (!props.book) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="delete-book-dialog-title" style={styles.backdrop}>
      <div style={styles.dialog}>
        <h2 id="delete-book-dialog-title" style={styles.title}>
          删除书籍
        </h2>
        <p style={styles.copy}>
          将删除《{props.book.title}》的本地目录与书架记录。这个操作不可撤销。
        </p>
        <div style={styles.actions}>
          <button type="button" style={styles.secondaryButton} onClick={props.onClose}>
            取消
          </button>
          <button type="button" style={styles.dangerButton} onClick={() => void props.onConfirm()}>
            确认删除
          </button>
        </div>
      </div>
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
    gap: "0.9rem",
    padding: "1.4rem",
    borderRadius: "1rem",
    background: "#fffaf4",
    boxShadow: "0 20px 60px rgba(33, 24, 19, 0.22)",
  },
  title: {
    margin: 0,
    color: "#2f2721",
  },
  copy: {
    margin: 0,
    color: "#66584a",
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    justifyContent: "end",
    gap: "0.75rem",
  },
  secondaryButton: {
    borderRadius: "999px",
    border: "1px solid #ceb89c",
    background: "white",
    color: "#2f2721",
    padding: "0.75rem 1.1rem",
    cursor: "pointer",
  },
  dangerButton: {
    border: "none",
    borderRadius: "999px",
    background: "#a44735",
    color: "#fff8f2",
    padding: "0.75rem 1.1rem",
    cursor: "pointer",
  },
};
